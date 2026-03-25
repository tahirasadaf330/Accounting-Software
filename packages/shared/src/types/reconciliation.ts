import { MatchType, ReconciliationStatus } from '../enums/currencies';

export interface CreateBankAccountDto {
  accountId: string;
  bankName: string;
  accountNumber: string;
  currency: string;
}

export interface BankStatementLineResponse {
  id: string;
  date: string;
  description: string;
  reference: string | null;
  debit: string;
  credit: string;
  balance: string;
  isMatched: boolean;
  matchId: string | null;
}

export interface ReconciliationMatchDto {
  bankStatementLineId: string;
  journalEntryLineId: string;
}

export interface ReconciliationResponse {
  id: string;
  bankAccountId: string;
  periodStart: string;
  periodEnd: string;
  status: ReconciliationStatus;
  statementOpeningBalance: string;
  statementClosingBalance: string;
  bookBalance: string;
  difference: string;
  matchedCount: number;
  unmatchedBankLines: number;
  unmatchedBookEntries: number;
}

export interface AutoMatchResult {
  matched: number;
  unmatched: number;
  matches: Array<{
    bankStatementLineId: string;
    journalEntryLineId: string;
    matchType: MatchType;
    confidence: number;
  }>;
}
