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
  ImportPaymentVoucherCommitResponse,
  ImportPaymentVoucherInvalidRow,
  ImportPaymentVoucherParsedRow,
  ImportPaymentVoucherPreviewResponse,
  ImportPaymentVoucherPreviewRow,
} from './dto/import-payment-vouchers.dto';

const TARGET_SHEET_NAME = 'Voucher';
const HEADER_ROWS_TO_SKIP = 2;
const AMOUNT_TOLERANCE = 0.01;

const COL = {
  TYPE: 0,
  DATE: 1,
  AMOUNT: 2,
  INVOICE_REFS: 3,
  CONTACT: 4,
  AP_ACCOUNT: 5,
  BANK_ACCOUNT: 6,
} as const;

@Injectable()
export class PaymentVoucherImportService {
  private readonly logger = new Logger(PaymentVoucherImportService.name);

  constructor(
    private prisma: PrismaService,
    private vouchersService: VouchersService,
  ) {}

  async previewImport(
    tenantId: string,
    contactId: string,
    fileBuffer: Buffer,
  ): Promise<ImportPaymentVoucherPreviewResponse> {
    const contact = await this.resolveContact(tenantId, contactId);
    const rows = this.parseWorkbook(fileBuffer);
    const { valid, invalid } = await this.validateRows(
      tenantId,
      contact,
      rows,
    );
    return { totalRows: rows.length, valid, invalid };
  }

