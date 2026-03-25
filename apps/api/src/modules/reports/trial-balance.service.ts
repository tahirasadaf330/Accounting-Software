import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toDecimal, sumDecimals, ZERO } from '../../common/utils/decimal.utils';
import Decimal from 'decimal.js';
import {
  TrialBalanceReport,
  TrialBalanceRow,
} from '@accounting-saas/shared';

@Injectable()
export class TrialBalanceService {
  constructor(private prisma: PrismaService) {}

  async generate(
    tenantId: string,
    asOfDate?: string,
    fiscalYearId?: string,
  ): Promise<TrialBalanceReport> {
    const effectiveAsOfDate = asOfDate
      ? new Date(asOfDate)
      : new Date();

    // Build the where clause for journal entry lines
    const journalEntryWhere: Record<string, unknown> = {
      tenantId,
      journalEntry: {
        entryDate: { lte: effectiveAsOfDate },
      },
    };

    // If a fiscal year is specified, restrict entries to that fiscal year's date range
    let fiscalYearName = 'All';
    if (fiscalYearId) {
      const fiscalYear = await this.prisma.fiscalYear.findFirst({
        where: { id: fiscalYearId, tenantId },
      });

      if (fiscalYear) {
        fiscalYearName = fiscalYear.name;
        journalEntryWhere.journalEntry = {
          entryDate: {
            gte: fiscalYear.startDate,
            lte: effectiveAsOfDate,
          },
        };
      }
    }

    // Fetch all journal entry lines with their account info
    const lines = await this.prisma.journalEntryLine.findMany({
      where: journalEntryWhere,
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            accountType: true,
            level: true,
            normalBalance: true,
          },
        },
      },
    });

    // Group by account and sum debits/credits
    const accountMap = new Map<
      string,
      {
        accountId: string;
        accountCode: string;
        accountName: string;
        accountType: string;
        level: number;
        normalBalance: string;
        totalDebit: Decimal;
        totalCredit: Decimal;
      }
    >();

    for (const line of lines) {
      const existing = accountMap.get(line.accountId);
      const lineDebit = toDecimal(line.baseCurrencyDebit.toString());
      const lineCredit = toDecimal(line.baseCurrencyCredit.toString());

      if (existing) {
        existing.totalDebit = existing.totalDebit.plus(lineDebit);
        existing.totalCredit = existing.totalCredit.plus(lineCredit);
      } else {
        accountMap.set(line.accountId, {
          accountId: line.account.id,
          accountCode: line.account.code,
          accountName: line.account.name,
          accountType: line.account.accountType,
          level: line.account.level,
          normalBalance: line.account.normalBalance,
          totalDebit: lineDebit,
          totalCredit: lineCredit,
        });
      }
    }

    // Build rows sorted by account code (only accounts with transactions)
    const sortedEntries = Array.from(accountMap.values()).sort((a, b) =>
      a.accountCode.localeCompare(b.accountCode),
    );

    const rows: TrialBalanceRow[] = sortedEntries.map((entry) => {
      // For trial balance, show net debit or net credit position
      const netAmount = entry.totalDebit.minus(entry.totalCredit);
      let debit = ZERO;
      let credit = ZERO;

      if (netAmount.greaterThan(ZERO)) {
        debit = netAmount;
      } else if (netAmount.lessThan(ZERO)) {
        credit = netAmount.abs();
      }

      return {
        accountId: entry.accountId,
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        accountType: entry.accountType,
        level: entry.level,
        debit: debit.toFixed(4),
        credit: credit.toFixed(4),
      };
    });

    // Calculate totals
    const totalDebit = sumDecimals(rows.map((r) => r.debit));
    const totalCredit = sumDecimals(rows.map((r) => r.credit));

    // Fetch tenant currency
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { baseCurrency: true },
    });

    return {
      asOfDate: effectiveAsOfDate.toISOString().split('T')[0],
      fiscalYear: fiscalYearName,
      fiscalPeriod: null,
      currency: tenant?.baseCurrency ?? 'USD',
      rows,
      totalDebit: totalDebit.toFixed(4),
      totalCredit: totalCredit.toFixed(4),
    };
  }
}
