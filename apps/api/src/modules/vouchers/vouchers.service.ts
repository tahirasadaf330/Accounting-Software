import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VoucherStatus, VoucherType, AccountType, Prisma } from '@prisma/client';
import { VOUCHER_TYPE_PREFIX } from '@accounting-saas/shared';
import { VOUCHER_EVENTS } from '../notifications/events/voucher-events';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { CreateVoucherWithAllocationsDto } from './dto/create-voucher-with-allocations.dto';
import { CreateVoucherWithNettingDto } from './dto/create-voucher-with-netting.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherFilterDto } from './dto/voucher-filter.dto';
import { PaymentAllocationsService } from '../payment-allocations/payment-allocations.service';
import {
  toDecimal,
  sumDecimals,
  convertCurrency,
  isZero,
} from '../../common/utils/decimal.utils';
import Decimal from 'decimal.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  private static readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
  ]);

  private static readonly MAX_ATTACHMENTS_PER_VOUCHER = 10;
  private static readonly UPLOADS_BASE = path.join(process.cwd(), 'uploads');

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private paymentAllocations: PaymentAllocationsService,
  ) {}

  /**
   * Generate a unique voucher number in format: PREFIX-YYYYMM-NNNN
   * e.g., JV-202601-0001
   */
  private async generateVoucherNumber(
    tenantId: string,
    voucherType: VoucherType,
    date: Date,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const prefix = VOUCHER_TYPE_PREFIX[voucherType];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const periodPrefix = `${prefix}-${year}${month}-`;

    const lastVoucher = await tx.voucher.findFirst({
      where: {
        tenantId,
        voucherNumber: { startsWith: periodPrefix },
      },
      orderBy: { voucherNumber: 'desc' },
      select: { voucherNumber: true },
    });

    let sequence = 1;
    if (lastVoucher) {
      const lastSequence = parseInt(
        lastVoucher.voucherNumber.slice(periodPrefix.length),
        10,
      );
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `${periodPrefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Validate that all accounts exist and belong to the tenant.
   */
  private async validateAccounts(
    tenantId: string,
    accountIds: string[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const uniqueIds = [...new Set(accountIds)];
    const accounts = await tx.account.findMany({
      where: {
        id: { in: uniqueIds },
        tenantId,
        isActive: true,
      },
      select: { id: true },
    });

    if (accounts.length !== uniqueIds.length) {
      const foundIds = new Set(accounts.map((a) => a.id));
      const missing = uniqueIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Accounts not found or inactive for this tenant: ${missing.join(', ')}`,
      );
    }
  }

  /**
   * Block voucher creation when the transaction amount is below the contact's
   * minimum threshold. No-op when contactId or threshold is unset.
   */
  private async validateMinThreshold(
    tx: Prisma.TransactionClient,
    tenantId: string,
    contactId: string | null | undefined,
    totalAmount: Decimal,
    voucherType: VoucherType,
  ): Promise<void> {
    if (voucherType !== VoucherType.PAYMENT && voucherType !== VoucherType.RECEIPT) return;
    if (!contactId) return;
    const contact = await tx.contact.findFirst({
      where: { id: contactId, tenantId },
      select: { minThreshold: true },
    });
    if (!contact || contact.minThreshold == null) return;

    const threshold = toDecimal(contact.minThreshold.toString());
    if (totalAmount.lessThan(threshold)) {
      throw new BadRequestException(
        `Transaction amount ${totalAmount.toFixed(2)} is below the minimum threshold of ${threshold.toFixed(2)}. Please increase the amount or contact your account manager.`,
      );
    }
  }

  /**
   * Validate that total debits equal total credits (double-entry rule).
   */
  private validateDoubleEntry(
    lineItems: { debit: string; credit: string }[],
  ): { totalDebits: Decimal; totalCredits: Decimal } {
    const totalDebits = sumDecimals(lineItems.map((li) => li.debit));
    const totalCredits = sumDecimals(lineItems.map((li) => li.credit));

    if (!totalDebits.equals(totalCredits)) {
      throw new BadRequestException(
        `Total debits (${totalDebits.toFixed(4)}) must equal total credits (${totalCredits.toFixed(4)})`,
      );
    }

    if (isZero(totalDebits)) {
      throw new BadRequestException(
        'Total debits and credits cannot both be zero',
      );
    }

    // Validate individual line items: each must have either debit or credit, not both nonzero
    for (let i = 0; i < lineItems.length; i++) {
      const debit = toDecimal(lineItems[i].debit);
      const credit = toDecimal(lineItems[i].credit);

      if (debit.isNegative() || credit.isNegative()) {
        throw new BadRequestException(
          `Line item ${i + 1}: debit and credit amounts must be non-negative`,
        );
      }

      if (!isZero(debit) && !isZero(credit)) {
        throw new BadRequestException(
          `Line item ${i + 1}: a line cannot have both a debit and a credit amount`,
        );
      }

      if (isZero(debit) && isZero(credit)) {
        throw new BadRequestException(
          `Line item ${i + 1}: either debit or credit must be non-zero`,
        );
      }
    }

    return { totalDebits, totalCredits };
  }

  /**
   * Create a journal entry for a voucher (helper used by create + post).
   * Assumes caller has already checked no existing entry exists.
   */
  private async createJournalEntryForVoucher(
    tx: Prisma.TransactionClient,
    tenantId: string,
    voucher: {
      id: string;
      date: Date;
      narration: string;
      lineItems: {
        accountId: string;
        debit: Prisma.Decimal;
        credit: Prisma.Decimal;
        baseDebit: Prisma.Decimal;
        baseCredit: Prisma.Decimal;
        currencyCode: string;
        exchangeRate: Prisma.Decimal;
        narration: string | null;
        lineOrder: number;
      }[];
    },
  ) {
    const entryDate = voucher.date;
    const year = entryDate.getFullYear();
    const month = String(entryDate.getMonth() + 1).padStart(2, '0');
    const entryPrefix = `JE-${year}${month}-`;

    const lastEntry = await tx.journalEntry.findFirst({
      where: {
        tenantId,
        entryNumber: { startsWith: entryPrefix },
      },
      orderBy: { entryNumber: 'desc' },
      select: { entryNumber: true },
    });

    let entrySequence = 1;
    if (lastEntry) {
      const lastSeq = parseInt(
        lastEntry.entryNumber.slice(entryPrefix.length),
        10,
      );
      if (!isNaN(lastSeq)) {
        entrySequence = lastSeq + 1;
      }
    }

    const entryNumber = `${entryPrefix}${String(entrySequence).padStart(4, '0')}`;

    const journalLines = voucher.lineItems.map((li) => ({
      tenantId,
      accountId: li.accountId,
      debit: li.debit,
      credit: li.credit,
      baseCurrencyDebit: li.baseDebit,
      baseCurrencyCredit: li.baseCredit,
      currencyCode: li.currencyCode,
      exchangeRate: li.exchangeRate,
      narration: li.narration,
      lineOrder: li.lineOrder,
    }));

    return tx.journalEntry.create({
      data: {
        tenantId,
        voucherId: voucher.id,
        entryNumber,
        entryDate: voucher.date,
        narration: voucher.narration,
        isReversing: false,
        lines: {
          createMany: {
            data: journalLines,
          },
        },
      },
    });
  }

  /**
   * Create a new voucher with line items, directly as POSTED.
   * The approval pipeline (DRAFT → PENDING_APPROVAL → APPROVED → POSTED) has
   * been removed: every new voucher is posted in one atomic transaction.
   */
  async create(tenantId: string, userId: string, dto: CreateVoucherDto) {
    const { totalDebits } = this.validateDoubleEntry(dto.lineItems);

    const voucherDate = new Date(dto.date);
    const voucherExchangeRate = dto.exchangeRate || '1';

    return this.prisma.$transaction(async (tx) => {
      await this.validateMinThreshold(tx, tenantId, dto.contactId, totalDebits, dto.voucherType);

      const accountIds = dto.lineItems.map((li) => li.accountId);
      await this.validateAccounts(tenantId, accountIds, tx);

      const voucherNumber = await this.generateVoucherNumber(
        tenantId,
        dto.voucherType,
        voucherDate,
        tx,
      );

      const lineItemsData = dto.lineItems.map((li, index) => {
        const lineExchangeRate = li.exchangeRate || voucherExchangeRate;
        const debit = toDecimal(li.debit);
        const credit = toDecimal(li.credit);
        const baseDebit = convertCurrency(debit, lineExchangeRate);
        const baseCredit = convertCurrency(credit, lineExchangeRate);

        return {
          tenantId,
          accountId: li.accountId,
          debit: new Prisma.Decimal(debit.toFixed(4)),
          credit: new Prisma.Decimal(credit.toFixed(4)),
          currencyCode: li.currencyCode || dto.currencyCode || 'USD',
          exchangeRate: new Prisma.Decimal(
            toDecimal(lineExchangeRate).toFixed(8),
          ),
          baseDebit: new Prisma.Decimal(baseDebit.toFixed(4)),
          baseCredit: new Prisma.Decimal(baseCredit.toFixed(4)),
          narration: li.narration || null,
          costCenter: li.costCenter || null,
          lineOrder: index + 1,
        };
      });

      const now = new Date();
      const voucher = await tx.voucher.create({
        data: {
          tenantId,
          voucherNumber,
          voucherType: dto.voucherType,
          status: VoucherStatus.POSTED,
          date: voucherDate,
          narration: dto.narration,
          reference: dto.reference || null,
          totalAmount: new Prisma.Decimal(totalDebits.toFixed(4)),
          currencyCode: dto.currencyCode || 'USD',
          exchangeRate: new Prisma.Decimal(
            toDecimal(voucherExchangeRate).toFixed(8),
          ),
          createdById: userId,
          approvedById: userId,
          postedAt: now,
          contactId: dto.contactId || null,
          periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
          periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
          lineItems: {
            createMany: {
              data: lineItemsData,
            },
          },
        },
        include: {
          lineItems: {
            orderBy: { lineOrder: 'asc' },
          },
        },
      });

      await this.createJournalEntryForVoucher(tx, tenantId, voucher);

      return tx.voucher.findUnique({
        where: { id: voucher.id },
        include: {
          lineItems: {
            include: { account: { select: { id: true, code: true, name: true } } },
            orderBy: { lineOrder: 'asc' },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
          journalEntry: {
            include: {
              lines: {
                include: { account: { select: { id: true, code: true, name: true } } },
                orderBy: { lineOrder: 'asc' },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Create a voucher AND its payment allocations in a single atomic
   * transaction. Used by the new inline-allocation flow on the New Voucher
   * page. If any step fails (validation, cross-contact invoice, over-
   * allocation), the whole transaction is rolled back so no orphan voucher,
   * journal entry, or allocation is left behind.
   */
  async createWithAllocations(
    tenantId: string,
    userId: string,
    dto: CreateVoucherWithAllocationsDto,
  ) {
    const { voucher: voucherDto, allocations } = dto;
    const { totalDebits } = this.validateDoubleEntry(voucherDto.lineItems);

    if (!voucherDto.contactId) {
      throw new BadRequestException(
        'contactId is required when creating a voucher with allocations',
      );
    }

    const voucherDate = new Date(voucherDto.date);
    const voucherExchangeRate = voucherDto.exchangeRate || '1';

    return this.prisma.$transaction(async (tx) => {
      await this.validateMinThreshold(tx, tenantId, voucherDto.contactId, totalDebits, voucherDto.voucherType);

      const accountIds = voucherDto.lineItems.map((li) => li.accountId);
      await this.validateAccounts(tenantId, accountIds, tx);

      const voucherNumber = await this.generateVoucherNumber(
        tenantId,
        voucherDto.voucherType,
        voucherDate,
        tx,
      );

      const lineItemsData = voucherDto.lineItems.map((li, index) => {
        const lineExchangeRate = li.exchangeRate || voucherExchangeRate;
        const debit = toDecimal(li.debit);
        const credit = toDecimal(li.credit);
        const baseDebit = convertCurrency(debit, lineExchangeRate);
        const baseCredit = convertCurrency(credit, lineExchangeRate);

        return {
          tenantId,
          accountId: li.accountId,
          debit: new Prisma.Decimal(debit.toFixed(4)),
          credit: new Prisma.Decimal(credit.toFixed(4)),
          currencyCode: li.currencyCode || voucherDto.currencyCode || 'USD',
          exchangeRate: new Prisma.Decimal(
            toDecimal(lineExchangeRate).toFixed(8),
          ),
          baseDebit: new Prisma.Decimal(baseDebit.toFixed(4)),
          baseCredit: new Prisma.Decimal(baseCredit.toFixed(4)),
          narration: li.narration || null,
          costCenter: li.costCenter || null,
          lineOrder: index + 1,
        };
      });

      const now = new Date();
      const voucher = await tx.voucher.create({
        data: {
          tenantId,
          voucherNumber,
          voucherType: voucherDto.voucherType,
          status: VoucherStatus.POSTED,
          date: voucherDate,
          narration: voucherDto.narration,
          reference: voucherDto.reference || null,
          totalAmount: new Prisma.Decimal(totalDebits.toFixed(4)),
          currencyCode: voucherDto.currencyCode || 'USD',
          exchangeRate: new Prisma.Decimal(
            toDecimal(voucherExchangeRate).toFixed(8),
          ),
          createdById: userId,
          approvedById: userId,
          postedAt: now,
          contactId: voucherDto.contactId,
          periodStart: voucherDto.periodStart
            ? new Date(voucherDto.periodStart)
            : undefined,
          periodEnd: voucherDto.periodEnd
            ? new Date(voucherDto.periodEnd)
            : undefined,
          lineItems: {
            createMany: {
              data: lineItemsData,
            },
          },
        },
        include: {
          lineItems: {
            orderBy: { lineOrder: 'asc' },
          },
        },
      });

      await this.createJournalEntryForVoucher(tx, tenantId, voucher);

      await this.paymentAllocations.validateAndCreateAllocations(
        tx,
        tenantId,
        {
          id: voucher.id,
          contactId: voucher.contactId,
          voucherType: voucher.voucherType,
          voucherNumber: voucher.voucherNumber,
          totalAmount: voucher.totalAmount,
        },
        allocations,
      );

      return tx.voucher.findUnique({
        where: { id: voucher.id },
        include: {
          lineItems: {
            include: { account: { select: { id: true, code: true, name: true } } },
            orderBy: { lineOrder: 'asc' },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
          journalEntry: {
            include: {
              lines: {
                include: { account: { select: { id: true, code: true, name: true } } },
                orderBy: { lineOrder: 'asc' },
              },
            },
          },
        },
      });
    });
  }

  async createWithNettingAllocations(
    tenantId: string,
    userId: string,
    dto: CreateVoucherWithNettingDto,
  ) {
    const { voucher: voucherDto, nettingAllocations } = dto;
    const { totalDebits } = this.validateDoubleEntry(voucherDto.lineItems);

    if (!voucherDto.contactId) {
      throw new BadRequestException('contactId is required when settling netting cycles');
    }

    const voucherDate = new Date(voucherDto.date);
    const voucherExchangeRate = voucherDto.exchangeRate || '1';

    return this.prisma.$transaction(async (tx) => {
      await this.validateMinThreshold(tx, tenantId, voucherDto.contactId, totalDebits, voucherDto.voucherType);

      const accountIds = voucherDto.lineItems.map((li) => li.accountId);
      await this.validateAccounts(tenantId, accountIds, tx);

      const voucherNumber = await this.generateVoucherNumber(
        tenantId,
        voucherDto.voucherType,
        voucherDate,
        tx,
      );

      const lineItemsData = voucherDto.lineItems.map((li, index) => {
        const lineExchangeRate = li.exchangeRate || voucherExchangeRate;
        const debit = toDecimal(li.debit);
        const credit = toDecimal(li.credit);
        const baseDebit = convertCurrency(debit, lineExchangeRate);
        const baseCredit = convertCurrency(credit, lineExchangeRate);
        return {
          tenantId,
          accountId: li.accountId,
          debit: new Prisma.Decimal(debit.toFixed(4)),
          credit: new Prisma.Decimal(credit.toFixed(4)),
          currencyCode: li.currencyCode || voucherDto.currencyCode || 'USD',
          exchangeRate: new Prisma.Decimal(toDecimal(lineExchangeRate).toFixed(8)),
          baseDebit: new Prisma.Decimal(baseDebit.toFixed(4)),
          baseCredit: new Prisma.Decimal(baseCredit.toFixed(4)),
          narration: li.narration || null,
          costCenter: li.costCenter || null,
          lineOrder: index + 1,
        };
      });

      const now = new Date();
      const voucher = await tx.voucher.create({
        data: {
          tenantId,
          voucherNumber,
          voucherType: voucherDto.voucherType,
          status: VoucherStatus.POSTED,
          date: voucherDate,
          narration: voucherDto.narration,
          reference: voucherDto.reference || null,
          totalAmount: new Prisma.Decimal(totalDebits.toFixed(4)),
          currencyCode: voucherDto.currencyCode || 'USD',
          exchangeRate: new Prisma.Decimal(toDecimal(voucherExchangeRate).toFixed(8)),
          createdById: userId,
          approvedById: userId,
          postedAt: now,
          contactId: voucherDto.contactId,
          periodStart: voucherDto.periodStart ? new Date(voucherDto.periodStart) : undefined,
          periodEnd: voucherDto.periodEnd ? new Date(voucherDto.periodEnd) : undefined,
          lineItems: { createMany: { data: lineItemsData } },
        },
        include: { lineItems: { orderBy: { lineOrder: 'asc' } } },
      });

      await this.createJournalEntryForVoucher(tx, tenantId, voucher);

      // Settle each netting cycle
      for (const alloc of nettingAllocations) {
        const cycle = await tx.nettingCycle.findFirst({
          where: { id: alloc.nettingCycleId, tenantId },
          include: { invoices: { select: { voucherId: true } } },
        });
        if (!cycle) continue;

        const linkedIds = cycle.invoices.map((i) => i.voucherId);
        const invoices = await tx.voucher.findMany({
          where: { id: { in: linkedIds.length > 0 ? linkedIds : ['none'] }, tenantId, status: VoucherStatus.POSTED },
          select: {
            id: true,
            voucherType: true,
            totalAmount: true,
            invoiceAllocations: { select: { amount: true } },
          },
        });

        // Allocate to SALES invoices for RECEIPT (Receivable), PURCHASE for PAYMENT (Payable)
        const side = voucherDto.voucherType === VoucherType.RECEIPT ? VoucherType.SALES : VoucherType.PURCHASE;
        const sideInvoices = invoices
          .filter((inv) => inv.voucherType === side)
          .map((inv) => {
            const paid = inv.invoiceAllocations.reduce((s, a) => s + a.amount.toNumber(), 0);
            return { id: inv.id, remaining: inv.totalAmount.toNumber() - paid };
          })
          .filter((inv) => inv.remaining > 0.01);

        const sideTotalRemaining = sideInvoices.reduce((s, inv) => s + inv.remaining, 0);

        if (sideTotalRemaining > 0) {
          let amountLeft = alloc.amount;
          for (const inv of sideInvoices) {
            const proportion = inv.remaining / sideTotalRemaining;
            const allocAmt = Math.min(parseFloat((alloc.amount * proportion).toFixed(4)), inv.remaining, amountLeft);
            if (allocAmt <= 0) continue;
            await tx.paymentAllocation.create({
              data: {
                tenantId,
                paymentVoucherId: voucher.id,
                invoiceVoucherId: inv.id,
                amount: new Prisma.Decimal(allocAmt.toFixed(4)),
                paidAt: new Date(alloc.paidAt),
              },
            });
            amountLeft -= allocAmt;
          }
        }

        // Recompute net after allocations to determine new status
        const updatedInvoices = await tx.voucher.findMany({
          where: { id: { in: linkedIds.length > 0 ? linkedIds : ['none'] }, tenantId, status: VoucherStatus.POSTED },
          select: { voucherType: true, totalAmount: true, invoiceAllocations: { select: { amount: true } } },
        });
        let salesRem = 0;
        let purchaseRem = 0;
        for (const inv of updatedInvoices) {
          const paid = inv.invoiceAllocations.reduce((s, a) => s + a.amount.toNumber(), 0);
          const rem = inv.totalAmount.toNumber() - paid;
          if (rem > 0.01) {
            if (inv.voucherType === 'SALES') salesRem += rem;
            else purchaseRem += rem;
          }
        }
        const newNet = Math.abs(salesRem - purchaseRem);
        const newStatus = newNet <= 0.01 ? 'SETTLED' : 'PARTIAL';
        await tx.nettingCycle.update({
          where: { id: cycle.id },
          data: { status: newStatus as any },
        });
      }

      return tx.voucher.findUnique({
        where: { id: voucher.id },
        include: {
          lineItems: {
            include: { account: { select: { id: true, code: true, name: true } } },
            orderBy: { lineOrder: 'asc' },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
          journalEntry: {
            include: {
              lines: {
                include: { account: { select: { id: true, code: true, name: true } } },
                orderBy: { lineOrder: 'asc' },
              },
            },
          },
        },
      });
    });
  }

  /**
   * List vouchers with filtering, searching, and pagination.
   *
   * Search matches across: voucherNumber, narration, reference, currencyCode,
   * voucherType / status (label-aware), totalAmount (when numeric), date (when
   * the input parses as YYYY-MM-DD), the linked contact name, and the creator
   * first/last name.
   */
  async findAll(tenantId: string, filters: VoucherFilterDto) {
    const {
      type,
      status,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.VoucherWhereInput = {
      tenantId,
    };

    if (type) {
      where.voucherType = type;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    if (search) {
      const term = search.trim();
      const lower = term.toLowerCase();
      const orConditions: Prisma.VoucherWhereInput[] = [
        { voucherNumber: { contains: term, mode: 'insensitive' } },
        { narration: { contains: term, mode: 'insensitive' } },
        { reference: { contains: term, mode: 'insensitive' } },
        { currencyCode: { contains: term, mode: 'insensitive' } },
        { contact: { is: { name: { contains: term, mode: 'insensitive' } } } },
        { createdBy: { is: { firstName: { contains: term, mode: 'insensitive' } } } },
        { createdBy: { is: { lastName: { contains: term, mode: 'insensitive' } } } },
      ];

      // Enum match: voucherType (handles labels like "Sales", "Credit Note")
      for (const value of Object.values(VoucherType)) {
        if (
          value.toLowerCase().includes(lower) ||
          value.replace(/_/g, ' ').toLowerCase().includes(lower)
        ) {
          orConditions.push({ voucherType: value });
        }
      }

      // Enum match: status
      for (const value of Object.values(VoucherStatus)) {
        if (
          value.toLowerCase().includes(lower) ||
          value.replace(/_/g, ' ').toLowerCase().includes(lower)
        ) {
          orConditions.push({ status: value });
        }
      }

      // Numeric match against totalAmount
      const numeric = Number(term.replace(/[, ]/g, ''));
      if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
        orConditions.push({ totalAmount: new Prisma.Decimal(numeric) });
      }

      // Date match (YYYY-MM-DD) against the voucher date
      if (/^\d{4}-\d{2}-\d{2}$/.test(term)) {
        const start = new Date(`${term}T00:00:00.000Z`);
        const end = new Date(`${term}T23:59:59.999Z`);
        if (!Number.isNaN(start.getTime())) {
          orConditions.push({ date: { gte: start, lte: end } });
        }
      }

      where.OR = orConditions;
    }

    const allowedSortFields = [
      'date',
      'voucherNumber',
      'voucherType',
      'totalAmount',
      'status',
      'createdAt',
    ];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const skip = (page - 1) * limit;

    const [vouchers, total] = await this.prisma.$transaction([
      this.prisma.voucher.findMany({
        where,
        include: {
          lineItems: {
            include: { account: { select: { id: true, code: true, name: true } } },
            orderBy: { lineOrder: 'asc' },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ [orderField]: sortOrder }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.voucher.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: vouchers,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get a single voucher with all relations.
   */
  async findOne(tenantId: string, id: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id, tenantId },
      include: {
        lineItems: {
          include: { account: { select: { id: true, code: true, name: true } } },
          orderBy: { lineOrder: 'asc' },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        journalEntry: {
          include: {
            lines: {
              include: { account: { select: { id: true, code: true, name: true } } },
              orderBy: { lineOrder: 'asc' },
            },
          },
        },
        attachments: true,
        reversedFrom: { select: { id: true, voucherNumber: true } },
        reversals: { select: { id: true, voucherNumber: true, status: true } },
        contact: { select: { id: true, name: true, invoiceTerms: true, paymentTermDays: true } },
      },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    return voucher;
  }

  /**
   * Update a voucher (only allowed in DRAFT status).
   */
  async update(tenantId: string, id: string, dto: UpdateVoucherDto) {
    const existing = await this.prisma.voucher.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    if (existing.status !== VoucherStatus.DRAFT) {
      throw new ConflictException(
        `Cannot update voucher in ${existing.status} status. Only DRAFT vouchers can be edited.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.VoucherUpdateInput = {};

      if (dto.date !== undefined) {
        updateData.date = new Date(dto.date);
      }
      if (dto.narration !== undefined) {
        updateData.narration = dto.narration;
      }
      if (dto.reference !== undefined) {
        updateData.reference = dto.reference;
      }
      if (dto.currencyCode !== undefined) {
        updateData.currencyCode = dto.currencyCode;
      }
      if (dto.exchangeRate !== undefined) {
        updateData.exchangeRate = new Prisma.Decimal(
          toDecimal(dto.exchangeRate).toFixed(8),
        );
      }
      if (dto.contactId !== undefined) {
        updateData.contact = dto.contactId
          ? { connect: { id: dto.contactId } }
          : { disconnect: true };
      }
      if (dto.periodStart !== undefined) {
        updateData.periodStart = dto.periodStart ? new Date(dto.periodStart) : null;
      }
      if (dto.periodEnd !== undefined) {
        updateData.periodEnd = dto.periodEnd ? new Date(dto.periodEnd) : null;
      }

      // If line items are provided, replace them entirely
      if (dto.lineItems && dto.lineItems.length > 0) {
        const { totalDebits } = this.validateDoubleEntry(dto.lineItems);

        // Validate accounts
        const accountIds = dto.lineItems.map((li) => li.accountId);
        await this.validateAccounts(tenantId, accountIds, tx);

        const voucherExchangeRate = dto.exchangeRate || '1';

        // Delete existing line items
        await tx.voucherLineItem.deleteMany({ where: { voucherId: id } });

        // Create new line items
        const lineItemsData = dto.lineItems.map((li, index) => {
          const lineExchangeRate = li.exchangeRate || voucherExchangeRate;
          const debit = toDecimal(li.debit);
          const credit = toDecimal(li.credit);
          const baseDebit = convertCurrency(debit, lineExchangeRate);
          const baseCredit = convertCurrency(credit, lineExchangeRate);

          return {
            tenantId,
            voucherId: id,
            accountId: li.accountId,
            debit: new Prisma.Decimal(debit.toFixed(4)),
            credit: new Prisma.Decimal(credit.toFixed(4)),
            currencyCode: li.currencyCode || dto.currencyCode || 'USD',
            exchangeRate: new Prisma.Decimal(
              toDecimal(lineExchangeRate).toFixed(8),
            ),
            baseDebit: new Prisma.Decimal(baseDebit.toFixed(4)),
            baseCredit: new Prisma.Decimal(baseCredit.toFixed(4)),
            narration: li.narration || null,
            costCenter: li.costCenter || null,
            lineOrder: index + 1,
          };
        });

        await tx.voucherLineItem.createMany({ data: lineItemsData });

        updateData.totalAmount = new Prisma.Decimal(totalDebits.toFixed(4));
      }

      const voucher = await tx.voucher.update({
        where: { id },
        data: updateData,
        include: {
          lineItems: {
            include: { account: { select: { id: true, code: true, name: true } } },
            orderBy: { lineOrder: 'asc' },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return voucher;
    });
  }

  /**
   * Delete a voucher (only allowed in DRAFT status).
   * Cleans up attachment files from disk after DB cascade delete.
   */
  async delete(tenantId: string, id: string): Promise<void> {
    const existing = await this.prisma.voucher.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    if (existing.status !== VoucherStatus.DRAFT) {
      throw new ConflictException(
        `Cannot delete voucher in ${existing.status} status. Only DRAFT vouchers can be deleted.`,
      );
    }

    // Gather attachment paths before cascade delete removes them
    const attachments = await this.prisma.voucherAttachment.findMany({
      where: { voucherId: id, tenantId },
      select: { filePath: true },
    });

    await this.prisma.voucher.delete({ where: { id } });

    // Best-effort cleanup of files on disk
    for (const att of attachments) {
      const absPath = path.join(VouchersService.UPLOADS_BASE, att.filePath);
      try {
        await fs.unlink(absPath);
      } catch (err) {
        this.logger.warn(`Failed to delete file ${absPath}: ${err}`);
      }
    }
  }

  /**
   * Submit a voucher for approval (DRAFT -> PENDING_APPROVAL).
   */
  async submitForApproval(tenantId: string, id: string, userId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true, createdById: true },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    if (
      voucher.status !== VoucherStatus.DRAFT &&
      voucher.status !== VoucherStatus.REJECTED
    ) {
      throw new ConflictException(
        `Cannot submit voucher in ${voucher.status} status. Only DRAFT or REJECTED vouchers can be submitted for approval.`,
      );
    }

    const updated = await this.prisma.voucher.update({
      where: { id },
      data: {
        status: VoucherStatus.PENDING_APPROVAL,
        rejectionReason: null,
      },
      include: {
        lineItems: {
          include: { account: { select: { id: true, code: true, name: true } } },
          orderBy: { lineOrder: 'asc' },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    this.eventEmitter.emit(VOUCHER_EVENTS.SUBMITTED, {
      tenantId,
      voucherId: updated.id,
      voucherNumber: updated.voucherNumber,
      actorId: userId,
      actorName: `${updated.createdBy.firstName} ${updated.createdBy.lastName}`,
      createdById: updated.createdById,
    });

    return updated;
  }

  /**
   * Approve a voucher and auto-post it.
   * Only OWNER and CHIEF_ACCOUNTANT roles can approve (enforced at controller level).
   */
  async approve(tenantId: string, id: string, userId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true, voucherNumber: true, createdById: true },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    if (voucher.status !== VoucherStatus.PENDING_APPROVAL) {
      throw new ConflictException(
        `Cannot approve voucher in ${voucher.status} status. Only PENDING_APPROVAL vouchers can be approved.`,
      );
    }

    // Approve the voucher
    await this.prisma.voucher.update({
      where: { id },
      data: {
        status: VoucherStatus.APPROVED,
        approvedById: userId,
      },
    });

    // Auto-post after approval
    const posted = await this.post(tenantId, id);

    // Fetch actor name for notification
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    this.eventEmitter.emit(VOUCHER_EVENTS.APPROVED, {
      tenantId,
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      actorId: userId,
      actorName: actor ? `${actor.firstName} ${actor.lastName}` : 'Unknown',
      createdById: voucher.createdById,
    });

    return posted;
  }

  /**
   * Reject a voucher with a reason.
   * Only OWNER and CHIEF_ACCOUNTANT roles can reject (enforced at controller level).
   */
  async reject(tenantId: string, id: string, userId: string, reason: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true, voucherNumber: true, createdById: true },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    if (voucher.status !== VoucherStatus.PENDING_APPROVAL) {
      throw new ConflictException(
        `Cannot reject voucher in ${voucher.status} status. Only PENDING_APPROVAL vouchers can be rejected.`,
      );
    }

    const updated = await this.prisma.voucher.update({
      where: { id },
      data: {
        status: VoucherStatus.REJECTED,
        approvedById: userId,
        rejectionReason: reason,
      },
      include: {
        lineItems: {
          include: { account: { select: { id: true, code: true, name: true } } },
          orderBy: { lineOrder: 'asc' },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Fetch actor name for notification
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    this.eventEmitter.emit(VOUCHER_EVENTS.REJECTED, {
      tenantId,
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      actorId: userId,
      actorName: actor ? `${actor.firstName} ${actor.lastName}` : 'Unknown',
      createdById: voucher.createdById,
      rejectionReason: reason,
    });

    return updated;
  }

  /**
   * Post a voucher: create JournalEntry + JournalEntryLines, set status POSTED.
   * Uses a Prisma transaction to ensure atomicity.
   */
  async post(tenantId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findFirst({
        where: { id, tenantId },
        include: {
          lineItems: {
            orderBy: { lineOrder: 'asc' },
          },
        },
      });

      if (!voucher) {
        throw new NotFoundException(`Voucher with ID ${id} not found`);
      }

      if (voucher.status !== VoucherStatus.APPROVED) {
        throw new ConflictException(
          `Cannot post voucher in ${voucher.status} status. Only APPROVED vouchers can be posted.`,
        );
      }

      // Check no existing journal entry for this voucher
      const existingEntry = await tx.journalEntry.findUnique({
        where: { voucherId: id },
      });

      if (existingEntry) {
        throw new ConflictException(
          `Voucher ${voucher.voucherNumber} already has a journal entry`,
        );
      }

      // Generate journal entry number (JE-YYYYMM-NNNN)
      const entryDate = voucher.date;
      const year = entryDate.getFullYear();
      const month = String(entryDate.getMonth() + 1).padStart(2, '0');
      const entryPrefix = `JE-${year}${month}-`;

      const lastEntry = await tx.journalEntry.findFirst({
        where: {
          tenantId,
          entryNumber: { startsWith: entryPrefix },
        },
        orderBy: { entryNumber: 'desc' },
        select: { entryNumber: true },
      });

      let entrySequence = 1;
      if (lastEntry) {
        const lastSeq = parseInt(
          lastEntry.entryNumber.slice(entryPrefix.length),
          10,
        );
        if (!isNaN(lastSeq)) {
          entrySequence = lastSeq + 1;
        }
      }

      const entryNumber = `${entryPrefix}${String(entrySequence).padStart(4, '0')}`;

      // Create journal entry lines from voucher line items
      const journalLines = voucher.lineItems.map((li) => ({
        tenantId,
        accountId: li.accountId,
        debit: li.debit,
        credit: li.credit,
        baseCurrencyDebit: li.baseDebit,
        baseCurrencyCredit: li.baseCredit,
        currencyCode: li.currencyCode,
        exchangeRate: li.exchangeRate,
        narration: li.narration,
        lineOrder: li.lineOrder,
      }));

      // Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          tenantId,
          voucherId: id,
          entryNumber,
          entryDate: voucher.date,
          narration: voucher.narration,
          isReversing: false,
          lines: {
            createMany: {
              data: journalLines,
            },
          },
        },
        include: {
          lines: {
            include: { account: { select: { id: true, code: true, name: true } } },
            orderBy: { lineOrder: 'asc' },
          },
        },
      });

      // Update voucher status to POSTED
      const postedVoucher = await tx.voucher.update({
        where: { id },
        data: {
          status: VoucherStatus.POSTED,
          postedAt: new Date(),
        },
        include: {
          lineItems: {
            include: { account: { select: { id: true, code: true, name: true } } },
            orderBy: { lineOrder: 'asc' },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
          journalEntry: {
            include: {
              lines: {
                include: { account: { select: { id: true, code: true, name: true } } },
                orderBy: { lineOrder: 'asc' },
              },
            },
          },
        },
      });

      return postedVoucher;
    });
  }

  /**
   * Reverse a posted voucher: create a reversing voucher and journal entry.
   */
  async reverse(tenantId: string, id: string, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const original = await tx.voucher.findFirst({
        where: { id, tenantId },
        include: {
          lineItems: { orderBy: { lineOrder: 'asc' } },
          journalEntry: {
            include: { lines: { orderBy: { lineOrder: 'asc' } } },
          },
        },
      });

      if (!original) {
        throw new NotFoundException(`Voucher with ID ${id} not found`);
      }

      if (original.status !== VoucherStatus.POSTED) {
        throw new ConflictException(
          `Cannot reverse voucher in ${original.status} status. Only POSTED vouchers can be reversed.`,
        );
      }
      
      if (original.reversedFromId) {
        throw new ConflictException(
          `Cannot reverse voucher ${original.voucherNumber}: reversal entries cannot be reversed.`,
        );
      }

      if (!original.journalEntry) {
        throw new ConflictException(
          `Cannot reverse voucher ${original.voucherNumber}: no journal entry found`,
        );
      }

      // Generate reversal voucher number
      const reversalDate = new Date();
      const reversalVoucherNumber = await this.generateVoucherNumber(
        tenantId,
        original.voucherType,
        reversalDate,
        tx,
      );

      // Build reversed line items (swap debits and credits)
      const reversedLineItems = original.lineItems.map((li, index) => ({
        tenantId,
        accountId: li.accountId,
        debit: li.credit, // swapped
        credit: li.debit, // swapped
        currencyCode: li.currencyCode,
        exchangeRate: li.exchangeRate,
        baseDebit: li.baseCredit, // swapped
        baseCredit: li.baseDebit, // swapped
        narration: li.narration
          ? `Reversal: ${li.narration}`
          : `Reversal of ${original.voucherNumber}`,
        costCenter: li.costCenter,
        lineOrder: index + 1,
      }));

      // Create the reversing voucher (directly as POSTED since it's a system action)
      const reversalVoucher = await tx.voucher.create({
        data: {
          tenantId,
          voucherNumber: reversalVoucherNumber,
          voucherType: original.voucherType,
          status: VoucherStatus.POSTED,
          date: reversalDate,
          narration: `Reversal of ${original.voucherNumber}: ${original.narration}`,
          reference: original.reference,
          totalAmount: original.totalAmount,
          currencyCode: original.currencyCode,
          exchangeRate: original.exchangeRate,
          createdById: userId,
          approvedById: userId,
          postedAt: new Date(),
          reversedFromId: original.id,
          lineItems: {
            createMany: {
              data: reversedLineItems,
            },
          },
        },
      });

      // Generate journal entry number for the reversal
      const year = reversalDate.getFullYear();
      const month = String(reversalDate.getMonth() + 1).padStart(2, '0');
      const entryPrefix = `JE-${year}${month}-`;

      const lastEntry = await tx.journalEntry.findFirst({
        where: {
          tenantId,
          entryNumber: { startsWith: entryPrefix },
        },
        orderBy: { entryNumber: 'desc' },
        select: { entryNumber: true },
      });

      let entrySequence = 1;
      if (lastEntry) {
        const lastSeq = parseInt(
          lastEntry.entryNumber.slice(entryPrefix.length),
          10,
        );
        if (!isNaN(lastSeq)) {
          entrySequence = lastSeq + 1;
        }
      }

      const reversalEntryNumber = `${entryPrefix}${String(entrySequence).padStart(4, '0')}`;

      // Create reversing journal entry (swap debits and credits)
      const reversedJournalLines = original.journalEntry.lines.map(
        (line, index) => ({
          tenantId,
          accountId: line.accountId,
          debit: line.credit, // swapped
          credit: line.debit, // swapped
          baseCurrencyDebit: line.baseCurrencyCredit, // swapped
          baseCurrencyCredit: line.baseCurrencyDebit, // swapped
          currencyCode: line.currencyCode,
          exchangeRate: line.exchangeRate,
          narration: line.narration
            ? `Reversal: ${line.narration}`
            : `Reversal of ${original.voucherNumber}`,
          lineOrder: index + 1,
        }),
      );

      await tx.journalEntry.create({
        data: {
          tenantId,
          voucherId: reversalVoucher.id,
          entryNumber: reversalEntryNumber,
          entryDate: reversalDate,
          narration: `Reversal of ${original.voucherNumber}: ${original.narration}`,
          isReversing: true,
          reversedEntryId: original.journalEntry.id,
          lines: {
            createMany: {
              data: reversedJournalLines,
            },
          },
        },
      });

      // Mark original voucher as REVERSED
      await tx.voucher.update({
        where: { id: original.id },
        data: { status: VoucherStatus.REVERSED },
      });

      // Return the full reversal voucher with metadata for event
      const reversalResult = await tx.voucher.findFirst({
        where: { id: reversalVoucher.id },
        include: {
          lineItems: {
            include: { account: { select: { id: true, code: true, name: true } } },
            orderBy: { lineOrder: 'asc' },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
          journalEntry: {
            include: {
              lines: {
                include: {
                  account: { select: { id: true, code: true, name: true } },
                },
                orderBy: { lineOrder: 'asc' },
              },
            },
          },
          reversedFrom: { select: { id: true, voucherNumber: true } },
        },
      });

      return {
        reversalResult,
        originalVoucherNumber: original.voucherNumber,
        originalId: original.id,
        originalCreatedById: original.createdById,
      };
    });

    // Emit event AFTER transaction completes
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    this.eventEmitter.emit(VOUCHER_EVENTS.REVERSED, {
      tenantId,
      voucherId: result.originalId,
      voucherNumber: result.originalVoucherNumber,
      actorId: userId,
      actorName: actor ? `${actor.firstName} ${actor.lastName}` : 'Unknown',
      createdById: result.originalCreatedById,
    });

    return result.reversalResult;
  }

  // ─── Attachment Methods ──────────────────────────────────────────

  async uploadAttachment(
    tenantId: string,
    voucherId: string,
    file: { filename: string; mimetype: string; buffer: Buffer },
  ) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, tenantId },
      select: { id: true, status: true },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${voucherId} not found`);
    }

    if (
      voucher.status !== VoucherStatus.DRAFT &&
      voucher.status !== VoucherStatus.REJECTED
    ) {
      throw new ForbiddenException(
        `Cannot add attachments to voucher in ${voucher.status} status. Only DRAFT or REJECTED vouchers allow attachments.`,
      );
    }

    const count = await this.prisma.voucherAttachment.count({
      where: { voucherId, tenantId },
    });
    if (count >= VouchersService.MAX_ATTACHMENTS_PER_VOUCHER) {
      throw new BadRequestException(
        `Maximum of ${VouchersService.MAX_ATTACHMENTS_PER_VOUCHER} attachments per voucher reached`,
      );
    }

    if (!VouchersService.ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Allowed types: images, PDF, Office documents, CSV, TXT`,
      );
    }

    const ext = path.extname(file.filename) || '';
    const storedName = `${randomUUID()}${ext}`;
    const relativeDir = path.join(tenantId, 'vouchers', voucherId);
    const absoluteDir = path.join(VouchersService.UPLOADS_BASE, relativeDir);
    const relativePath = path.join(relativeDir, storedName);
    const absolutePath = path.join(absoluteDir, storedName);

    await fs.mkdir(absoluteDir, { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    const attachment = await this.prisma.voucherAttachment.create({
      data: {
        voucherId,
        tenantId,
        fileName: file.filename,
        filePath: relativePath,
        fileSize: file.buffer.length,
        mimeType: file.mimetype,
      },
    });

    return attachment;
  }

  async getAttachmentForDownload(
    tenantId: string,
    voucherId: string,
    attachmentId: string,
  ) {
    const attachment = await this.prisma.voucherAttachment.findFirst({
      where: { id: attachmentId, voucherId, tenantId },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment not found`);
    }

    const absolutePath = path.join(
      VouchersService.UPLOADS_BASE,
      attachment.filePath,
    );

    try {
      await fs.access(absolutePath);
    } catch {
      throw new NotFoundException(`Attachment file not found on disk`);
    }

    return {
      absolutePath,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
    };
  }

  async deleteAttachment(
    tenantId: string,
    voucherId: string,
    attachmentId: string,
  ) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, tenantId },
      select: { id: true, status: true },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${voucherId} not found`);
    }

    if (
      voucher.status !== VoucherStatus.DRAFT &&
      voucher.status !== VoucherStatus.REJECTED
    ) {
      throw new ForbiddenException(
        `Cannot delete attachments from voucher in ${voucher.status} status.`,
      );
    }

    const attachment = await this.prisma.voucherAttachment.findFirst({
      where: { id: attachmentId, voucherId, tenantId },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment not found`);
    }

    await this.prisma.voucherAttachment.delete({
      where: { id: attachmentId },
    });

    const absPath = path.join(
      VouchersService.UPLOADS_BASE,
      attachment.filePath,
    );
    try {
      await fs.unlink(absPath);
    } catch (err) {
      this.logger.warn(`Failed to delete file ${absPath}: ${err}`);
    }
  }

  async listAttachments(tenantId: string, voucherId: string) {
    return this.prisma.voucherAttachment.findMany({
      where: { voucherId, tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Comment Methods ─────────────────────────────────────────────

  async listComments(tenantId: string, voucherId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, tenantId },
      select: { id: true },
    });
    if (!voucher) throw new NotFoundException('Voucher not found');

    const comments = await this.prisma.voucherComment.findMany({
      where: { voucherId, tenantId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      user: {
        id: c.user.id,
        name: `${c.user.firstName} ${c.user.lastName}`.trim() || c.user.email,
        email: c.user.email,
      },
      attachments: c.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
      })),
    }));
  }

  async addComment(
    tenantId: string,
    voucherId: string,
    userId: string,
    body: string,
    files: { filename: string; mimetype: string; buffer: Buffer }[],
  ) {
    const trimmed = (body || '').trim();
    if (!trimmed && files.length === 0) {
      throw new BadRequestException('Comment body or at least one attachment is required');
    }

    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, tenantId },
      select: { id: true, voucherNumber: true },
    });
    if (!voucher) throw new NotFoundException('Voucher not found');

    const comment = await this.prisma.voucherComment.create({
      data: {
        voucherId,
        tenantId,
        userId,
        body: trimmed,
      },
    });

    for (const file of files) {
      if (!VouchersService.ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new BadRequestException(
          `File type "${file.mimetype}" is not allowed`,
        );
      }
      const ext = path.extname(file.filename) || '';
      const storedName = `${randomUUID()}${ext}`;
      const relativeDir = path.join(tenantId, 'vouchers', voucherId, 'comments', comment.id);
      const absoluteDir = path.join(VouchersService.UPLOADS_BASE, relativeDir);
      const relativePath = path.join(relativeDir, storedName);
      const absolutePath = path.join(absoluteDir, storedName);

      await fs.mkdir(absoluteDir, { recursive: true });
      await fs.writeFile(absolutePath, file.buffer);

      await this.prisma.voucherCommentAttachment.create({
        data: {
          commentId: comment.id,
          tenantId,
          fileName: file.filename,
          filePath: relativePath,
          fileSize: file.buffer.length,
          mimeType: file.mimetype,
        },
      });
    }

    const fresh = await this.prisma.voucherComment.findUnique({
      where: { id: comment.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        attachments: true,
      },
    });

    const actorName =
      `${fresh!.user.firstName} ${fresh!.user.lastName}`.trim() || fresh!.user.email;

    this.eventEmitter.emit(VOUCHER_EVENTS.COMMENT_ADDED, {
      tenantId,
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      commentId: fresh!.id,
      commentBody: fresh!.body,
      actorId: userId,
      actorName,
    });

    return {
      id: fresh!.id,
      body: fresh!.body,
      createdAt: fresh!.createdAt.toISOString(),
      user: {
        id: fresh!.user.id,
        name: actorName,
        email: fresh!.user.email,
      },
      attachments: fresh!.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
      })),
    };
  }

  async getCommentAttachmentForDownload(
    tenantId: string,
    voucherId: string,
    commentId: string,
    attachmentId: string,
  ) {
    const attachment = await this.prisma.voucherCommentAttachment.findFirst({
      where: {
        id: attachmentId,
        tenantId,
        commentId,
        comment: { voucherId, tenantId },
      },
    });

    if (!attachment) throw new NotFoundException('Attachment not found');

    const absolutePath = path.join(
      VouchersService.UPLOADS_BASE,
      attachment.filePath,
    );

    try {
      await fs.access(absolutePath);
    } catch {
      throw new NotFoundException('Attachment file not found on disk');
    }

    return {
      absolutePath,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
    };
  }

  // ─── Mark Paid ──────────────────────────────────────────────────
  //
  // Creates a real PAYMENT (for AP) or RECEIPT (for AR) voucher allocated
  // against the invoice, in one transaction. After this runs, the invoice's
  // outstanding goes to zero and it drops off the AP/AR report. Optional
  // payment-proof file is attached to the new payment voucher.

  async markPaid(
    tenantId: string,
    invoiceVoucherId: string,
    userId: string,
    opts: {
      bankAccountId?: string;
      paymentDate?: string;
      paymentAmount?: string;
      file?: { filename: string; mimetype: string; buffer: Buffer };
    },
  ) {
    let bankAccountId = opts.bankAccountId;
    if (!bankAccountId) {
      const defaultBank = await this.prisma.bankAccount.findFirst({
        where: { tenantId, isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { accountId: true },
      });
      if (defaultBank) {
        bankAccountId = defaultBank.accountId;
      } else {
        const fallbackAsset = await this.prisma.account.findFirst({
          where: { tenantId, accountType: AccountType.ASSET, isActive: true },
          orderBy: { code: 'asc' },
          select: { id: true },
        });
        if (!fallbackAsset) {
          throw new BadRequestException(
            'No bank/cash account found for this tenant. Please configure one before marking invoices as paid.',
          );
        }
        bankAccountId = fallbackAsset.id;
      }
    }

    const invoice = await this.prisma.voucher.findFirst({
      where: { id: invoiceVoucherId, tenantId },
      include: {
        contact: { select: { id: true, accountId: true, name: true } },
        invoiceAllocations: { select: { amount: true } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice voucher not found');
    if (invoice.status !== VoucherStatus.POSTED) {
      throw new BadRequestException(
        'Only POSTED invoices can be marked as paid',
      );
    }
    if (
      invoice.voucherType !== VoucherType.PURCHASE &&
      invoice.voucherType !== VoucherType.SALES
    ) {
      throw new BadRequestException(
        'Only sales or purchase invoices can be marked as paid',
      );
    }
    if (!invoice.contactId || !invoice.contact?.accountId) {
      throw new BadRequestException(
        'Invoice contact must have a linked trade account',
      );
    }

    const total = new Decimal(invoice.totalAmount.toString());
    const paid = invoice.invoiceAllocations.reduce(
      (s, a) => s.plus(new Decimal(a.amount.toString())),
      new Decimal(0),
    );
    const outstanding = total.minus(paid);
    if (outstanding.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Invoice is already fully paid');
    }

    let amountToApply = outstanding;
    if (opts.paymentAmount !== undefined && opts.paymentAmount !== '') {
      let requested: Decimal;
      try {
        requested = new Decimal(opts.paymentAmount);
      } catch {
        throw new BadRequestException('paymentAmount must be a number');
      }
      if (!requested.isFinite() || requested.lessThanOrEqualTo(0)) {
        throw new BadRequestException('paymentAmount must be greater than zero');
      }
      if (requested.greaterThan(outstanding)) {
        throw new BadRequestException(
          `paymentAmount (${requested.toFixed(4)}) exceeds outstanding (${outstanding.toFixed(4)})`,
        );
      }
      amountToApply = requested.toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN);
    }

    const bank = await this.prisma.account.findFirst({
      where: { id: bankAccountId, tenantId, isActive: true },
      select: { id: true },
    });
    if (!bank) throw new NotFoundException('Bank account not found');

    const isAP = invoice.voucherType === VoucherType.PURCHASE;
    const tradeAccountId = invoice.contact.accountId;
    const amountStr = amountToApply.toFixed(4);
    const paymentDate = opts.paymentDate
      ? new Date(opts.paymentDate)
      : new Date();
    const paymentDateStr = paymentDate.toISOString().split('T')[0];

    // Double-entry:
    //   AP (settling a purchase invoice → cash leaves):
    //     Dr Trade Payable (contact's trade account)
    //     Cr Bank
    //   AR (settling a sales invoice → cash arrives):
    //     Dr Bank
    //     Cr Trade Receivable (contact's trade account)
    const lineItems = isAP
      ? [
          { accountId: tradeAccountId, debit: amountStr, credit: '0', narration: `Payment for ${invoice.voucherNumber}` },
          { accountId: bankAccountId, debit: '0', credit: amountStr, narration: 'Bank' },
        ]
      : [
          { accountId: bankAccountId, debit: amountStr, credit: '0', narration: 'Bank' },
          { accountId: tradeAccountId, debit: '0', credit: amountStr, narration: `Receipt for ${invoice.voucherNumber}` },
        ];

    const paymentVoucherType = isAP ? VoucherType.PAYMENT : VoucherType.RECEIPT;
    const narration = isAP
      ? `Payment against ${invoice.voucherNumber}`
      : `Receipt against ${invoice.voucherNumber}`;

    const result = await this.createWithAllocations(tenantId, userId, {
      voucher: {
        voucherType: paymentVoucherType,
        date: paymentDateStr,
        narration,
        contactId: invoice.contactId,
        currencyCode: invoice.currencyCode,
        lineItems,
      },
      allocations: [
        {
          invoiceVoucherId: invoice.id,
          amount: amountToApply.toNumber(),
          paidAt: paymentDateStr,
        },
      ],
    } as any);

    if (!result) {
      throw new Error('Failed to create payment voucher');
    }

    if (opts.file) {
      if (!VouchersService.ALLOWED_MIME_TYPES.has(opts.file.mimetype)) {
        throw new BadRequestException(
          `File type "${opts.file.mimetype}" is not allowed`,
        );
      }
      const ext = path.extname(opts.file.filename) || '';
      const storedName = `${randomUUID()}${ext}`;
      const relativeDir = path.join(tenantId, 'vouchers', result.id);
      const absoluteDir = path.join(VouchersService.UPLOADS_BASE, relativeDir);
      const relativePath = path.join(relativeDir, storedName);
      const absolutePath = path.join(absoluteDir, storedName);

      await fs.mkdir(absoluteDir, { recursive: true });
      await fs.writeFile(absolutePath, opts.file.buffer);

      // Attach directly via Prisma — bypasses the DRAFT-only restriction
      // because createWithAllocations posts the voucher immediately and we
      // still need to associate the proof with it.
      await this.prisma.voucherAttachment.create({
        data: {
          voucherId: result.id,
          tenantId,
          fileName: opts.file.filename,
          filePath: relativePath,
          fileSize: opts.file.buffer.length,
          mimeType: opts.file.mimetype,
          category: 'payment_proof',
        },
      });
    }

    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    const actorName = actor
      ? `${actor.firstName} ${actor.lastName}`.trim() || actor.email
      : 'Someone';

    this.eventEmitter.emit(VOUCHER_EVENTS.MARKED_PAID, {
      tenantId,
      voucherId: invoice.id,
      voucherNumber: invoice.voucherNumber,
      paymentVoucherId: result.id,
      paymentVoucherNumber: result.voucherNumber,
      amount: amountStr,
      paymentDate: paymentDateStr,
      isAR: !isAP,
      contactName: invoice.contact?.name || '—',
      actorId: userId,
      actorName,
    });

    return {
      paymentVoucherId: result.id,
      paymentVoucherNumber: result.voucherNumber,
      amount: amountStr,
      paymentDate: paymentDateStr,
    };
  }
}
