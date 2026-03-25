import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toDecimal, sumDecimals } from '../../common/utils/decimal.utils';
import Decimal from 'decimal.js';
import {
  IncomeStatementReport,
  BalanceSheetSection,
  TrialBalanceRow,
  AccountType,
  NormalBalance,
} from '@accounting-saas/shared';

interface AccountAggregate {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  level: number;
  parentId: string | null;
  normalBalance: string;
  totalDebit: Decimal;
  totalCredit: Decimal;
}

@Injectable()
export class IncomeStatementService {
  constructor(private prisma: PrismaService) {}

  async generate(
    tenantId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<IncomeStatementReport> {
    // Default date range: start of current calendar year to today
    const effectiveToDate = toDate ? new Date(toDate) : new Date();
    const effectiveFromDate = fromDate
      ? new Date(fromDate)
      : new Date(effectiveToDate.getFullYear(), 0, 1);

    // Fetch all journal entry lines within the period for income/expense accounts
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        tenantId,
        journalEntry: {
          entryDate: {
            gte: effectiveFromDate,
            lte: effectiveToDate,
          },
        },
        account: {
          accountType: {
            in: [AccountType.REVENUE, AccountType.COGS, AccountType.EXPENSE],
          },
        },
      },
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            accountType: true,
            level: true,
            parentId: true,
            normalBalance: true,
          },
        },
      },
    });

    // Group by account and sum debits/credits
    const accountMap = new Map<string, AccountAggregate>();

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
          parentId: line.account.parentId,
          normalBalance: line.account.normalBalance,
          totalDebit: lineDebit,
          totalCredit: lineCredit,
        });
      }
    }

    // Calculate balance based on normal balance side
    const calcBalance = (agg: AccountAggregate): Decimal => {
      if (agg.normalBalance === NormalBalance.DEBIT) {
        // COGS and EXPENSE: debit normal, balance = debit - credit
        return agg.totalDebit.minus(agg.totalCredit);
      }
      // REVENUE: credit normal, balance = credit - debit
      return agg.totalCredit.minus(agg.totalDebit);
    };

    // Build section rows with level-2 grouping
    const buildSectionRows = (accounts: AccountAggregate[]): TrialBalanceRow[] => {
      const sorted = accounts.sort((a, b) =>
        a.accountCode.localeCompare(b.accountCode),
      );

      const groupMap = new Map<string, TrialBalanceRow>();
      const ungrouped: TrialBalanceRow[] = [];

      for (const acc of sorted) {
        const balance = calcBalance(acc);
        const row: TrialBalanceRow = {
          accountId: acc.accountId,
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          accountType: acc.accountType,
          level: acc.level,
          debit: acc.normalBalance === NormalBalance.DEBIT
            ? balance.toFixed(4)
            : '0.0000',
          credit: acc.normalBalance === NormalBalance.CREDIT
            ? balance.toFixed(4)
            : '0.0000',
        };

        if (acc.level <= 2) {
          const existing = groupMap.get(acc.accountId);
          if (existing) {
            existing.debit = row.debit;
            existing.credit = row.credit;
          } else {
            row.children = [];
            groupMap.set(acc.accountId, row);
          }
        } else if (acc.parentId && groupMap.has(acc.parentId)) {
          groupMap.get(acc.parentId)!.children!.push(row);
        } else {
          let placed = false;
          for (const [groupId, groupRow] of groupMap) {
            if (
              acc.accountCode.startsWith(groupRow.accountCode) &&
              groupId !== acc.accountId
            ) {
              groupRow.children!.push(row);
              placed = true;
              break;
            }
          }
          if (!placed) {
            ungrouped.push(row);
          }
        }
      }

      return [...Array.from(groupMap.values()), ...ungrouped];
    };

    // Separate by type
    const revenueAccounts = Array.from(accountMap.values()).filter(
      (a) => a.accountType === AccountType.REVENUE,
    );
    const cogsAccounts = Array.from(accountMap.values()).filter(
      (a) => a.accountType === AccountType.COGS,
    );
    const expenseAccounts = Array.from(accountMap.values()).filter(
      (a) => a.accountType === AccountType.EXPENSE,
    );

    // Build sections
    const revenueRows = buildSectionRows(revenueAccounts);
    const totalRevenue = sumDecimals(
      revenueAccounts.map((a) => calcBalance(a).toString()),
    );

    const cogsRows = buildSectionRows(cogsAccounts);
    const totalCogs = sumDecimals(
      cogsAccounts.map((a) => calcBalance(a).toString()),
    );

    const grossProfit = totalRevenue.minus(totalCogs);

    const expenseRows = buildSectionRows(expenseAccounts);
    const totalExpenses = sumDecimals(
      expenseAccounts.map((a) => calcBalance(a).toString()),
    );

    const netIncome = grossProfit.minus(totalExpenses);

    // Fetch tenant currency
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { baseCurrency: true },
    });

    const revenue: BalanceSheetSection = {
      title: 'Revenue',
      rows: revenueRows,
      total: totalRevenue.toFixed(4),
    };

    const costOfGoodsSold: BalanceSheetSection = {
      title: 'Cost of Goods Sold',
      rows: cogsRows,
      total: totalCogs.toFixed(4),
    };

    const expenses: BalanceSheetSection = {
      title: 'Operating Expenses',
      rows: expenseRows,
      total: totalExpenses.toFixed(4),
    };

    return {
      periodStart: effectiveFromDate.toISOString().split('T')[0],
      periodEnd: effectiveToDate.toISOString().split('T')[0],
      currency: tenant?.baseCurrency ?? 'USD',
      revenue,
      costOfGoodsSold,
      grossProfit: grossProfit.toFixed(4),
      expenses,
      netIncome: netIncome.toFixed(4),
    };
  }
}
