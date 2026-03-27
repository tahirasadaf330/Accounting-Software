import { VoucherType, VoucherStatus } from '../enums/voucher-types';
export interface VoucherLineItemDto {
    accountId: string;
    debit: string;
    credit: string;
    narration?: string;
    currencyCode?: string;
    exchangeRate?: string;
    costCenter?: string;
}
export interface CreateVoucherDto {
    voucherType: VoucherType;
    date: string;
    narration: string;
    reference?: string;
    currencyCode?: string;
    exchangeRate?: string;
    lineItems: VoucherLineItemDto[];
}
export interface UpdateVoucherDto {
    date?: string;
    narration?: string;
    reference?: string;
    currencyCode?: string;
    exchangeRate?: string;
    lineItems?: VoucherLineItemDto[];
}
export interface VoucherLineItemResponse {
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: string;
    credit: string;
    baseDebit: string;
    baseCredit: string;
    currencyCode: string;
    exchangeRate: string;
    narration: string | null;
    costCenter: string | null;
}
export interface VoucherResponse {
    id: string;
    voucherNumber: string;
    voucherType: VoucherType;
    status: VoucherStatus;
    date: string;
    narration: string;
    reference: string | null;
    totalAmount: string;
    currencyCode: string;
    exchangeRate: string;
    createdBy: string;
    approvedBy: string | null;
    postedAt: string | null;
    rejectionReason: string | null;
    lineItems: VoucherLineItemResponse[];
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=voucher.d.ts.map