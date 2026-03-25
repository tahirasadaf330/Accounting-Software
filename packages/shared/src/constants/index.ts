import { AccountType } from '../enums/account-types';

export const ACCOUNT_CODE_RANGES: Record<AccountType, { min: number; max: number }> = {
  [AccountType.ASSET]: { min: 1000, max: 1999 },
  [AccountType.LIABILITY]: { min: 2000, max: 2999 },
  [AccountType.EQUITY]: { min: 3000, max: 3999 },
  [AccountType.REVENUE]: { min: 4000, max: 4999 },
  [AccountType.COGS]: { min: 5000, max: 5999 },
  [AccountType.EXPENSE]: { min: 6000, max: 6999 },
};

export const MAX_ACCOUNT_LEVELS = 4;

export const DECIMAL_PLACES = 4;
export const MONETARY_PRECISION = 20;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 25,
  maxLimit: 100,
} as const;

export const JWT_CONSTANTS = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
} as const;

export const FISCAL_MONTHS = 12;
