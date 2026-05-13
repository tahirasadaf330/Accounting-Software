import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ContactType, VoucherType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VouchersService } from './vouchers.service';
import {
  ImportPurchaseInvoiceCommitResponse,
  ImportPurchaseInvoiceInvalidRow,
  ImportPurchaseInvoiceParsedRow,
  ImportPurchaseInvoicePreviewResponse,
  ImportPurchaseInvoicePreviewRow,
} from './dto/import-purchase-invoices.dto';

const TARGET_SHEET_NAME = 'Purchase Invoice';
const HEADER_ROWS_TO_SKIP = 3;

const COL = {
  PERIOD_START: 0,
  PERIOD_END: 1,
  DESCRIPTION: 4,
  REFERENCE: 5,
  ACCOUNT_CODE: 6,
  AMOUNT: 7,
  DEBIT_NOTE: 8,
  CREDIT_NOTE: 9,
} as const;

@Injectable()
export class VoucherImportService {
  private readonly logger = new Logger(VoucherImportService.name);

  constructor(
    private prisma: PrismaService,
    private vouchersService: VouchersService,
  ) {}

  async previewImport(
    tenantId: string,
    contactId: string,
    fileBuffer: Buffer,
  ): Promise<ImportPurchaseInvoicePreviewResponse> {
    await this.resolveContact(tenantId, contactId);
    const rows = this.parseWorkbook(fileBuffer);
    const { valid, invalid } = await this.validateRows(tenantId, rows);

    return {
      totalRows: rows.length,
      valid,
      invalid,
    };
  }

  async commitImport(
    tenantId: string,
    userId: string,
    contactId: string,
    fileBuffer: Buffer,
  ): Promise<ImportPurchaseInvoiceCommitResponse> {
    const { contact } = await this.resolveContact(tenantId, contactId);
    const rows = this.parseWorkbook(fileBuffer);
    const { valid } = await this.validateRows(tenantId, rows);

    let created = 0;
    const failed: { rowNumber: number; error: string }[] = [];

    for (const row of valid) {
      try {
        await this.vouchersService.create(tenantId, userId, {
          voucherType: VoucherType.PURCHASE,
          date: row.periodEnd,
          narration:
            row.description?.trim() || `Purchase invoice ${row.reference}`,
          reference: row.reference,
          currencyCode: 'USD',
          contactId: contact.id,
          periodStart: row.periodStart,
          periodEnd: row.periodEnd,
          lineItems: [
            {
              accountId: row.accountId,
              debit: row.amount,
              credit: '0',
            },
            {
              accountId: contact.accountId!,
              debit: '0',
              credit: row.amount,
            },
          ],
        });
        created += 1;
      } catch (err: any) {
        failed.push({
          rowNumber: row.rowNumber,
          error: err?.message || 'Unknown error',
        });
      }
    }

    return { created, failed };
  }

