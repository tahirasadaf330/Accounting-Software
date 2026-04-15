import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  VOUCHER_EVENTS,
  VoucherSubmittedPayload,
  VoucherApprovedPayload,
  VoucherRejectedPayload,
  VoucherReversedPayload,
} from './events/voucher-events';

@Injectable()
export class NotificationEventsListener {
  private readonly logger = new Logger(NotificationEventsListener.name);

  constructor(
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private async sendVoucherEmails(
    recipientIds: string[],
    tenantId: string,
    subject: string,
    voucherNumber: string,
    actorName: string,
    action: string,
    message: string,
  ) {
    try {
      const users = await this.prisma.user.findMany({
        where: { id: { in: recipientIds }, status: 'ACTIVE' },
        select: { email: true, firstName: true },
      });

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });

      const companyName = tenant?.name || 'Accounting SaaS';

      // Email notifications for voucher events disabled
      // In-app notifications are still created separately
    } catch (error) {
      this.logger.error(`Failed to send voucher emails: ${error}`);
    }
  }

  @OnEvent(VOUCHER_EVENTS.SUBMITTED, { async: true })
  async handleVoucherSubmitted(payload: VoucherSubmittedPayload) {
    this.logger.log(
      `Received VOUCHER_SUBMITTED event for voucher ${payload.voucherNumber}`,
    );
    try {
      const recipients = await this.notificationsService.findUsersByRoles(
        payload.tenantId,
        ['OWNER', 'CHIEF_ACCOUNTANT'],
      );

      this.logger.log(
        `Found ${recipients.length} OWNER/CHIEF_ACCOUNTANT recipients, actorId: ${payload.actorId}`,
      );

      const filteredRecipients = recipients.filter(
        (u) => u.id !== payload.actorId,
      );

      if (filteredRecipients.length === 0) {
        this.logger.log('No recipients after filtering, skipping');
        return;
      }

      await this.notificationsService.createMany(
        filteredRecipients.map((u) => ({
          tenantId: payload.tenantId,
          userId: u.id,
          type: NotificationType.VOUCHER_SUBMITTED,
          title: 'Voucher Submitted for Approval',
          message: `${payload.actorName} submitted voucher ${payload.voucherNumber} for approval.`,
          referenceId: payload.voucherId,
          referenceType: 'VOUCHER',
        })),
      );

      await this.sendVoucherEmails(
        filteredRecipients.map((u) => u.id),
        payload.tenantId,
        'Voucher Submitted for Approval',
        payload.voucherNumber,
        payload.actorName,
        'Voucher Submitted',
        `${payload.actorName} submitted voucher ${payload.voucherNumber} for approval.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create notifications for voucher submitted: ${error}`,
      );
    }
  }

  @OnEvent(VOUCHER_EVENTS.APPROVED, { async: true })
  async handleVoucherApproved(payload: VoucherApprovedPayload) {
    this.logger.log(
      `Received VOUCHER_APPROVED event for voucher ${payload.voucherNumber}`,
    );
    try {
      // Notify the voucher creator
      const recipientIds = new Set<string>();
      if (payload.createdById !== payload.actorId) {
        recipientIds.add(payload.createdById);
      }

      // Also notify all accountants (excluding the approver)
      const accountants = await this.notificationsService.findUsersByRoles(
        payload.tenantId,
        ['ACCOUNTANT'],
      );
      for (const u of accountants) {
        if (u.id !== payload.actorId) {
          recipientIds.add(u.id);
        }
      }

      if (recipientIds.size === 0) return;

      await this.notificationsService.createMany(
        Array.from(recipientIds).map((userId) => ({
          tenantId: payload.tenantId,
          userId,
          type: NotificationType.VOUCHER_APPROVED,
          title: 'Voucher Approved & Posted',
          message: `Voucher ${payload.voucherNumber} has been approved and posted by ${payload.actorName}.`,
          referenceId: payload.voucherId,
          referenceType: 'VOUCHER',
        })),
      );

      await this.sendVoucherEmails(
        Array.from(recipientIds),
        payload.tenantId,
        'Voucher Approved & Posted',
        payload.voucherNumber,
        payload.actorName,
        'Voucher Approved',
        `Voucher ${payload.voucherNumber} has been approved and posted by ${payload.actorName}.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create notifications for voucher approved: ${error}`,
      );
    }
  }

  @OnEvent(VOUCHER_EVENTS.REJECTED, { async: true })
  async handleVoucherRejected(payload: VoucherRejectedPayload) {
    this.logger.log(
      `Received VOUCHER_REJECTED event for voucher ${payload.voucherNumber}`,
    );
    try {
      if (payload.createdById === payload.actorId) return;

      await this.notificationsService.create({
        tenantId: payload.tenantId,
        userId: payload.createdById,
        type: NotificationType.VOUCHER_REJECTED,
        title: 'Voucher Rejected',
        message: `Voucher ${payload.voucherNumber} was rejected by ${payload.actorName}. Reason: ${payload.rejectionReason}`,
        referenceId: payload.voucherId,
        referenceType: 'VOUCHER',
      });

      await this.sendVoucherEmails(
        [payload.createdById],
        payload.tenantId,
        'Voucher Rejected',
        payload.voucherNumber,
        payload.actorName,
        'Voucher Rejected',
        `Voucher ${payload.voucherNumber} was rejected by ${payload.actorName}. Reason: ${payload.rejectionReason}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create notification for voucher rejected: ${error}`,
      );
    }
  }

  @OnEvent(VOUCHER_EVENTS.REVERSED, { async: true })
  async handleVoucherReversed(payload: VoucherReversedPayload) {
    this.logger.log(
      `Received VOUCHER_REVERSED event for voucher ${payload.voucherNumber}`,
    );
    try {
      if (payload.createdById === payload.actorId) return;

      await this.notificationsService.create({
        tenantId: payload.tenantId,
        userId: payload.createdById,
        type: NotificationType.VOUCHER_REVERSED,
        title: 'Voucher Reversed',
        message: `Voucher ${payload.voucherNumber} has been reversed by ${payload.actorName}.`,
        referenceId: payload.voucherId,
        referenceType: 'VOUCHER',
      });

      await this.sendVoucherEmails(
        [payload.createdById],
        payload.tenantId,
        'Voucher Reversed',
        payload.voucherNumber,
        payload.actorName,
        'Voucher Reversed',
        `Voucher ${payload.voucherNumber} has been reversed by ${payload.actorName}.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create notification for voucher reversed: ${error}`,
      );
    }
  }
}
