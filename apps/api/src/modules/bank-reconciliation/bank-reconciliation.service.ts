import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchType, ReconciliationStatus } from '@prisma/client';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { ImportStatementDto } from './dto/import-statement.dto';
import { StartReconciliationDto } from './dto/start-reconciliation.dto';
import { ManualMatchDto } from './dto/manual-match.dto';
import { toDecimal, decimalEquals } from '../../common/utils/decimal.utils';
import Decimal from 'decimal.js';

/** Number of days tolerance for EXACT_AMOUNT_NEAR_DATE matching. */
const NEAR_DATE_TOLERANCE_DAYS = 3;

/** Confidence scores returned alongside each match type. */
const CONFIDENCE: Record<MatchType, number> = {
  [MatchType.EXACT_AMOUNT_DATE]: 1.0,
  [MatchType.EXACT_AMOUNT_NEAR_DATE]: 0.8,
  [MatchType.EXACT_AMOUNT]: 0.6,
  [MatchType.MANUAL]: 1.0,
};

@Injectable()
export class BankReconciliationService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Bank Accounts
  // ---------------------------------------------------------------------------

  async createBankAccount(tenantId: string, dto: CreateBankAccountDto) {
    // Verify the COA account exists and belongs to the tenant
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, tenantId },
    });

    if (!account) {
      throw new NotFoundException('Chart of accounts entry not found');
    }

    // Check for duplicate link
    const existing = await this.prisma.bankAccount.findUnique({
      where: { tenantId_accountId: { tenantId, accountId: dto.accountId } },
    });

    if (existing) {
      throw new ConflictException('A bank account is already linked to this COA account');
    }

    return this.prisma.bankAccount.create({
      data: {
        tenantId,
        accountId: dto.accountId,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        currency: dto.currency ?? 'USD',
      },
      include: { account: true },
    });
  }

  async findBankAccounts(tenantId: string) {
    return this.prisma.bankAccount.findMany({
      where: { tenantId },
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            accountType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------------------------------------------------------------------
  // Statements
  // ---------------------------------------------------------------------------

  async importStatement(tenantId: string, bankAccountId: string, dto: ImportStatementDto) {
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, tenantId },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const statement = await tx.bankStatement.create({
        data: {
          tenantId,
          bankAccountId,
          statementDate: new Date(dto.statementDate),
          openingBalance: dto.openingBalance,
          closingBalance: dto.closingBalance,
          fileName: dto.fileName,
          totalEntries: dto.lines.length,
        },
      });

      if (dto.lines.length > 0) {
        await tx.bankStatementLine.createMany({
          data: dto.lines.map((line) => ({
            bankStatementId: statement.id,
            tenantId,
            date: new Date(line.date),
            description: line.description,
            reference: line.reference ?? null,
            debit: line.debit,
            credit: line.credit,
            balance: line.balance,
          })),
        });
      }

      return tx.bankStatement.findUnique({
        where: { id: statement.id },
        include: {
          lines: { orderBy: { date: 'asc' } },
        },
      });
    });
  }

  async getStatements(tenantId: string, bankAccountId: string) {
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, tenantId },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    return this.prisma.bankStatement.findMany({
      where: { tenantId, bankAccountId },
      orderBy: { statementDate: 'desc' },
      include: {
        _count: { select: { lines: true } },
      },
    });
  }

  async getStatementLines(tenantId: string, statementId: string) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: statementId, tenantId },
    });

    if (!statement) {
      throw new NotFoundException('Bank statement not found');
    }

    return this.prisma.bankStatementLine.findMany({
      where: { bankStatementId: statementId, tenantId },
      orderBy: { date: 'asc' },
      include: {
        reconciliationMatches: {
          select: {
            id: true,
            matchType: true,
            reconciliationId: true,
            journalEntryLineId: true,
          },
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Reconciliation Lifecycle
  // ---------------------------------------------------------------------------

  async startReconciliation(tenantId: string, dto: StartReconciliationDto) {
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: dto.bankAccountId, tenantId },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    if (periodStart >= periodEnd) {
      throw new BadRequestException('Period start must be before period end');
    }

    // Check for overlapping in-progress reconciliation on the same bank account
    const overlapping = await this.prisma.reconciliation.findFirst({
      where: {
        tenantId,
        bankAccountId: dto.bankAccountId,
        status: ReconciliationStatus.IN_PROGRESS,
        OR: [
          { periodStart: { lte: periodEnd }, periodEnd: { gte: periodStart } },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException(
        'An in-progress reconciliation already exists for an overlapping period on this bank account',
      );
    }

    return this.prisma.reconciliation.create({
      data: {
        tenantId,
        bankAccountId: dto.bankAccountId,
        periodStart,
        periodEnd,
        status: ReconciliationStatus.IN_PROGRESS,
        notes: dto.notes ?? null,
      },
      include: {
        bankAccount: {
          include: {
            account: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  async getReconciliation(tenantId: string, reconciliationId: string) {
    const reconciliation = await this.prisma.reconciliation.findFirst({
      where: { id: reconciliationId, tenantId },
      include: {
        bankAccount: {
          include: {
            account: { select: { id: true, code: true, name: true } },
          },
        },
        reconciledBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        matches: {
          include: {
            bankStatementLine: true,
            journalEntryLine: {
              include: {
                journalEntry: {
                  select: { id: true, entryNumber: true, entryDate: true, narration: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!reconciliation) {
      throw new NotFoundException('Reconciliation not found');
    }

    // Compute summary counts
    const { unmatched: unmatchedItems } = await this.computeUnmatchedItems(tenantId, reconciliation);

    return {
      ...reconciliation,
      summary: {
        matchedCount: reconciliation.matches.length,
        unmatchedBankLines: unmatchedItems.bankLines.length,
        unmatchedJournalEntries: unmatchedItems.journalEntries.length,
      },
    };
  }

  async completeReconciliation(tenantId: string, reconciliationId: string, userId: string) {
    const reconciliation = await this.prisma.reconciliation.findFirst({
      where: { id: reconciliationId, tenantId },
    });

    if (!reconciliation) {
      throw new NotFoundException('Reconciliation not found');
    }

    if (reconciliation.status === ReconciliationStatus.COMPLETED) {
      throw new BadRequestException('Reconciliation is already completed');
    }

    return this.prisma.reconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: ReconciliationStatus.COMPLETED,
        reconciledById: userId,
        reconciledAt: new Date(),
      },
      include: {
        bankAccount: {
          include: {
            account: { select: { id: true, code: true, name: true } },
          },
        },
        reconciledBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        matches: true,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Auto-Match Algorithm
  // ---------------------------------------------------------------------------

  async autoMatch(tenantId: string, reconciliationId: string) {
    const reconciliation = await this.prisma.reconciliation.findFirst({
      where: { id: reconciliationId, tenantId },
      include: { bankAccount: true },
    });

    if (!reconciliation) {
      throw new NotFoundException('Reconciliation not found');
    }

    if (reconciliation.status === ReconciliationStatus.COMPLETED) {
      throw new BadRequestException('Cannot auto-match a completed reconciliation');
    }

    const accountId = reconciliation.bankAccount.accountId;
    const periodStart = reconciliation.periodStart;
    const periodEnd = reconciliation.periodEnd;

    // Fetch unmatched bank statement lines for this reconciliation period
    const bankLines = await this.getUnmatchedBankLines(tenantId, reconciliationId, periodStart, periodEnd);

    // Fetch unmatched journal entry lines for the linked COA account within the period
    const journalLines = await this.getUnmatchedJournalLines(tenantId, reconciliationId, accountId, periodStart, periodEnd);

    // Track which items have been consumed across passes
    const matchedBankLineIds = new Set<string>();
    const matchedJournalLineIds = new Set<string>();
    const newMatches: Array<{
      bankStatementLineId: string;
      journalEntryLineId: string;
      matchType: MatchType;
      confidence: number;
    }> = [];

    // ---- Pass 1: EXACT_AMOUNT_DATE ----
    this.runMatchPass(
      bankLines,
      journalLines,
      matchedBankLineIds,
      matchedJournalLineIds,
      newMatches,
      MatchType.EXACT_AMOUNT_DATE,
      (bankLine, journalLine) => {
        const amountMatch = this.amountsMatch(bankLine, journalLine);
        if (!amountMatch) return false;
        return this.sameDate(bankLine.date, journalLine.entryDate);
      },
    );

    // ---- Pass 2: EXACT_AMOUNT_NEAR_DATE ----
    this.runMatchPass(
      bankLines,
      journalLines,
      matchedBankLineIds,
      matchedJournalLineIds,
      newMatches,
      MatchType.EXACT_AMOUNT_NEAR_DATE,
      (bankLine, journalLine) => {
        const amountMatch = this.amountsMatch(bankLine, journalLine);
        if (!amountMatch) return false;
        return this.withinDays(bankLine.date, journalLine.entryDate, NEAR_DATE_TOLERANCE_DAYS);
      },
    );

    // ---- Pass 3: EXACT_AMOUNT ----
    this.runMatchPass(
      bankLines,
      journalLines,
      matchedBankLineIds,
      matchedJournalLineIds,
      newMatches,
      MatchType.EXACT_AMOUNT,
      (bankLine, journalLine) => {
        return this.amountsMatch(bankLine, journalLine);
      },
    );

    // Persist all new matches inside a transaction
    if (newMatches.length > 0) {
      await this.prisma.$transaction(
        newMatches.map((m) =>
          this.prisma.reconciliationMatch.create({
            data: {
              reconciliationId,
              tenantId,
              bankStatementLineId: m.bankStatementLineId,
              journalEntryLineId: m.journalEntryLineId,
              matchType: m.matchType,
            },
          }),
        ),
      );
    }

    const totalBankLines = bankLines.length;
    const totalMatched = newMatches.length;

    return {
      matched: totalMatched,
      unmatched: totalBankLines - totalMatched,
      matches: newMatches.map((m) => ({
        bankStatementLineId: m.bankStatementLineId,
        journalEntryLineId: m.journalEntryLineId,
        matchType: m.matchType,
        confidence: m.confidence,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Manual Match / Unmatch
  // ---------------------------------------------------------------------------

  async manualMatch(tenantId: string, reconciliationId: string, dto: ManualMatchDto) {
    const reconciliation = await this.prisma.reconciliation.findFirst({
      where: { id: reconciliationId, tenantId },
    });

    if (!reconciliation) {
      throw new NotFoundException('Reconciliation not found');
    }

    if (reconciliation.status === ReconciliationStatus.COMPLETED) {
      throw new BadRequestException('Cannot add matches to a completed reconciliation');
    }

    // Verify the bank statement line belongs to this tenant
    const bankLine = await this.prisma.bankStatementLine.findFirst({
      where: { id: dto.bankStatementLineId, tenantId },
    });

    if (!bankLine) {
      throw new NotFoundException('Bank statement line not found');
    }

    // Verify the journal entry line belongs to this tenant
    const journalLine = await this.prisma.journalEntryLine.findFirst({
      where: { id: dto.journalEntryLineId, tenantId },
    });

    if (!journalLine) {
      throw new NotFoundException('Journal entry line not found');
    }

    // Check if either side is already matched in this reconciliation
    const existingBankMatch = await this.prisma.reconciliationMatch.findUnique({
      where: {
        reconciliationId_bankStatementLineId: {
          reconciliationId,
          bankStatementLineId: dto.bankStatementLineId,
        },
      },
    });

    if (existingBankMatch) {
      throw new ConflictException('This bank statement line is already matched in this reconciliation');
    }

    const existingJournalMatch = await this.prisma.reconciliationMatch.findUnique({
      where: {
        reconciliationId_journalEntryLineId: {
          reconciliationId,
          journalEntryLineId: dto.journalEntryLineId,
        },
      },
    });

    if (existingJournalMatch) {
      throw new ConflictException('This journal entry line is already matched in this reconciliation');
    }

    return this.prisma.reconciliationMatch.create({
      data: {
        reconciliationId,
        tenantId,
        bankStatementLineId: dto.bankStatementLineId,
        journalEntryLineId: dto.journalEntryLineId,
        matchType: MatchType.MANUAL,
      },
      include: {
        bankStatementLine: true,
        journalEntryLine: {
          include: {
            journalEntry: {
              select: { id: true, entryNumber: true, entryDate: true, narration: true },
            },
          },
        },
      },
    });
  }

  async unmatch(tenantId: string, reconciliationId: string, matchId: string) {
    const reconciliation = await this.prisma.reconciliation.findFirst({
      where: { id: reconciliationId, tenantId },
    });

    if (!reconciliation) {
      throw new NotFoundException('Reconciliation not found');
    }

    if (reconciliation.status === ReconciliationStatus.COMPLETED) {
      throw new BadRequestException('Cannot remove matches from a completed reconciliation');
    }

    const match = await this.prisma.reconciliationMatch.findFirst({
      where: { id: matchId, reconciliationId, tenantId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    await this.prisma.reconciliationMatch.delete({
      where: { id: matchId },
    });

    return { message: 'Match removed successfully' };
  }

  // ---------------------------------------------------------------------------
  // Unmatched Items
  // ---------------------------------------------------------------------------

  async getUnmatchedItems(tenantId: string, reconciliationId: string) {
    const reconciliation = await this.prisma.reconciliation.findFirst({
      where: { id: reconciliationId, tenantId },
      include: { bankAccount: true },
    });

    if (!reconciliation) {
      throw new NotFoundException('Reconciliation not found');
    }

    const { unmatched } = await this.computeUnmatchedItems(tenantId, reconciliation);
    return unmatched;
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Get bank statement lines within the reconciliation period that are NOT
   * already matched in this reconciliation.
   */
  private async getUnmatchedBankLines(
    tenantId: string,
    reconciliationId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    // Get all bank statement line IDs already matched in this reconciliation
    const existingMatches = await this.prisma.reconciliationMatch.findMany({
      where: { reconciliationId, tenantId },
      select: { bankStatementLineId: true },
    });

    const matchedIds = existingMatches.map((m) => m.bankStatementLineId);

    return this.prisma.bankStatementLine.findMany({
      where: {
        tenantId,
        date: { gte: periodStart, lte: periodEnd },
        ...(matchedIds.length > 0 ? { id: { notIn: matchedIds } } : {}),
        bankStatement: {
          bankAccount: {
            reconciliations: {
              some: { id: reconciliationId },
            },
          },
        },
      },
      include: {
        bankStatement: { select: { bankAccountId: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get journal entry lines for the linked COA account within the period that
   * are NOT already matched in this reconciliation.
   */
  private async getUnmatchedJournalLines(
    tenantId: string,
    reconciliationId: string,
    accountId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const existingMatches = await this.prisma.reconciliationMatch.findMany({
      where: { reconciliationId, tenantId },
      select: { journalEntryLineId: true },
    });

    const matchedIds = existingMatches.map((m) => m.journalEntryLineId);

    return this.prisma.journalEntryLine.findMany({
      where: {
        tenantId,
        accountId,
        journalEntry: {
          entryDate: { gte: periodStart, lte: periodEnd },
        },
        ...(matchedIds.length > 0 ? { id: { notIn: matchedIds } } : {}),
      },
      include: {
        journalEntry: {
          select: { id: true, entryNumber: true, entryDate: true, narration: true },
        },
      },
      orderBy: { journalEntry: { entryDate: 'asc' } },
    });
  }

  /**
   * Compute unmatched bank lines and journal entries for a reconciliation.
   * Used by both getReconciliation (summary) and getUnmatchedItems.
   */
  private async computeUnmatchedItems(
    tenantId: string,
    reconciliation: {
      id: string;
      periodStart: Date;
      periodEnd: Date;
      bankAccount?: { accountId: string } | null;
      bankAccountId: string;
    },
  ) {
    let accountId: string;

    if (reconciliation.bankAccount) {
      accountId = reconciliation.bankAccount.accountId;
    } else {
      const bankAccount = await this.prisma.bankAccount.findUnique({
        where: { id: reconciliation.bankAccountId },
        select: { accountId: true },
      });
      accountId = bankAccount!.accountId;
    }

    const bankLines = await this.getUnmatchedBankLines(
      tenantId,
      reconciliation.id,
      reconciliation.periodStart,
      reconciliation.periodEnd,
    );

    const journalEntries = await this.getUnmatchedJournalLines(
      tenantId,
      reconciliation.id,
      accountId,
      reconciliation.periodStart,
      reconciliation.periodEnd,
    );

    return {
      unmatched: {
        bankLines,
        journalEntries,
      },
    };
  }

  /**
   * Execute a single matching pass across all unmatched items.
   *
   * For each unmatched bank line, find the first unmatched journal line that
   * satisfies the given predicate. Each item can only be matched once per pass
   * (one-to-one). Already consumed items are tracked via the provided Sets so
   * subsequent passes skip them.
   */
  private runMatchPass(
    bankLines: Array<{ id: string; date: Date; debit: Decimal | any; credit: Decimal | any }>,
    journalLines: Array<{
      id: string;
      debit: Decimal | any;
      credit: Decimal | any;
      journalEntry: { entryDate: Date } | any;
    }>,
    matchedBankLineIds: Set<string>,
    matchedJournalLineIds: Set<string>,
    results: Array<{
      bankStatementLineId: string;
      journalEntryLineId: string;
      matchType: MatchType;
      confidence: number;
    }>,
    matchType: MatchType,
    predicate: (bankLine: any, journalLine: any) => boolean,
  ) {
    for (const bankLine of bankLines) {
      if (matchedBankLineIds.has(bankLine.id)) continue;

      for (const journalLine of journalLines) {
        if (matchedJournalLineIds.has(journalLine.id)) continue;

        const entryDate =
          journalLine.journalEntry?.entryDate ?? journalLine.journalEntry?.entryDate;
        const enrichedJournalLine = { ...journalLine, entryDate };

        if (predicate(bankLine, enrichedJournalLine)) {
          matchedBankLineIds.add(bankLine.id);
          matchedJournalLineIds.add(journalLine.id);
          results.push({
            bankStatementLineId: bankLine.id,
            journalEntryLineId: journalLine.id,
            matchType,
            confidence: CONFIDENCE[matchType],
          });
          break; // Move on to next bank line
        }
      }
    }
  }

  /**
   * Compare amounts between a bank statement line and a journal entry line.
   *
   * A bank debit (money out) corresponds to a journal credit on the bank
   * account, and a bank credit (money in) corresponds to a journal debit.
   *
   * We match when the net amounts are equal:
   *   bankNet = credit - debit   (from bank perspective)
   *   journalNet = debit - credit (journal entry on the bank COA account)
   *
   * They match when bankNet === journalNet (both represent the same movement).
   */
  private amountsMatch(
    bankLine: { debit: Decimal | any; credit: Decimal | any },
    journalLine: { debit: Decimal | any; credit: Decimal | any },
  ): boolean {
    const bankDebit = toDecimal(bankLine.debit);
    const bankCredit = toDecimal(bankLine.credit);
    const journalDebit = toDecimal(journalLine.debit);
    const journalCredit = toDecimal(journalLine.credit);

    // Net amount from bank perspective: positive = money in, negative = money out
    const bankNet = bankCredit.minus(bankDebit);
    // Net amount from journal perspective on the bank account: debit = money in, credit = money out
    const journalNet = journalDebit.minus(journalCredit);

    return decimalEquals(bankNet, journalNet);
  }

  /**
   * Check if two dates fall on the same calendar day.
   */
  private sameDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  /**
   * Check if two dates are within a given number of days of each other.
   */
  private withinDays(a: Date, b: Date, days: number): boolean {
    const msPerDay = 86_400_000;
    const diffMs = Math.abs(a.getTime() - b.getTime());
    return diffMs <= days * msPerDay;
  }
}
