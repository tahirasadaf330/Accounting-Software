import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly appUrl: string;
  private graphAccessToken: string | null = null;
  private graphTokenExpiresAt: number = 0;

  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {
    this.appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
  }

  /**
   * Get Microsoft Graph API access token (client credentials flow).
   * Caches token until it expires.
   */
  private async getGraphToken(): Promise<string | null> {
    const tenantId = this.config.get<string>('GRAPH_TENANT_ID');
    const clientId = this.config.get<string>('GRAPH_CLIENT_ID');
    const clientSecret = this.config.get<string>('GRAPH_CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) return null;

    // Return cached token if still valid (with 60s buffer)
    if (this.graphAccessToken && Date.now() < this.graphTokenExpiresAt - 60000) {
      return this.graphAccessToken;
    }

    try {
      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      });

      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`Graph token request failed: ${res.status} ${err}`);
        return null;
      }

      const data = (await res.json()) as { access_token: string; expires_in: number };
      this.graphAccessToken = data.access_token;
      this.graphTokenExpiresAt = Date.now() + data.expires_in * 1000;
      return this.graphAccessToken;
    } catch (error) {
      this.logger.error(`Failed to get Graph token: ${error}`);
      return null;
    }
  }

  /**
   * Send email via Microsoft Graph API.
   * Returns true if sent successfully, false otherwise.
   */
  async sendViaGraph(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    const token = await this.getGraphToken();
    const sender = this.config.get<string>('GRAPH_SENDER_EMAIL');

    if (!token || !sender) return false;

    try {
      const url = `https://graph.microsoft.com/v1.0/users/${sender}/sendMail`;
      const body = {
        message: {
          subject: params.subject,
          body: { contentType: 'HTML', content: params.html },
          toRecipients: [{ emailAddress: { address: params.to } }],
        },
        saveToSentItems: true,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`Graph sendMail failed (${res.status}): ${err}`);
        return false;
      }

      this.logger.log(`Graph email sent to ${params.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Graph sendMail error: ${error}`);
      return false;
    }
  }

  async sendPasswordReset(params: {
    email: string;
    firstName: string;
    token: string;
    companyName?: string;
  }) {
    const resetUrl = `${this.appUrl}/reset-password?token=${params.token}`;
    try {
      await this.mailerService.sendMail({
        to: params.email,
        subject: 'Reset Your Password',
        template: 'password-reset',
        context: {
          firstName: params.firstName,
          resetUrl,
          companyName: params.companyName || 'Accounting SaaS',
        },
      });
      this.logger.log(`Password reset email sent to ${params.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${params.email}: ${error}`,
      );
    }
  }

  async sendInvitation(params: {
    email: string;
    firstName: string;
    lastName: string;
    inviterName: string;
    companyName: string;
    role: string;
    token: string;
  }) {
    const invitationUrl = `${this.appUrl}/invitation/${params.token}`;
    try {
      await this.mailerService.sendMail({
        to: params.email,
        subject: `You're invited to join ${params.companyName}`,
        template: 'invitation',
        context: {
          firstName: params.firstName,
          lastName: params.lastName,
          inviterName: params.inviterName,
          companyName: params.companyName,
          role: params.role.replace('_', ' '),
          invitationUrl,
        },
      });
      this.logger.log(`Invitation email sent to ${params.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email to ${params.email}: ${error}`,
      );
    }
  }

  async sendNettingCycleReview(params: {
    email: string;
    name: string;
    contactName: string;
    cycleId: string;
    startDate: string;
    endDate: string;
    companyName: string;
  }) {
    const cycleUrl = `${this.appUrl}/netting-review/${params.cycleId}`;
    const subject = `Netting Cycle Review — ${params.contactName} (${params.startDate} to ${params.endDate})`;
    const html = `
      <p>Hi ${params.name},</p>
      <p>A netting cycle for <strong>${params.contactName}</strong> requires your review.</p>
      <p><strong>Period:</strong> ${params.startDate} to ${params.endDate}</p>
      <p>Please click the link below to review and approve/reject:</p>
      <p><a href="${cycleUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Review Netting Cycle</a></p>
      <p>— ${params.companyName}</p>
    `;

    // Try Graph API first
    const sentViaGraph = await this.sendViaGraph({ to: params.email, subject, html });
    if (sentViaGraph) return;

    // Fallback to SMTP
    try {
      await this.mailerService.sendMail({ to: params.email, subject, html });
      this.logger.log(`Netting cycle review email sent via SMTP to ${params.email}`);
    } catch (error) {
      this.logger.error(`Failed to send netting cycle email to ${params.email}: ${error}`);
    }
  }

  async sendVoucherNotification(params: {
    email: string;
    firstName: string;
    companyName: string;
    subject: string;
    voucherNumber: string;
    actorName: string;
    action: string;
    message: string;
  }) {
    const dashboardUrl = `${this.appUrl}/dashboard/vouchers`;
    try {
      await this.mailerService.sendMail({
        to: params.email,
        subject: params.subject,
        template: 'voucher-notification',
        context: {
          firstName: params.firstName,
          companyName: params.companyName,
          voucherNumber: params.voucherNumber,
          actorName: params.actorName,
          action: params.action,
          message: params.message,
          dashboardUrl,
        },
      });
      this.logger.log(
        `Voucher notification email sent to ${params.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send voucher notification email to ${params.email}: ${error}`,
      );
    }
  }
}
