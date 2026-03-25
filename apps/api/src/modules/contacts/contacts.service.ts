import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountType, NormalBalance, ContactType } from '@prisma/client';
import { StatementOfAccountService } from '../reports/statement-of-account.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    private statementService: StatementOfAccountService,
  ) {}

  async create(tenantId: string, dto: CreateContactDto) {
    let accountId = dto.accountId;
    const contactType = dto.type || ContactType.CUSTOMER;

    // If accountId is provided, validate it
    if (accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: accountId, tenantId },
      });
      if (!account) {
        throw new NotFoundException('Selected account not found');
      }
      // Check if another contact is already linked to this account
      const existing = await this.prisma.contact.findFirst({
        where: { tenantId, accountId },
      });
      if (existing) {
        throw new ConflictException(
          'This account is already linked to another contact',
        );
      }
    }

    // Auto-create trade account if no accountId provided
    if (!accountId && dto.autoCreateAccount !== false) {
      accountId = await this.autoCreateTradeAccount(tenantId, dto.name);
    }

    const contact = await this.prisma.contact.create({
      data: {
        tenantId,
        type: contactType,
        name: dto.name,
        email: dto.email || null,
        phone: dto.phone || null,
        address: dto.address || null,
        city: dto.city || null,
        state: dto.state || null,
        country: dto.country || null,
        postalCode: dto.postalCode || null,
        taxId: dto.taxId || null,
        creditLimit: dto.creditLimit ?? null,
        paymentTermDays: dto.paymentTermDays ?? null,
        currencyCode: dto.currencyCode || 'USD',
        accountId: accountId || null,
      },
      include: {
        account: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return this.formatResponse(contact);
  }

  async findAll(
    tenantId: string,
    search?: string,
    isActive?: string,
    type?: string,
  ) {
    const where: any = { tenantId };

    if (type && Object.values(ContactType).includes(type as ContactType)) {
      where.type = type as ContactType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const contacts = await this.prisma.contact.findMany({
      where,
      include: {
        account: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return contacts.map((c) => this.formatResponse(c));
  }

  async findOne(tenantId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
      include: {
        account: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.formatResponse(contact);
  }

  async update(tenantId: string, id: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const updated = await this.prisma.contact.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        postalCode: dto.postalCode,
        taxId: dto.taxId,
        creditLimit: dto.creditLimit,
        paymentTermDays: dto.paymentTermDays,
        currencyCode: dto.currencyCode,
        isActive: dto.isActive,
      },
      include: {
        account: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return this.formatResponse(updated);
  }

  async delete(tenantId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Check if there are any vouchers linked to this contact
    const voucherCount = await this.prisma.voucher.count({
      where: { tenantId, contactId: id },
    });

    if (voucherCount > 0) {
      throw new BadRequestException(
        `Cannot delete contact with ${voucherCount} linked voucher(s). Deactivate the contact instead.`,
      );
    }

    // Also check if the linked account has journal entries
    if (contact.accountId) {
      const entryCount = await this.prisma.journalEntryLine.count({
        where: { tenantId, accountId: contact.accountId },
      });
      if (entryCount > 0) {
        throw new BadRequestException(
          'Cannot delete contact whose account has posted transactions. Deactivate the contact instead.',
        );
      }
    }

    await this.prisma.contact.delete({ where: { id } });
  }

  async getStatement(
    tenantId: string,
    contactId: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, tenantId },
      include: {
        account: { select: { id: true, code: true, name: true } },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (!contact.accountId) {
      throw new BadRequestException(
        'This contact has no linked account. Cannot generate statement.',
      );
    }

    const statement = await this.statementService.generate(
      tenantId,
      contact.accountId,
      fromDate,
      toDate,
    );

    return {
      contactId: contact.id,
      contactName: contact.name,
      contactType: contact.type,
      ...statement,
    };
  }

  private async autoCreateTradeAccount(
    tenantId: string,
    contactName: string,
  ): Promise<string> {
    // Find the "Accounts Receivable" parent account (code 1200 range)
    const parentAccount = await this.prisma.account.findFirst({
      where: {
        tenantId,
        accountType: AccountType.ASSET,
        code: { gte: '1200', lte: '1299' },
        level: { lte: 3 },
      },
      orderBy: { level: 'asc' },
    });

    const parentId = parentAccount?.id || null;
    const parentLevel = parentAccount?.level || 0;

    // Find the next available account code in the 1200 range
    const lastAccount = await this.prisma.account.findFirst({
      where: {
        tenantId,
        code: { gte: '1200', lte: '1299' },
      },
      orderBy: { code: 'desc' },
    });

    let nextCode: string;
    if (lastAccount) {
      const lastNum = parseInt(lastAccount.code, 10);
      nextCode = String(lastNum + 1);
      if (parseInt(nextCode, 10) > 1299) {
        throw new BadRequestException(
          'No more account codes available in the trade accounts range (1200-1299). Please create the account manually.',
        );
      }
    } else {
      nextCode = '1200';
    }

    const newLevel = parentId ? Math.min(parentLevel + 1, 4) : 4;

    const account = await this.prisma.account.create({
      data: {
        tenantId,
        code: nextCode,
        name: `Trade - ${contactName}`,
        accountType: AccountType.ASSET,
        parentId,
        level: newLevel,
        normalBalance: NormalBalance.DEBIT,
        isActive: true,
        isSystem: false,
        description: `Auto-created trade account for contact: ${contactName}`,
      },
    });

    return account.id;
  }

  private formatResponse(contact: any) {
    return {
      id: contact.id,
      type: contact.type,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      city: contact.city,
      state: contact.state,
      country: contact.country,
      postalCode: contact.postalCode,
      taxId: contact.taxId,
      creditLimit: contact.creditLimit?.toString() || null,
      paymentTermDays: contact.paymentTermDays,
      currencyCode: contact.currencyCode,
      isActive: contact.isActive,
      accountId: contact.account?.id || contact.accountId || null,
      accountCode: contact.account?.code || null,
      accountName: contact.account?.name || null,
      createdAt: contact.createdAt.toISOString(),
    };
  }
}
