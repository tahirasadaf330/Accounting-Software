export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  level: number;
  debit: string;
  credit: string;
  children?: TrialBalanceRow[];
}

export interface TrialBalanceReport {
  asOfDate: string;
  fiscalYear: string;
  fiscalPeriod: string | null;
  currency: string;
  rows: TrialBalanceRow[];
  totalDebit: string;
  totalCredit: string;
}

export interface BalanceSheetSection {
  title: string;
  rows: TrialBalanceRow[];
  total: string;
}

export interface BalanceSheetReport {
  asOfDate: string;
  currency: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  totalLiabilitiesAndEquity: string;
}

export interface IncomeStatementReport {
  periodStart: string;
  periodEnd: string;
  currency: string;
  revenue: BalanceSheetSection;
  costOfGoodsSold: BalanceSheetSection;
  grossProfit: string;
  expenses: BalanceSheetSection;
  netIncome: string;
}

export interface StatementLine {
  date: string;
  voucherNumber: string;
  narration: string;
  debit: string;
  credit: string;
  runningBalance: string;
}

export interface StatementOfAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  openingBalance: string;
  lines: StatementLine[];
  closingBalance: string;
  totalDebit: string;
  totalCredit: string;
}
