import { ApiProperty } from '@nestjs/swagger';

export interface ImportPaymentVoucherParsedRow {
  rowNumber: number;
  voucherType: string | null;
  date: string | null;
  amount: number | null;
  invoiceRefs: string[];
  contactName: string | null;
  apAccountCode: string | null;
  bankAccountCode: string | null;
}

export interface ImportPaymentVoucherPreviewRow {
  rowNumber: number;
  date: string;
  amount: string;
  invoiceRefs: string[];
  matchedInvoices: { reference: string; voucherId: string; amount: string }[];
  apAccountCode: string;
  bankAccountCode: string;
}

export interface ImportPaymentVoucherInvalidRow {
  rowNumber: number;
  raw: ImportPaymentVoucherParsedRow;
  errors: string[];
}

export class ImportPaymentVoucherPreviewResponse {
  @ApiProperty({ description: 'Total data rows seen in the workbook' })
  totalRows: number;

  @ApiProperty({ description: 'Rows that passed validation', type: Object, isArray: true })
  valid: ImportPaymentVoucherPreviewRow[];

  @ApiProperty({ description: 'Rows that failed validation with reasons', type: Object, isArray: true })
  invalid: ImportPaymentVoucherInvalidRow[];
}

export class ImportPaymentVoucherCommitResponse {
  @ApiProperty({ description: 'Number of payment vouchers successfully created' })
  created: number;

  @ApiProperty({ description: 'Rows that could not be created', type: Object, isArray: true })
  failed: { rowNumber: number; error: string }[];
}
