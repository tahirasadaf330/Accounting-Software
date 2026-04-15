import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly appUrl: string;

  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {
    this.appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
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
    try {
      await this.mailerService.sendMail({
        to: params.email,
        subject: `Netting Cycle Review — ${params.contactName} (${params.startDate} to ${params.endDate})`,
        html: `
          <p>Hi ${params.name},</p>
          <p>A netting cycle for <strong>${params.contactName}</strong> requires your review.</p>
          <p><strong>Period:</strong> ${params.startDate} to ${params.endDate}</p>
          <p>Please click the link below to review and approve/reject:</p>
          <p><a href="${cycleUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Review Netting Cycle</a></p>
          <p>— ${params.companyName}</p>
        `,
      });
      this.logger.log(`Netting cycle review email sent to ${params.email}`);
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