  private async resolveContact(tenantId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, tenantId },
      select: { id: true, name: true, type: true, accountId: true },
    });
    if (!contact) {
      throw new BadRequestException('Selected vendor not found');
    }
    if (
      contact.type !== ContactType.VENDOR &&
      contact.type !== ContactType.BOTH
    ) {
      throw new BadRequestException(
        'Selected contact is not a vendor (type must be VENDOR or BOTH)',
      );
    }
    if (!contact.accountId) {
      throw new BadRequestException(
        'Selected vendor has no linked GL account — cannot post invoices',
      );
    }
    return { contact };
  }

  private parseWorkbook(buffer: Buffer): ImportPurchaseInvoiceParsedRow[] {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to parse Excel file: ${err?.message || 'invalid workbook'}`,
      );
    }

    const sheetName = workbook.SheetNames.find(
      (n) => n.trim() === TARGET_SHEET_NAME,
    );
    if (!sheetName) {
      throw new BadRequestException(
        `Workbook does not contain a "${TARGET_SHEET_NAME}" sheet`,
      );
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
      raw: true,
    });

    const parsed: ImportPurchaseInvoiceParsedRow[] = [];
    for (let i = HEADER_ROWS_TO_SKIP; i < rawRows.length; i++) {
      const r = rawRows[i] as any[] | undefined;
      if (!r || r.every((c) => c === null || c === '')) continue;

      parsed.push({
        rowNumber: i + 1,
        periodStart: this.cellToDateString(r[COL.PERIOD_START]),
        periodEnd: this.cellToDateString(r[COL.PERIOD_END]),
        description: this.cellToString(r[COL.DESCRIPTION]),
        reference: this.cellToString(r[COL.REFERENCE]),
        accountCode: this.cellToString(r[COL.ACCOUNT_CODE]),
        amount: this.cellToNumber(r[COL.AMOUNT]),
      });

      const debitNote = this.cellToNumber(r[COL.DEBIT_NOTE]);
      const creditNote = this.cellToNumber(r[COL.CREDIT_NOTE]);
      const last = parsed[parsed.length - 1];
      (last as any)._debitNote = debitNote;
      (last as any)._creditNote = creditNote;
    }
    return parsed;
  }

  private async validateRows(
    tenantId: string,
    rows: ImportPurchaseInvoiceParsedRow[],
  ): Promise<{
    valid: ImportPurchaseInvoicePreviewRow[];
    invalid: ImportPurchaseInvoiceInvalidRow[];
  }> {
    const accountCodes = Array.from(
      new Set(
        rows
          .map((r) => r.accountCode)
          .filter((c): c is string => !!c && c.length > 0),
      ),
    );

    const accounts = accountCodes.length
      ? await this.prisma.account.findMany({
          where: { tenantId, code: { in: accountCodes } },
          select: { id: true, code: true, isActive: true },
        })
      : [];
    const accountMap = new Map(accounts.map((a) => [a.code, a]));

    const valid: ImportPurchaseInvoicePreviewRow[] = [];
    const invalid: ImportPurchaseInvoiceInvalidRow[] = [];

    for (const r of rows) {
      const errors: string[] = [];

      if (!r.reference) errors.push('Missing Invoice # (column F)');
      if (!r.periodStart) errors.push('Invalid period start date (column A)');
      if (!r.periodEnd) errors.push('Invalid period end date (column B)');
      if (!r.accountCode) errors.push('Missing account code (column G)');
      if (r.amount === null || r.amount === undefined) {
        errors.push('Missing amount (column H)');
      } else if (r.amount <= 0) {
        errors.push(`Amount must be > 0 (got ${r.amount})`);
      }

      const debitNote = (r as any)._debitNote as number | null;
      const creditNote = (r as any)._creditNote as number | null;
      if (debitNote !== null && debitNote !== 0) {
        errors.push('Debit Note column is not supported by the importer');
      }
      if (creditNote !== null && creditNote !== 0) {
        errors.push('Credit Note column is not supported by the importer');
      }

      let account: { id: string; code: string; isActive: boolean } | undefined;
      if (r.accountCode) {
        account = accountMap.get(r.accountCode);
        if (!account) {
          errors.push(`Account code "${r.accountCode}" not found in tenant`);
        } else if (!account.isActive) {
          errors.push(`Account code "${r.accountCode}" is inactive`);
        }
      }

      if (errors.length > 0) {
        invalid.push({ rowNumber: r.rowNumber, raw: r, errors });
        continue;
      }

      valid.push({
        rowNumber: r.rowNumber,
        reference: r.reference!,
        periodStart: r.periodStart!,
        periodEnd: r.periodEnd!,
        description: r.description,
        accountCode: r.accountCode!,
        accountId: account!.id,
        amount: this.formatAmount(r.amount!),
      });
    }

    return { valid, invalid };
  }

  private cellToDateString(cell: unknown): string | null {
    if (cell === null || cell === undefined || cell === '') return null;
    if (typeof cell === 'number' && Number.isFinite(cell)) {
      const ms = Math.round((cell - 25569) * 86400 * 1000);
      const d = new Date(ms);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    }
    if (cell instanceof Date) {
      return cell.toISOString().slice(0, 10);
    }
    if (typeof cell === 'string') {
      const d = new Date(cell);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    }
    return null;
  }

  private cellToNumber(cell: unknown): number | null {
    if (cell === null || cell === undefined || cell === '') return null;
    if (typeof cell === 'number' && Number.isFinite(cell)) return cell;
    if (typeof cell === 'string') {
      const cleaned = cell.replace(/[\s,$]/g, '');
      if (!cleaned) return null;
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  private cellToString(cell: unknown): string | null {
    if (cell === null || cell === undefined) return null;
    const s = String(cell).trim();
    return s.length > 0 ? s : null;
  }

  private formatAmount(n: number): string {
    return n.toFixed(4);
  }
}