  async commitImport(
    tenantId: string,
    userId: string,
    contactId: string,
    fileBuffer: Buffer,
  ): Promise<ImportPaymentVoucherCommitResponse> {
    const contact = await this.resolveContact(tenantId, contactId);
    const rows = this.parseWorkbook(fileBuffer);
    const { valid, accountMap } = await this.validateRowsForCommit(
      tenantId,
      contact,
      rows,
    );

    let created = 0;
    const failed: { rowNumber: number; error: string }[] = [];

    for (const row of valid) {
      try {
        const bankAccount = accountMap.get(row.bankAccountCode);
        if (!bankAccount) {
          failed.push({
            rowNumber: row.rowNumber,
            error: 'Bank account lookup failed at commit time',
          });
          continue;
        }

        await this.vouchersService.createWithAllocations(tenantId, userId, {
          voucher: {
            voucherType: VoucherType.PAYMENT,
            date: row.date,
            narration: `Payment to ${contact.name} for ${row.invoiceRefs.join(', ')}`,
            reference: row.invoiceRefs.join(', '),
            currencyCode: 'USD',
            contactId: contact.id,
            lineItems: [
              {
                accountId: contact.accountId!,
                debit: row.amount,
                credit: '0',
              },
              {
                accountId: bankAccount.id,
                debit: '0',
                credit: row.amount,
              },
            ],
          },
          allocations: row.matchedInvoices.map((inv) => ({
            invoiceVoucherId: inv.voucherId,
            amount: parseFloat(inv.amount),
            paidAt: new Date(row.date).toISOString(),
          })),
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
        'Selected vendor has no linked GL account',
      );
    }
    return contact;
  }

  private parseWorkbook(buffer: Buffer): ImportPaymentVoucherParsedRow[] {
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

    const parsed: ImportPaymentVoucherParsedRow[] = [];
    for (let i = HEADER_ROWS_TO_SKIP; i < rawRows.length; i++) {
      const r = rawRows[i] as any[] | undefined;
      if (!r || r.every((c) => c === null || c === '')) continue;

      const invoiceCell = r[COL.INVOICE_REFS];
      const refs = this.parseInvoiceRefs(invoiceCell);

      parsed.push({
        rowNumber: i + 1,
        voucherType: this.cellToString(r[COL.TYPE]),
        date: this.cellToDateString(r[COL.DATE]),
        amount: this.cellToNumber(r[COL.AMOUNT]),
        invoiceRefs: refs,
        contactName: this.cellToString(r[COL.CONTACT]),
        apAccountCode: this.cellToString(r[COL.AP_ACCOUNT]),
        bankAccountCode: this.cellToString(r[COL.BANK_ACCOUNT]),
      });
    }
    return parsed;
  }

  private async validateRowsForCommit(
    tenantId: string,
    contact: { id: string; name: string },
    rows: ImportPaymentVoucherParsedRow[],
  ) {
    const result = await this.validateRows(tenantId, contact, rows);
    return result;
  }

  private async validateRows(
    tenantId: string,
    contact: { id: string; name: string },
    rows: ImportPaymentVoucherParsedRow[],
  ): Promise<{
    valid: ImportPaymentVoucherPreviewRow[];
    invalid: ImportPaymentVoucherInvalidRow[];
    accountMap: Map<string, { id: string; code: string }>;
  }> {
    const codes = new Set<string>();
    const refs = new Set<string>();
    for (const r of rows) {
      if (r.apAccountCode) codes.add(r.apAccountCode);
      if (r.bankAccountCode) codes.add(r.bankAccountCode);
      for (const ref of r.invoiceRefs) refs.add(ref);
    }

    const accountList = codes.size
      ? await this.prisma.account.findMany({
          where: { tenantId, code: { in: Array.from(codes) } },
          select: { id: true, code: true, isActive: true },
        })
      : [];
    const accountMap = new Map(accountList.map((a) => [a.code, a]));

    const invoiceList = refs.size
      ? await this.prisma.voucher.findMany({
          where: {
            tenantId,
            contactId: contact.id,
            voucherType: VoucherType.PURCHASE,
            reference: { in: Array.from(refs) },
          },
          select: {
            id: true,
            reference: true,
            totalAmount: true,
          },
        })
      : [];
    const invoiceMap = new Map<
      string,
      { id: string; totalAmount: { toString(): string } }[]
    >();
    for (const inv of invoiceList) {
      if (!inv.reference) continue;
      const arr = invoiceMap.get(inv.reference) ?? [];
      arr.push({ id: inv.id, totalAmount: inv.totalAmount });
      invoiceMap.set(inv.reference, arr);
    }

    const valid: ImportPaymentVoucherPreviewRow[] = [];
    const invalid: ImportPaymentVoucherInvalidRow[] = [];

    for (const r of rows) {
      const errors: string[] = [];

      if (!r.voucherType || r.voucherType.toLowerCase() !== 'payment') {
        errors.push(
          `Voucher Type must be "Payment" (got "${r.voucherType ?? ''}")`,
        );
      }
      if (!r.date) errors.push('Invalid date (column B)');
      if (r.amount === null || r.amount === undefined) {
        errors.push('Missing amount (column C)');
      } else if (r.amount <= 0) {
        errors.push(`Amount must be > 0 (got ${r.amount})`);
      }

      if (r.invoiceRefs.length === 0) {
        errors.push('Missing Invoice #(s) (column D)');
      }

      if (
        r.contactName &&
        r.contactName.trim().toLowerCase() !==
          contact.name.trim().toLowerCase()
      ) {
        errors.push(
          `Contact "${r.contactName}" does not match selected vendor "${contact.name}"`,
        );
      }

      if (!r.apAccountCode) errors.push('Missing AP account code (column F)');
      if (!r.bankAccountCode) {
        errors.push('Missing bank account code (column G)');
      }

      let apAccount: { id: string; code: string; isActive: boolean } | undefined;
      let bankAccount:
        | { id: string; code: string; isActive: boolean }
        | undefined;
      if (r.apAccountCode) {
        apAccount = accountMap.get(r.apAccountCode);
        if (!apAccount) {
          errors.push(`AP account code "${r.apAccountCode}" not found`);
        } else if (!apAccount.isActive) {
          errors.push(`AP account code "${r.apAccountCode}" is inactive`);
        }
      }
      if (r.bankAccountCode) {
        bankAccount = accountMap.get(r.bankAccountCode);
        if (!bankAccount) {
          errors.push(`Bank account code "${r.bankAccountCode}" not found`);
        } else if (!bankAccount.isActive) {
          errors.push(`Bank account code "${r.bankAccountCode}" is inactive`);
        }
      }

      const matched: {
        reference: string;
        voucherId: string;
        amount: string;
      }[] = [];
      let allInvoicesResolved = true;
      let sumOfInvoices = 0;
      for (const ref of r.invoiceRefs) {
        const candidates = invoiceMap.get(ref);
        if (!candidates || candidates.length === 0) {
          errors.push(
            `Invoice "${ref}" not found for vendor "${contact.name}"`,
          );
          allInvoicesResolved = false;
          continue;
        }
        if (candidates.length > 1) {
          errors.push(
            `Invoice "${ref}" matches multiple vouchers — ambiguous`,
          );
          allInvoicesResolved = false;
          continue;
        }
        const inv = candidates[0];
        const amt = parseFloat(inv.totalAmount.toString());
        sumOfInvoices += amt;
        matched.push({
          reference: ref,
          voucherId: inv.id,
          amount: amt.toFixed(4),
        });
      }

      if (
        allInvoicesResolved &&
        r.amount !== null &&
        Math.abs(sumOfInvoices - r.amount) > AMOUNT_TOLERANCE
      ) {
        errors.push(
          `Payment amount ${r.amount.toFixed(2)} does not match sum of invoice amounts ${sumOfInvoices.toFixed(2)}`,
        );
      }

      if (errors.length > 0) {
        invalid.push({ rowNumber: r.rowNumber, raw: r, errors });
        continue;
      }

      valid.push({
        rowNumber: r.rowNumber,
        date: r.date!,
        amount: r.amount!.toFixed(4),
        invoiceRefs: r.invoiceRefs,
        matchedInvoices: matched,
        apAccountCode: r.apAccountCode!,
        bankAccountCode: r.bankAccountCode!,
      });
    }

    return { valid, invalid, accountMap };
  }

  private parseInvoiceRefs(cell: unknown): string[] {
    if (cell === null || cell === undefined) return [];
    const s = String(cell);
    return s
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
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
}
