export const VOUCHER_EVENTS = {
  SUBMITTED: 'voucher.submitted',
  APPROVED: 'voucher.approved',
  REJECTED: 'voucher.rejected',
  REVERSED: 'voucher.reversed',
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
