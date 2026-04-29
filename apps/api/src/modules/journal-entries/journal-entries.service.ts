import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface JournalEntryFilterDto {
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  isReversing?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class JournalEntriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * List journal entries with filtering, searching, and pagination.
   */
  async findAll(tenantId: string, filters: JournalEntryFilterDto = {}) {
    const {
      dateFrom,
      dateTo,
      search,
      isReversing,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.JournalEntryWhereInput = {
      tenantId,
    };

    if (dateFrom || dateTo) {
      where.entryDate = {};
      if (dateFrom) {
        where.entryDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.entryDate.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        { narration: { contains: search, mode: 'insensitive' } },
        { entryNumber: { contains: search, mode: 'insensitive' } },
        {
          voucher: {
            is: { voucherNumber: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          voucher: {
            is: { reference: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    if (isReversing !== undefined) {
      where.isReversing = isReversing;
    }

    const allowedSortFields = ['entryDate', 'entryNumber', 'createdAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const skip = (page - 1) * limit;

    const [entries, total] = await this.prisma.$transaction([
      this.prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: {
              account: { select: { id: true, code: true, name: true } },
            },
            orderBy: { lineOrder: 'asc' },
          },
          voucher: {
            select: {
              id: true,
              voucherNumber: true,
              voucherType: true,
              status: true,
            },
          },
          reversedEntry: {
            select: { id: true, entryNumber: true },
          },
          reversals: {
            select: { id: true, entryNumber: true },
          },
        },
        orderBy: [{ [orderField]: sortOrder }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: entries,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get a single journal entry with all lines and relations.
   */
  async findOne(tenantId: string, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                code: true,
                name: true,
                accountType: true,
                normalBalance: true,
              },
            },
          },
          orderBy: { lineOrder: 'asc' },
        },
        voucher: {
          select: {
            id: true,
            voucherNumber: true,
            voucherType: true,
            status: true,
            date: true,
            narration: true,
            reference: true,
            currencyCode: true,
            exchangeRate: true,
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            approvedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        reversedEntry: {
          select: { id: true, entryNumber: true, entryDate: true },
        },
        reversals: {
          select: { id: true, entryNumber: true, entryDate: true },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Journal entry with ID ${id} not found`);
    }

    return entry;
  }

  /**
   * Get all journal entry lines for a specific account.
   * Used for generating ledgers and statement of accounts.
   */
  async findByAccount(
    tenantId: string,
    accountId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    // Verify the account exists for this tenant
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, tenantId },
      select: {
        id: true,
        code: true,
        name: true,
        accountType: true,
        normalBalance: true,
      },
    });

    if (!account) {
      throw new NotFoundException(
        `Account with ID ${accountId} not found for this tenant`,
      );
    }

    const where: Prisma.JournalEntryLineWhereInput = {
      tenantId,
      accountId,
    };

    // Filter by date range via the parent journal entry
    if (dateFrom || dateTo) {
      where.journalEntry = {};
      if (dateFrom) {
        where.journalEntry.entryDate = {
          ...((where.journalEntry.entryDate as Prisma.DateTimeFilter) || {}),
          gte: new Date(dateFrom),
        };
      }
      if (dateTo) {
        where.journalEntry.entryDate = {
          ...((where.journalEntry.entryDate as Prisma.DateTimeFilter) || {}),
          lte: new Date(dateTo),
        };
      }
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where,
      include: {
        journalEntry: {
          select: {
            id: true,
            entryNumber: true,
            entryDate: true,
            narration: true,
            isReversing: true,
            voucher: {
              select: {
                id: true,
                voucherNumber: true,
                voucherType: true,
                reference: true,
              },
            },
          },
        },
      },
      orderBy: [
        { journalEntry: { entryDate: 'asc' } },
        { lineOrder: 'asc' },
      ],
    });

    return {
      account,
      lines,
    };
  }
}
