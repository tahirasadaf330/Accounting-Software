import { ApiProperty } from '@nestjs/swagger';

export interface ImportPurchaseInvoiceParsedRow {
  rowNumber: number;
  reference: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  description: string | null;
  accountCode: string | null;
  amount: number | null;
}

export interface ImportPurchaseInvoicePreviewRow {
  rowNumber: number;
  reference: string;
  periodStart: string;
  periodEnd: string;
  description: string | null;
  accountCode: string;
  accountId: string;
  amount: string;
}

export interface ImportPurchaseInvoiceInvalidRow {
  rowNumber: number;
  raw: ImportPurchaseInvoiceParsedRow;
  errors: string[];
}

export class ImportPurchaseInvoicePreviewResponse {
  @ApiProperty({ description: 'Total data rows seen in the workbook' })
  totalRows: number;

  @ApiProperty({ description: 'Rows that passed validation and would be imported', type: Object, isArray: true })
  valid: ImportPurchaseInvoicePreviewRow[];

  @ApiProperty({ description: 'Rows that failed validation with reasons', type: Object, isArray: true })
  invalid: ImportPurchaseInvoiceInvalidRow[];
}

export class ImportPurchaseInvoiceCommitResponse {
  @ApiProperty({ description: 'Number of vouchers successfully created' })
  created: number;

  @ApiProperty({ description: 'Rows that could not be created, with the row number and error message', type: Object, isArray: true })
  failed: { rowNumber: number; error: string }[];
}
