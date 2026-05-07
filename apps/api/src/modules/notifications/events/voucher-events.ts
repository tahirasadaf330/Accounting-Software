export const VOUCHER_EVENTS = {
  SUBMITTED: 'voucher.submitted',
  APPROVED: 'voucher.approved',
  REJECTED: 'voucher.rejected',
  REVERSED: 'voucher.reversed',
  MARKED_PAID: 'voucher.markedPaid',
  COMMENT_ADDED: 'voucher.commentAdded',
} as const;

export interface VoucherSubmittedPayload {
  tenantId: string;
  voucherId: string;
  voucherNumber: string;
  actorId: string;
  actorName: string;
  createdById: string;
}

export interface VoucherApprovedPayload {
  tenantId: string;
  voucherId: string;
  voucherNumber: string;
  actorId: string;
  actorName: string;
  createdById: string;
}

export interface VoucherRejectedPayload {
  tenantId: string;
  voucherId: string;
  voucherNumber: string;
  actorId: string;
  actorName: string;
  createdById: string;
  rejectionReason: string;
}

export interface VoucherReversedPayload {
  tenantId: string;
  voucherId: string;
  voucherNumber: string;
  actorId: string;
  actorName: string;
  createdById: string;
}

export interface VoucherMarkedPaidPayload {
  tenantId: string;
  voucherId: string;
  voucherNumber: string;
  paymentVoucherId: string;
  paymentVoucherNumber: string;
  amount: string;
  paymentDate: string;
  isAR: boolean;
  contactName: string;
  actorId: string;
  actorName: string;
}

export interface VoucherCommentAddedPayload {
  tenantId: string;
  voucherId: string;
  voucherNumber: string;
  commentId: string;
  commentBody: string;
  actorId: string;
  actorName: string;
}
