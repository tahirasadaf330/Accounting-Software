import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountType, NormalBalance, Prisma } from '@prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountFilterDto } from './dto/account-filter.dto';
import {
  ACCOUNT_CODE_RANGES,
  MAX_ACCOUNT_LEVELS,
} from '@accounting-saas/shared';

export interface AccountTreeNode {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  accountType: AccountType;
  parentId: string | null;
  level: number;
  normalBalance: NormalBalance;
  isActive: boolean;
  isSystem: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  children: AccountTreeNode[];
}

@Injectable()
export class ChartOfAccountsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new account with full validation.
   */
  async create(tenantId: string, dto: CreateAccountDto) {
    // Validate level is within allowed range
    if (dto.level < 1 || dto.level > MAX_ACCOUNT_LEVELS) {
      throw new BadRequestException(
        `Account level must be between 1 and ${MAX_ACCOUNT_LEVELS}`,
      );
    }

    // Validate account code is numeric and within valid range for the account type
    const codeNum = parseInt(dto.code, 10);
    if (isNaN(codeNum)) {
      throw new BadRequestException('Account code must be numeric');
    }

    const range = ACCOUNT_CODE_RANGES[dto.accountType];
    if (codeNum < range.min || codeNum > range.max) {
      throw new BadRequestException(
        `Account code for ${dto.accountType} must be between ${range.min} and ${range.max}`,
      );
    }

    // Check code uniqueness within tenant
    const existingAccount = await this.prisma.account.findUnique({
      where: {
        tenantId_code: { tenantId, code: dto.code },
      },
    });

    if (existingAccount) {
      throw new ConflictException(
        `Account with code '${dto.code}' already exists for this tenant`,
      );
    }

    // Validate parent relationship
    if (dto.parentId) {
      const parent = await this.prisma.account.findFirst({
        where: { id: dto.parentId, tenantId },
      });

      if (!parent) {
        throw new NotFoundException(
          `Parent account with ID '${dto.parentId}' not found`,
        );
      }

      // Parent must be exactly one level above
      if (parent.level !== dto.level - 1) {
        throw new BadRequestException(
          `Parent account must be at level ${dto.level - 1} for a level ${dto.level} account. Parent is at level ${parent.level}`,
        );
      }

      // Cannot create child under a level 4 account
      if (parent.level >= MAX_ACCOUNT_LEVELS) {
        throw new BadRequestException(
          `Cannot create a child account under a level ${MAX_ACCOUNT_LEVELS} account`,
        );
      }

      // Parent and child must have the same account type
      if (parent.accountType !== dto.accountType) {
        throw new BadRequestException(
          `Child account type (${dto.accountType}) must match parent account type (${parent.accountType})`,
        );
      }
    } else {
      // If no parentId is provided, the account must be level 1
      if (dto.level !== 1) {
        throw new BadRequestException(
          'Accounts without a parent must be level 1',
        );
      }
    }

    return this.prisma.account.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        accountType: dto.accountType,
        parentId: dto.parentId ?? null,
        level: dto.level,
        normalBalance: dto.normalBalance,
        isSystem: dto.isSystem ?? false,
        description: dto.description ?? null,
      },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * List accounts for a tenant with optional filters.
   */
  async findAll(tenantId: string, filters: AccountFilterDto) {
    const where: Prisma.AccountWhereInput = { tenantId };

    if (filters.accountType) {
      where.accountType = filters.accountType;
    }

    if (filters.level !== undefined) {
      where.level = filters.level;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.account.findMany({
      where,
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
        children: {
          select: { id: true, code: true, name: true, isActive: true },
          orderBy: { code: 'asc' },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Get full account tree hierarchy for a tenant.
   * Returns a nested structure with all accounts organized by parent-child relationships.
   */
  async findTree(tenantId: string): Promise<AccountTreeNode[]> {
    const accounts = await this.prisma.account.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });

    // Build a map of id -> account with children array
    const accountMap = new Map<string, AccountTreeNode>();

    for (const account of accounts) {
      accountMap.set(account.id, { ...account, children: [] });
    }

    // Build the tree
    const roots: AccountTreeNode[] = [];

    for (const account of accounts) {
      const node = accountMap.get(account.id)!;
      if (account.parentId && accountMap.has(account.parentId)) {
        accountMap.get(account.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Get a single account by ID with its children.
   */
  async findOne(tenantId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, tenantId },
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
        children: {
          orderBy: { code: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            accountType: true,
            level: true,
            normalBalance: true,
            isActive: true,
            isSystem: true,
            description: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID '${id}' not found`);
    }

    return account;
  }

  /**
   * Update an account. Cannot change code or accountType.
   */
  async update(tenantId: string, id: string, dto: UpdateAccountDto) {
    const account = await this.prisma.account.findFirst({
      where: { id, tenantId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID '${id}' not found`);
    }

    if (account.isSystem) {
      throw new BadRequestException(
        'System accounts cannot be modified',
      );
    }

    const data: Prisma.AccountUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.isSystem !== undefined) {
      data.isSystem = dto.isSystem;
    }

    return this.prisma.account.update({
      where: { id },
      data,
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
        children: {
          select: { id: true, code: true, name: true, isActive: true },
          orderBy: { code: 'asc' },
        },
      },
    });
  }

  /**
   * Deactivate an account.
   * Validates that the account has no active children and no posted transactions.
   */
  async deactivate(tenantId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, tenantId },
      include: {
        children: {
          where: { isActive: true },
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID '${id}' not found`);
    }

    if (!account.isActive) {
      throw new BadRequestException('Account is already inactive');
    }

    if (account.isSystem) {
      throw new BadRequestException('System accounts cannot be deactivated');
    }

    // Check for active children
    if (account.children.length > 0) {
      throw new BadRequestException(
        `Cannot deactivate account with active children. Deactivate these child accounts first: ${account.children.map((c) => c.code).join(', ')}`,
      );
    }

    // Check for posted journal entry lines referencing this account
    const postedTransactionCount = await this.prisma.journalEntryLine.count({
      where: {
        tenantId,
        accountId: id,
        journalEntry: {
          voucher: {
            status: 'POSTED',
          },
        },
      },
    });

    if (postedTransactionCount > 0) {
      throw new BadRequestException(
        `Cannot deactivate account with ${postedTransactionCount} posted transaction(s). Reverse or adjust the transactions first`,
      );
    }

    return this.prisma.account.update({
      where: { id },
      data: { isActive: false },
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  /**
   * Activate a previously deactivated account.
   */
  async activate(tenantId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, tenantId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID '${id}' not found`);
    }

    if (account.isActive) {
      throw new BadRequestException('Account is already active');
    }

    // If the account has a parent, the parent must be active
    if (account.parentId) {
      const parent = await this.prisma.account.findFirst({
        where: { id: account.parentId, tenantId },
      });

      if (parent && !parent.isActive) {
        throw new BadRequestException(
          `Cannot activate account because its parent account '${parent.code} - ${parent.name}' is inactive. Activate the parent first`,
        );
      }
    }

    return this.prisma.account.update({
      where: { id },
      data: { isActive: true },
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  /**
   * Permanently delete an account.
   * Validates that the account has no children, transactions, balances, or linked bank accounts.
   */
  async delete(tenantId: string, id: string): Promise<void> {
    const account = await this.prisma.account.findFirst({
      where: { id, tenantId },
      include: {
        children: {
          select: { id: true, code: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID '${id}' not found`);
    }

    if (account.isSystem) {
      throw new BadRequestException('System accounts cannot be deleted');
    }

    if (account.children.length > 0) {
      const childCodes = account.children.map((c) => c.code).join(', ');
      throw new BadRequestException(
        `Cannot delete account with child accounts: ${childCodes}. Delete child accounts first`,
      );
    }

    const journalLineCount = await this.prisma.journalEntryLine.count({
      where: { tenantId, accountId: id },
    });
    if (journalLineCount > 0) {
      throw new BadRequestException(
        `Cannot delete account with ${journalLineCount} journal entry line(s)`,
      );
    }

    const voucherLineCount = await this.prisma.voucherLineItem.count({
      where: { tenantId, accountId: id },
    });
    if (voucherLineCount > 0) {
      throw new BadRequestException(
        `Cannot delete account with ${voucherLineCount} voucher line item(s)`,
      );
    }

    const balanceCount = await this.prisma.accountBalance.count({
      where: { tenantId, accountId: id },
    });
    if (balanceCount > 0) {
      throw new BadRequestException(
        'Cannot delete account with existing balance records',
      );
    }

    const bankAccountCount = await this.prisma.bankAccount.count({
      where: { tenantId, accountId: id },
    });
    if (bankAccountCount > 0) {
      throw new BadRequestException(
        'Cannot delete account linked to bank account(s)',
      );
    }

    await this.prisma.account.delete({ where: { id } });
  }

  /**
   * List all available account templates.
   */
  async getTemplates() {
    return this.prisma.accountTemplate.findMany({
      orderBy: { industry: 'asc' },
    });
  }

  /**
   * Apply a chart of accounts template to a tenant.
   * Creates all accounts defined in the template for the given tenant.
   * Skips accounts whose codes already exist for the tenant.
   */
  async applyTemplate(tenantId: string, templateId: string) {
    const template = await this.prisma.accountTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(
        `Account template with ID '${templateId}' not found`,
      );
    }

    // Template accounts is a JSON array of account definitions
    const templateAccounts = template.accounts as Array<{
      code: string;
      name: string;
      accountType: AccountType;
      level: number;
      normalBalance: NormalBalance;
      parentCode?: string;
      isSystem?: boolean;
      description?: string;
    }>;

    if (!Array.isArray(templateAccounts) || templateAccounts.length === 0) {
      throw new BadRequestException(
        'Template contains no account definitions',
      );
    }

    // Get existing account codes for this tenant to avoid conflicts
    const existingAccounts = await this.prisma.account.findMany({
      where: { tenantId },
      select: { code: true },
    });
    const existingCodes = new Set(existingAccounts.map((a) => a.code));

    // Sort template accounts by level to ensure parents are created before children
    const sortedAccounts = [...templateAccounts].sort(
      (a, b) => a.level - b.level,
    );

    // Track created accounts by code for parent resolution
    const codeToId = new Map<string, string>();

    // Pre-populate with existing accounts so parentCode can reference them
    const existingAccountsForMapping = await this.prisma.account.findMany({
      where: { tenantId },
      select: { id: true, code: true },
    });
    for (const acc of existingAccountsForMapping) {
      codeToId.set(acc.code, acc.id);
    }

    const createdAccounts: Array<{
      code: string;
      name: string;
      status: 'created' | 'skipped';
    }> = [];

    for (const templateAccount of sortedAccounts) {
      // Skip if account code already exists
      if (existingCodes.has(templateAccount.code)) {
        createdAccounts.push({
          code: templateAccount.code,
          name: templateAccount.name,
          status: 'skipped',
        });
        continue;
      }

      // Resolve parentId from parentCode
      let parentId: string | null = null;
      if (templateAccount.parentCode) {
        parentId = codeToId.get(templateAccount.parentCode) ?? null;
        if (!parentId) {
          // Parent code not found; skip this account rather than fail the whole batch
          createdAccounts.push({
            code: templateAccount.code,
            name: templateAccount.name,
            status: 'skipped',
          });
          continue;
        }
      }

      const account = await this.prisma.account.create({
        data: {
          tenantId,
          code: templateAccount.code,
          name: templateAccount.name,
          accountType: templateAccount.accountType,
          parentId,
          level: templateAccount.level,
          normalBalance: templateAccount.normalBalance,
          isSystem: templateAccount.isSystem ?? false,
          description: templateAccount.description ?? null,
        },
      });

      codeToId.set(account.code, account.id);
      existingCodes.add(account.code);
      createdAccounts.push({
        code: templateAccount.code,
        name: templateAccount.name,
        status: 'created',
      });
    }

    const createdCount = createdAccounts.filter(
      (a) => a.status === 'created',
    ).length;
    const skippedCount = createdAccounts.filter(
      (a) => a.status === 'skipped',
    ).length;

    return {
      templateId: template.id,
      templateName: template.name,
      industry: template.industry,
      summary: {
        totalInTemplate: templateAccounts.length,
        created: createdCount,
        skipped: skippedCount,
      },
      accounts: createdAccounts,
    };
  }
}
