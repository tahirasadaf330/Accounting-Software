import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

type DeliveryChannel = 'graph' | 'smtp' | 'none';

interface DeliveryResult {
  success: boolean;
  via: DeliveryChannel;
  reason?: string;
}

interface DispatchParams {
  to: string | string[];
  subject: string;
  html?: string;
  template?: string;
  context?: Record<string, unknown>;
  cc?: string | string[];
  bcc?: string | string[];
}

interface CalendarEventParams {
  to: string | string[];
  subject: string;
  body: string;
  startDateTime: string | Date;
  endDateTime: string | Date;
  timeZone?: string;
  location?: string;
  organizerName?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly appUrl: string;
  private graphAccessToken: string | null = null;
  private graphTokenExpiresAt: number = 0;
  private readonly templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {
    this.appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
  }

  /**
   * Acquire a Microsoft Graph access token via client-credentials flow.
   * Returns null when credentials are missing or the token request fails —
   * callers treat that as the signal to fall back to SMTP.
   */
  private async getGraphToken(): Promise<string | null> {
    const tenantId = this.config.get<string>('GRAPH_TENANT_ID');
    const clientId = this.config.get<string>('GRAPH_CLIENT_ID');
    const clientSecret = this.config.get<string>('GRAPH_CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) return null;

    if (this.graphAccessToken && Date.now() < this.graphTokenExpiresAt - 60_000) {
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
   * Resolve a Handlebars template by name. Searches the build output and the
   * source tree so it works in both compiled and ts-node/dev runs.
   */
  private async renderTemplate(name: string, context: Record<string, unknown>): Promise<string | null> {
    let tpl = this.templateCache.get(name);
    if (!tpl) {
      const candidates = [
        join(__dirname, 'templates', `${name}.hbs`),
        join(process.cwd(), 'dist', 'modules', 'mail', 'templates', `${name}.hbs`),
        join(process.cwd(), 'apps', 'api', 'dist', 'modules', 'mail', 'templates', `${name}.hbs`),
        join(process.cwd(), 'apps', 'api', 'src', 'modules', 'mail', 'templates', `${name}.hbs`),
        join(process.cwd(), 'src', 'modules', 'mail', 'templates', `${name}.hbs`),
      ];
      const found = candidates.find((p) => existsSync(p));
      if (!found) {
        this.logger.warn(`Template "${name}" not found locally; Graph send will be skipped`);
        return null;
      }
      try {
        const src = await fs.readFile(found, 'utf-8');
        tpl = Handlebars.compile(src);
        this.templateCache.set(name, tpl);
      } catch (error) {
        this.logger.warn(`Failed to compile template "${name}": ${error}`);
        return null;
      }
    }
    try {
      return tpl(context);
    } catch (error) {
      this.logger.warn(`Failed to render template "${name}": ${error}`);
      return null;
    }
  }

  private toRecipientList(addr: string | string[]): { emailAddress: { address: string } }[] {
    return (Array.isArray(addr) ? addr : [addr])
      .filter(Boolean)
      .map((address) => ({ emailAddress: { address } }));
  }

  /**
   * Send an HTML email via Microsoft Graph. Returns false to signal callers to
   * fall back to SMTP (no exception is thrown for expected failures).
   */
  async sendViaGraph(params: {
    to: string | string[];
    subject: string;
    html: string;
    cc?: string | string[];
    bcc?: string | string[];
  }): Promise<boolean> {
    const token = await this.getGraphToken();
    const sender = this.config.get<string>('GRAPH_SENDER_EMAIL');

    if (!token || !sender) return false;

    try {
      const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`;
      const message: Record<string, unknown> = {
        subject: params.subject,
        body: { contentType: 'HTML', content: params.html },
        toRecipients: this.toRecipientList(params.to),
      };
      if (params.cc) message.ccRecipients = this.toRecipientList(params.cc);
      if (params.bcc) message.bccRecipients = this.toRecipientList(params.bcc);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, saveToSentItems: true }),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`Graph sendMail failed (${res.status}): ${err}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Graph sendMail error: ${error}`);
      return false;
    }
  }

  /**
   * Unified send path: Graph first, SMTP as fallback. Both outcomes are
   * logged with the recipient and channel for audit.
   */
  private async dispatch(params: DispatchParams): Promise<DeliveryResult> {
    const recipientLabel = Array.isArray(params.to) ? params.to.join(', ') : params.to;

    let html = params.html;
    if (!html && params.template) {
      const rendered = await this.renderTemplate(params.template, params.context ?? {});
      if (rendered) html = rendered;
    }

    if (html) {
      const ok = await this.sendViaGraph({
        to: params.to,
        subject: params.subject,
        html,
        cc: params.cc,
        bcc: params.bcc,
      });
      if (ok) {
        this.logger.log(`[mail] delivered via Graph to ${recipientLabel} — "${params.subject}"`);
        return { success: true, via: 'graph' };
      }
      this.logger.warn(`[mail] Graph delivery unavailable for ${recipientLabel} — falling back to SMTP`);
    } else {
      this.logger.warn(`[mail] no HTML available for Graph (${recipientLabel}) — using SMTP`);
    }

    try {
      await this.mailerService.sendMail({
        to: params.to,
        subject: params.subject,
        cc: params.cc,
        bcc: params.bcc,
        ...(params.template
          ? { template: params.template, context: params.context }
          : { html: html ?? '' }),
      });
      this.logger.log(`[mail] delivered via SMTP to ${recipientLabel} — "${params.subject}"`);
      return { success: true, via: 'smtp' };
    } catch (error) {
      this.logger.error(`[mail] SMTP delivery failed for ${recipientLabel}: ${error}`);
      return { success: false, via: 'none', reason: String(error) };
    }
  }

  async sendPasswordReset(params: {
    email: string;
    firstName: string;
    token: string;
    companyName?: string;
  }): Promise<DeliveryResult> {
    const resetUrl = `${this.appUrl}/reset-password?token=${params.token}`;
    return this.dispatch({
      to: params.email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: {
        firstName: params.firstName,
        resetUrl,
        companyName: params.companyName || 'Accounting SaaS',
      },
    });
  }

  async sendInvitation(params: {
    email: string;
    firstName: string;
    lastName: string;
    inviterName: string;
    companyName: string;
    role: string;
    token: string;
  }): Promise<DeliveryResult> {
    const invitationUrl = `${this.appUrl}/invitation/${params.token}`;
    return this.dispatch({
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
  }

  async sendNettingCycleReview(params: {
    email: string;
    name: string;
    contactName: string;
    cycleId: string;
    startDate: string;
    endDate: string;
    companyName: string;
  }): Promise<DeliveryResult> {
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
    return this.dispatch({ to: params.email, subject, html });
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
  }): Promise<DeliveryResult> {
    const dashboardUrl = `${this.appUrl}/dashboard/vouchers`;
    return this.dispatch({
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
  }

  async sendInvoicePaidNotification(params: {
    email: string;
    firstName: string;
    companyName: string;
    voucherNumber: string;
    paymentVoucherNumber: string;
    amount: string;
    paymentDate: string;
    contactName: string;
    actorName: string;
    isAR: boolean;
  }): Promise<DeliveryResult> {
    const reportUrl = `${this.appUrl}/dashboard/reports?report=${params.isAR ? 'ar-report' : 'ap-report'}`;
    const subject = params.isAR
      ? `Payment received against ${params.voucherNumber}`
      : `Payment sent against ${params.voucherNumber}`;
    const action = params.isAR ? 'Payment Received' : 'Payment Sent';
    const message = params.isAR
      ? `${params.actorName} marked invoice ${params.voucherNumber} as paid. ${params.contactName} settled the outstanding amount.`
      : `${params.actorName} marked bill ${params.voucherNumber} as paid to ${params.contactName}.`;
    return this.dispatch({
      to: params.email,
      subject,
      template: 'invoice-paid',
      context: {
        firstName: params.firstName,
        companyName: params.companyName,
        voucherNumber: params.voucherNumber,
        paymentVoucherNumber: params.paymentVoucherNumber,
        amount: params.amount,
        paymentDate: params.paymentDate,
        contactName: params.contactName,
        actorName: params.actorName,
        action,
        message,
        reportUrl,
        isAR: params.isAR,
      },
    });
  }

  async sendCommentAddedNotification(params: {
    email: string;
    firstName: string;
    companyName: string;
    voucherNumber: string;
    commentBody: string;
    actorName: string;
  }): Promise<DeliveryResult> {
    const reportUrl = `${this.appUrl}/dashboard/reports`;
    const subject = `New comment on ${params.voucherNumber}`;
    return this.dispatch({
      to: params.email,
      subject,
      template: 'voucher-comment-added',
      context: {
        firstName: params.firstName,
        companyName: params.companyName,
        voucherNumber: params.voucherNumber,
        commentBody: params.commentBody,
        actorName: params.actorName,
        reportUrl,
      },
    });
  }

  /**
   * Send a calendar invitation. Tries Graph (creates an Outlook calendar event
   * with attendees, which Graph dispatches as a real calendar invite) and on
   * failure falls back to SMTP with an inline iCalendar (.ics) part.
   */
  async sendCalendarInvitation(params: CalendarEventParams): Promise<DeliveryResult> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const recipientLabel = recipients.join(', ');
    const start = new Date(params.startDateTime);
    const end = new Date(params.endDateTime);

    const graphSent = await this.sendEventViaGraph({ ...params, recipients, start, end });
    if (graphSent) {
      this.logger.log(`[calendar] invitation delivered via Graph to ${recipientLabel} — "${params.subject}"`);
      return { success: true, via: 'graph' };
    }
    this.logger.warn(`[calendar] Graph delivery unavailable for ${recipientLabel} — falling back to SMTP`);

    try {
      const ics = this.buildIcs({ ...params, recipients, start, end });
      await this.mailerService.sendMail({
        to: recipients,
        subject: params.subject,
        html: params.body,
        icalEvent: { method: 'REQUEST', filename: 'invite.ics', content: ics },
      } as Parameters<MailerService['sendMail']>[0]);
      this.logger.log(`[calendar] invitation delivered via SMTP to ${recipientLabel} — "${params.subject}"`);
      return { success: true, via: 'smtp' };
    } catch (error) {
      this.logger.error(`[calendar] SMTP delivery failed for ${recipientLabel}: ${error}`);
      return { success: false, via: 'none', reason: String(error) };
    }
  }

  private async sendEventViaGraph(args: CalendarEventParams & {
    recipients: string[];
    start: Date;
    end: Date;
  }): Promise<boolean> {
    const token = await this.getGraphToken();
    const sender = this.config.get<string>('GRAPH_SENDER_EMAIL');
    if (!token || !sender) return false;

    try {
      const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/events`;
      const tz = args.timeZone || 'UTC';
      const event: Record<string, unknown> = {
        subject: args.subject,
        body: { contentType: 'HTML', content: args.body },
        start: { dateTime: args.start.toISOString(), timeZone: tz },
        end: { dateTime: args.end.toISOString(), timeZone: tz },
        attendees: args.recipients.map((address) => ({
          emailAddress: { address },
          type: 'required',
        })),
        allowNewTimeProposals: true,
      };
      if (args.location) event.location = { displayName: args.location };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`Graph event create failed (${res.status}): ${err}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`Graph event create error: ${error}`);
      return false;
    }
  }

  private buildIcs(args: CalendarEventParams & {
    recipients: string[];
    start: Date;
    end: Date;
  }): string {
    const stamp = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const escape = (s: string) =>
      s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const organizerEmail =
      this.config.get<string>('GRAPH_SENDER_EMAIL') ||
      this.config.get<string>('SMTP_FROM_ADDRESS') ||
      'noreply@example.com';
    const organizerName = args.organizerName || 'Accounting SaaS';

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Accounting SaaS//Calendar//EN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${randomUUID()}`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(args.start)}`,
      `DTEND:${stamp(args.end)}`,
      `SUMMARY:${escape(args.subject)}`,
      `DESCRIPTION:${escape(args.body.replace(/<[^>]+>/g, ''))}`,
      ...(args.location ? [`LOCATION:${escape(args.location)}`] : []),
      `ORGANIZER;CN=${escape(organizerName)}:MAILTO:${organizerEmail}`,
      ...args.recipients.map(
        (a) => `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:MAILTO:${a}`,
      ),
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    return lines.join('\r\n');
  }
}
