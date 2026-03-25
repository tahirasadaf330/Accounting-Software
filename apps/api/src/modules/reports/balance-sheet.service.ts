import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toDecimal, sumDecimals, ZERO } from '../../common/utils/decimal.utils';
import Decimal from 'decimal.js';
import {
  BalanceSheetReport,
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
export class BalanceSheetService {
  constructor(private prisma: PrismaService) {}

  async generate(
    tenantId: string,
    asOfDate?: string,
  ): Promise<BalanceSheetReport> {
    const effectiveAsOfDate = asOfDate
      ? new Date(asOfDate)
      : new Date();

    // Fetch all journal entry lines up to the as-of date
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        tenantId,
        journalEntry: {
          entryDate: { lte: effectiveAsOfDate },
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

    // Calculate the balance for a given account based on its normal balance side
    const calcBalance = (agg: AccountAggregate): Decimal => {
      if (agg.normalBalance === NormalBalance.DEBIT) {
        return agg.totalDebit.minus(agg.totalCredit);
      }
      return agg.totalCredit.minus(agg.totalDebit);
    };

    // Separate accounts by type
    const assetAccounts = Array.from(accountMap.values()).filter(
      (a) => a.accountType === AccountType.ASSET,
    );
    const liabilityAccounts = Array.from(accountMap.values()).filter(
      (a) => a.accountType === AccountType.LIABILITY,
    );
    const equityAccounts = Array.from(accountMap.values()).filter(
      (a) => a.accountType === AccountType.EQUITY,
    );
    const revenueAccounts = Array.from(accountMap.values()).filter(
      (a) => a.accountType === AccountType.REVENUE,
    );
    const cogsAccounts = Array.from(accountMap.values()).filter(
      (a) => a.accountType === AccountType.COGS,
    );
    const expenseAccounts = Array.from(accountMap.values()).filter(
      (a) => a.accountType === AccountType.EXPENSE,
    );

    // Build section rows grouped by level-2 parents
    const buildSectionRows = (accounts: AccountAggregate[]): TrialBalanceRow[] => {
      const sorted = accounts.sort((a, b) =>
        a.accountCode.localeCompare(b.accountCode),
      );

      // Group accounts by their level-2 parent
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
          debit: balance.greaterThanOrEqualTo(ZERO) ? balance.toFixed(4) : '0.0000',
          credit: balance.lessThan(ZERO) ? balance.abs().toFixed(4) : '0.0000',
        };

        if (acc.level <= 2) {
          // This is a group-level account; it becomes a parent row
          const existing = groupMap.get(acc.accountId);
          if (existing) {
            // Merge: keep existing children, update header info
            existing.debit = row.debit;
            existing.credit = row.credit;
          } else {
            row.children = [];
            groupMap.set(acc.accountId, row);
          }
        } else if (acc.parentId && groupMap.has(acc.parentId)) {
          // Child of a known level-2 group
          groupMap.get(acc.parentId)!.children!.push(row);
        } else {
          // Try to find a level-2 ancestor by checking if any group's code
          // is a prefix of this account's code
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

    // Calculate section totals
    const assetRows = buildSectionRows(assetAccounts);
    const totalAssets = sumDecimals(
      assetAccounts.map((a) => calcBalance(a).toString()),
    );

    const liabilityRows = buildSectionRows(liabilityAccounts);
    const totalLiabilities = sumDecimals(
      liabilityAccounts.map((a) => calcBalance(a).toString()),
    );

    // Calculate net income: Revenue - COGS - Expenses
    const totalRevenue = sumDecimals(
      revenueAccounts.map((a) => calcBalance(a).toString()),
    );
    const totalCogs = sumDecimals(
      cogsAccounts.map((a) => calcBalance(a).toString()),
    );
    const totalExpenses = sumDecimals(
      expenseAccounts.map((a) => calcBalance(a).toString()),
    );
    const netIncome = totalRevenue.minus(totalCogs).minus(totalExpenses);

    // Equity = sum of equity accounts + retained earnings (net income)
    const equityRows = buildSectionRows(equityAccounts);
    const totalEquityAccounts = sumDecimals(
      equityAccounts.map((a) => calcBalance(a).toString()),
    );

    // Add retained earnings / net income as a synthetic row
    if (!netIncome.isZero()) {
      equityRows.push({
        accountId: 'retained-earnings',
        accountCode: '',
        accountName: 'Net Income (Current Period)',
        accountType: AccountType.EQUITY,
        level: 2,
        debit: netIncome.lessThan(ZERO) ? netIncome.abs().toFixed(4) : '0.0000',
        credit: netIncome.greaterThanOrEqualTo(ZERO) ? netIncome.toFixed(4) : '0.0000',
      });
    }

    const totalEquity = totalEquityAccounts.plus(netIncome);
    const totalLiabilitiesAndEquity = totalLiabilities.plus(totalEquity);

    // Fetch tenant currency
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { baseCurrency: true },
    });

    const assets: BalanceSheetSection = {
      title: 'Assets',
      rows: assetRows,
      total: totalAssets.toFixed(4),
    };

    const liabilities: BalanceSheetSection = {
      title: 'Liabilities',
      rows: liabilityRows,
      total: totalLiabilities.toFixed(4),
    };

    const equity: BalanceSheetSection = {
      title: 'Equity',
      rows: equityRows,
      total: totalEquity.toFixed(4),
    };

    return {
      asOfDate: effectiveAsOfDate.toISOString().split('T')[0],
      currency: tenant?.baseCurrency ?? 'USD',
      assets,
      liabilities,
      equity,
      totalLiabilitiesAndEquity: totalLiabilitiesAndEquity.toFixed(4),
    };
  }
}
