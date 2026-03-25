export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  COGS = 'COGS',
  EXPENSE = 'EXPENSE',
}

export enum NormalBalance {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export const ACCOUNT_TYPE_NORMAL_BALANCE: Record<AccountType, NormalBalance> = {
  [AccountType.ASSET]: NormalBalance.DEBIT,
  [AccountType.LIABILITY]: NormalBalance.CREDIT,
  [AccountType.EQUITY]: NormalBalance.CREDIT,
  [AccountType.REVENUE]: NormalBalance.CREDIT,
  [AccountType.COGS]: NormalBalance.DEBIT,
  [AccountType.EXPENSE]: NormalBalance.DEBIT,
};

export enum AccountLevel {
  CATEGORY = 1,
  GROUP = 2,
  SUB_GROUP = 3,
  DETAIL = 4,
}
