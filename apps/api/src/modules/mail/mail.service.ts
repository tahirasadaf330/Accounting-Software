import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

interface DeliveryResult {
  success: boolean;
  via: 'smtp' | 'none';
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
  private readonly templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {
    this.appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
  }

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
        this.logger.warn(`Template "${name}" not found`);
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

  private async dispatch(params: DispatchParams): Promise<DeliveryResult> {
    const recipientLabel = Array.isArray(params.to) ? params.to.join(', ') : params.to;

    let html = params.html;
    if (!html && params.template) {
      const rendered = await this.renderTemplate(params.template, params.context ?? {});
      if (rendered) html = rendered;
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

  async sendCalendarInvitation(params: CalendarEventParams): Promise<DeliveryResult> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const recipientLabel = recipients.join(', ');
    const start = new Date(params.startDateTime);
    const end = new Date(params.endDateTime);

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
      this.config.get<string>('SMTP_FROM_ADDRESS') || 'donotreply@hayo.net';
    const organizerName = args.organizerName || 'Accounting System';

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Accounting System//Calendar//EN',
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
