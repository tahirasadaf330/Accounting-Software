export declare enum VoucherType {
    PAYMENT = "PAYMENT",
    RECEIPT = "RECEIPT",
    JOURNAL = "JOURNAL",
    CONTRA = "CONTRA",
    SALES = "SALES",
    PURCHASE = "PURCHASE",
    CREDIT_NOTE = "CREDIT_NOTE",
    DEBIT_NOTE = "DEBIT_NOTE"
}
export declare enum VoucherStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    POSTED = "POSTED",
    REVERSED = "REVERSED"
}
export declare const VOUCHER_TYPE_PREFIX: Record<VoucherType, string>;
export declare const EDITABLE_STATUSES: readonly [VoucherStatus.DRAFT, VoucherStatus.REJECTED];
export declare const VALID_STATUS_TRANSITIONS: Record<VoucherStatus, VoucherStatus[]>;
//# sourceMappingURL=voucher-types.d.ts.map