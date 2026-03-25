export enum VoucherType {
  PAYMENT = 'PAYMENT',
  RECEIPT = 'RECEIPT',
  JOURNAL = 'JOURNAL',
  CONTRA = 'CONTRA',
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
}

export enum VoucherStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

export const VOUCHER_TYPE_PREFIX: Record<VoucherType, string> = {
  [VoucherType.PAYMENT]: 'PV',
  [VoucherType.RECEIPT]: 'RV',
  [VoucherType.JOURNAL]: 'JV',
  [VoucherType.CONTRA]: 'CV',
  [VoucherType.SALES]: 'SV',
  [VoucherType.PURCHASE]: 'PUR',
  [VoucherType.CREDIT_NOTE]: 'CN',
  [VoucherType.DEBIT_NOTE]: 'DN',
};

export const EDITABLE_STATUSES = [VoucherStatus.DRAFT, VoucherStatus.REJECTED] as const;

export const VALID_STATUS_TRANSITIONS: Record<VoucherStatus, VoucherStatus[]> = {
  [VoucherStatus.DRAFT]: [VoucherStatus.PENDING_APPROVAL],
  [VoucherStatus.PENDING_APPROVAL]: [VoucherStatus.APPROVED, VoucherStatus.REJECTED],
  [VoucherStatus.APPROVED]: [VoucherStatus.POSTED],
  [VoucherStatus.REJECTED]: [VoucherStatus.PENDING_APPROVAL],
  [VoucherStatus.POSTED]: [VoucherStatus.REVERSED],
  [VoucherStatus.REVERSED]: [],
};
