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

export type BalanceNature = 'Receivable' | 'Payable' | 'Settled';

export interface StatementLine {
  date: string;
  voucherId: string;
  voucherNumber: string;
  narration: string;
  debit: string;
  credit: string;
  runningBalance: string;
  balanceNature: BalanceNature;
}

export interface StatementOfAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  openingBalance: string;
  openingBalanceNature: BalanceNature;
  lines: StatementLine[];
  closingBalance: string;
  closingBalanceNature: BalanceNature;
  closingDueDate: string | null;
  totalDebit: string;
  totalCredit: string;
}

export type AgingBucket = 'current' | '1-30' | '31-60' | '61-90' | '91+';

export interface ARAPRow {
  voucherId: string;
  voucherNumber: string;
  contactId: string;
  contactName: string;
  contactType?: 'CUSTOMER' | 'VENDOR' | 'BOTH' | null;
  voucherType?: 'SALES' | 'PURCHASE' | null;
  date: string;
  dueDate: string | null;
  totalAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  daysOverdue: number;
  agingBucket: AgingBucket;
  status: string;
  reference: string | null;
  narration: string;
  commentCount: number;
  nettingCycleId?: string | null;
  nettingCycleStatus?: string | null;
  isNettingSettlement?: boolean;
  isInApprovedCycle?: boolean;
  constituentRows?: ARAPRow[];
}

export interface ARAPAgingSummary {
  current: string;
  days1to30: string;
  days31to60: string;
  days61to90: string;
  days91plus: string;
}

export interface ARAPReport {
  reportType: 'AR' | 'AP';
  asOfDate: string;
  currency: string;
  rows: ARAPRow[];
  summary: {
    totalInvoiced: string;
    totalPaid: string;
    totalOutstanding: string;
    grossOutstanding: string;
    nettingAdjustment: string;
    aging: ARAPAgingSummary;
  };
  generatedAt: string;
  filters: {
    asOfDate: string | null;
    contactId: string | null;
    showOutstandingOnly: boolean;
    includeNettingAdjustments: boolean;
  };
}
