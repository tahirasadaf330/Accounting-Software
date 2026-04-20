import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toDecimal, ZERO } from '../../common/utils/decimal.utils';
import {
  StatementOfAccount,
  StatementLine,
  NormalBalance,
  BalanceNature,
} from '@accounting-saas/shared';

function getBalanceNature(balance: import('decimal.js').Decimal, isDebitNormal: boolean): BalanceNature {
  if (balance.isZero()) return 'Settled';
  if (isDebitNormal) {
    return balance.isPositive() ? 'Receivable' : 'Payable';
  }
  return balance.isPositive() ? 'Payable' : 'Receivable';
}

@Injectable()
export class StatementOfAccountService {
  constructor(private prisma: PrismaService) {}

  async generate(
    tenantId: string,
    accountId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<StatementOfAccount> {
    // Default date range: start of current calendar year to today
    const effectiveToDate = toDate ? new Date(toDate) : new Date();
    const effectiveFromDate = fromDate
      ? new Date(fromDate)
      : new Date(effectiveToDate.getFullYear(), 0, 1);

    // Fetch the account
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, tenantId },
      select: {
        id: true,
        code: true,
        name: true,
        normalBalance: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    const isDebitNormal = account.normalBalance === NormalBalance.DEBIT;

    // Calculate opening balance: sum of all entries before fromDate
    const openingLines = await this.prisma.journalEntryLine.findMany({
      where: {
        tenantId,
        accountId,
        journalEntry: {
          entryDate: { lt: effectiveFromDate },
        },
      },
      select: {
        baseCurrencyDebit: true,
        baseCurrencyCredit: true,
      },
    });

    let openingBalance = ZERO;
    for (const line of openingLines) {
      const debit = toDecimal(line.baseCurrencyDebit.toString());
      const credit = toDecimal(line.baseCurrencyCredit.toString());
      if (isDebitNormal) {
        openingBalance = openingBalance.plus(debit).minus(credit);
      } else {
        openingBalance = openingBalance.plus(credit).minus(debit);
      }
    }

    // Fetch all journal entry lines in the date range for this account
    const periodLines = await this.prisma.journalEntryLine.findMany({
      where: {
        tenantId,
        accountId,
        journalEntry: {
          entryDate: {
            gte: effectiveFromDate,
            lte: effectiveToDate,
          },
        },
      },
      include: {
        journalEntry: {
          select: {
            entryDate: true,
            narration: true,
            voucher: {
              select: {
                voucherNumber: true,
                periodEnd: true,
                contact: { select: { paymentTermDays: true } },
              },
            },
          },
        },
      },
      orderBy: {
        journalEntry: {
          entryDate: 'asc',
        },
      },
    });

    // Build statement lines with running balance
    let runningBalance = openingBalance;
    let totalDebit = ZERO;
    let totalCredit = ZERO;
    let latestDueDate: string | null = null;

    const statementLines: StatementLine[] = periodLines.map((line) => {
      const debit = toDecimal(line.baseCurrencyDebit.toString());
      const credit = toDecimal(line.baseCurrencyCredit.toString());

      totalDebit = totalDebit.plus(debit);
      totalCredit = totalCredit.plus(credit);

      if (isDebitNormal) {
        runningBalance = runningBalance.plus(debit).minus(credit);
      } else {
        runningBalance = runningBalance.plus(credit).minus(debit);
      }

      const entryDate = line.journalEntry.entryDate;
      const dateStr =
        entryDate instanceof Date
          ? entryDate.toISOString().split('T')[0]
          : String(entryDate).split('T')[0];

      // Track latest due date (periodEnd + contact's payment terms in days) for closing balance
      const periodEnd = line.journalEntry.voucher.periodEnd;
      if (periodEnd) {
        const d = new Date(periodEnd);
        const termDays = line.journalEntry.voucher.contact?.paymentTermDays || 1;
        d.setDate(d.getDate() + termDays);
        const dueDate = d.toISOString().split('T')[0];
        if (!latestDueDate || dueDate > latestDueDate) {
          latestDueDate = dueDate;
        }
      }

      return {
        date: dateStr,
        voucherNumber: line.journalEntry.voucher.voucherNumber,
        narration: line.narration || line.journalEntry.narration,
        debit: debit.toFixed(4),
        credit: credit.toFixed(4),
        runningBalance: runningBalance.abs().toFixed(4),
        balanceNature: getBalanceNature(runningBalance, isDebitNormal),
      };
    });

    const closingBalance = runningBalance;

    // Fetch tenant currency
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { baseCurrency: true },
    });

    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      periodStart: effectiveFromDate.toISOString().split('T')[0],
      periodEnd: effectiveToDate.toISOString().split('T')[0],
      currency: tenant?.baseCurrency ?? 'USD',
      openingBalance: openingBalance.abs().toFixed(4),
      openingBalanceNature: getBalanceNature(openingBalance, isDebitNormal),
      lines: statementLines,
      closingBalance: closingBalance.abs().toFixed(4),
      closingBalanceNature: getBalanceNature(closingBalance, isDebitNormal),
      closingDueDate: latestDueDate,
      totalDebit: totalDebit.toFixed(4),
      totalCredit: totalCredit.toFixed(4),
    };
  }
}
