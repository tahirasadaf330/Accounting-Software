import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantStatus } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { OnboardTenantDto } from './dto/onboard-tenant.dto';
import { SetupTenantDto } from './dto/setup-tenant.dto';
import { PAGINATION_DEFAULTS, FISCAL_MONTHS } from '@accounting-saas/shared';

const UPLOADS_BASE = path.join(process.cwd(), 'uploads');
const LOGO_ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
]);
const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('A tenant with this slug already exists');
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        baseCurrency: dto.baseCurrency ?? 'USD',
        fiscalYearStartMonth: dto.fiscalYearStartMonth ?? 1,
        timezone: dto.timezone ?? 'UTC',
        locale: dto.locale ?? 'en-US',
        status: TenantStatus.PENDING_SETUP,
      },
    });
  }

  async findAll(page?: number, limit?: number) {
    const currentPage = page && page > 0 ? page : PAGINATION_DEFAULTS.page;
    const currentLimit = limit && limit > 0
      ? Math.min(limit, PAGINATION_DEFAULTS.maxLimit)
      : PAGINATION_DEFAULTS.limit;
    const skip = (currentPage - 1) * currentLimit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        skip,
        take: currentLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      this.prisma.tenant.count(),
    ]);

    const totalPages = Math.ceil(total / currentLimit);

    return {
      data,
      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            accounts: true,
            vouchers: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.baseCurrency !== undefined && { baseCurrency: dto.baseCurrency }),
        ...(dto.fiscalYearStartMonth !== undefined && { fiscalYearStartMonth: dto.fiscalYearStartMonth }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.locale !== undefined && { locale: dto.locale }),
      },
    });
  }

  async suspend(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new BadRequestException('Tenant is already suspended');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.SUSPENDED },
    });
  }

  async activate(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }

    if (tenant.status === TenantStatus.ACTIVE) {
      throw new BadRequestException('Tenant is already active');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.ACTIVE },
    });
  }

  async onboard(id: string, dto: OnboardTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }

    if (tenant.status !== TenantStatus.PENDING_SETUP) {
      throw new BadRequestException(
        'Tenant has already been onboarded or is in an invalid state for onboarding',
      );
    }

    const template = await this.prisma.accountTemplate.findUnique({
      where: { id: dto.coaTemplateId },
    });

    if (!template) {
      throw new NotFoundException(
        `Account template with ID "${dto.coaTemplateId}" not found`,
      );
    }

    const templateAccounts = template.accounts as Array<{
      code: string;
      name: string;
      accountType: string;
      normalBalance: string;
      parentCode?: string;
      level: number;
      isSystem?: boolean;
      description?: string;
    }>;

    return this.prisma.$transaction(async (tx) => {
      // Update tenant settings
      const updatedTenant = await tx.tenant.update({
        where: { id },
        data: {
          baseCurrency: dto.baseCurrency,
          fiscalYearStartMonth: dto.fiscalYearStartMonth,
          timezone: dto.timezone ?? tenant.timezone,
          locale: dto.locale ?? tenant.locale,
          status: TenantStatus.ACTIVE,
        },
      });

      // Create default Chart of Accounts from the template
      const codeToIdMap = new Map<string, string>();

      // Sort by level to ensure parents are created before children
      const sortedAccounts = [...templateAccounts].sort((a, b) => a.level - b.level);

      for (const acct of sortedAccounts) {
        const parentId = acct.parentCode ? codeToIdMap.get(acct.parentCode) : null;

        const created = await tx.account.create({
          data: {
            tenantId: id,
            code: acct.code,
            name: acct.name,
            accountType: acct.accountType as any,
            normalBalance: acct.normalBalance as any,
            parentId: parentId ?? null,
            level: acct.level,
            isSystem: acct.isSystem ?? false,
            description: acct.description ?? null,
          },
        });

        codeToIdMap.set(acct.code, created.id);
      }

      // Create the first fiscal year
      const startMonth = dto.fiscalYearStartMonth;
      const now = new Date();
      let startYear = now.getFullYear();

      // If the fiscal year start month is after the current month, start from previous year
      if (startMonth > now.getMonth() + 1) {
        startYear -= 1;
      }

      const fiscalYearStart = new Date(startYear, startMonth - 1, 1);
      const fiscalYearEnd = new Date(startYear + 1, startMonth - 1, 0); // Last day of month before start

      const fiscalYearName = `FY ${startYear}-${startYear + 1}`;

      const fiscalYear = await tx.fiscalYear.create({
        data: {
          tenantId: id,
          name: fiscalYearName,
          startDate: fiscalYearStart,
          endDate: fiscalYearEnd,
        },
      });

      // Create fiscal periods (12 months)
      for (let i = 0; i < FISCAL_MONTHS; i++) {
        const periodMonth = ((startMonth - 1 + i) % 12);
        const periodYear = startYear + Math.floor((startMonth - 1 + i) / 12);
        const periodStart = new Date(periodYear, periodMonth, 1);
        const periodEnd = new Date(periodYear, periodMonth + 1, 0); // Last day of month

        const periodName = periodStart.toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
        });

        await tx.fiscalPeriod.create({
          data: {
            tenantId: id,
            fiscalYearId: fiscalYear.id,
            name: periodName,
            startDate: periodStart,
            endDate: periodEnd,
            periodNumber: i + 1,
          },
        });
      }

      return {
        tenant: updatedTenant,
        accountsCreated: templateAccounts.length,
        fiscalYear: {
          id: fiscalYear.id,
          name: fiscalYear.name,
          startDate: fiscalYear.startDate,
          endDate: fiscalYear.endDate,
        },
      };
    });
  }

  async setupTenant(tenantId: string, dto: SetupTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${tenantId}" not found`);
    }

    if (tenant.status !== TenantStatus.PENDING_SETUP) {
      throw new BadRequestException(
        'Tenant has already been set up or is in an invalid state',
      );
    }

    const template = await this.prisma.accountTemplate.findUnique({
      where: { id: dto.coaTemplateId },
    });

    if (!template) {
      throw new NotFoundException(
        `Account template with ID "${dto.coaTemplateId}" not found`,
      );
    }

    const templateAccounts = template.accounts as Array<{
      code: string;
      name: string;
      accountType: string;
      normalBalance: string;
      parentCode?: string;
      level: number;
      isSystem?: boolean;
      description?: string;
    }>;

    return this.prisma.$transaction(async (tx) => {
      // Update tenant with profile + settings + ACTIVE status
      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          baseCurrency: dto.baseCurrency,
          fiscalYearStartMonth: dto.fiscalYearStartMonth,
          timezone: dto.timezone ?? tenant.timezone,
          status: TenantStatus.ACTIVE,
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.address !== undefined && { address: dto.address || null }),
          ...(dto.city !== undefined && { city: dto.city || null }),
          ...(dto.state !== undefined && { state: dto.state || null }),
          ...(dto.postalCode !== undefined && { postalCode: dto.postalCode || null }),
          ...(dto.country !== undefined && { country: dto.country || null }),
          ...(dto.phone !== undefined && { phone: dto.phone || null }),
          ...(dto.email !== undefined && { email: dto.email || null }),
          ...(dto.website !== undefined && { website: dto.website || null }),
          ...(dto.taxId !== undefined && { taxId: dto.taxId || null }),
          ...(dto.registrationNumber !== undefined && { registrationNumber: dto.registrationNumber || null }),
        },
      });

      // Create Chart of Accounts from template
      const codeToIdMap = new Map<string, string>();
      const sortedAccounts = [...templateAccounts].sort((a, b) => a.level - b.level);

      for (const acct of sortedAccounts) {
        const parentId = acct.parentCode ? codeToIdMap.get(acct.parentCode) : null;

        const created = await tx.account.create({
          data: {
            tenantId,
            code: acct.code,
            name: acct.name,
            accountType: acct.accountType as any,
            normalBalance: acct.normalBalance as any,
            parentId: parentId ?? null,
            level: acct.level,
            isSystem: acct.isSystem ?? false,
            description: acct.description ?? null,
          },
        });

        codeToIdMap.set(acct.code, created.id);
      }

      // Create the first fiscal year
      const startMonth = dto.fiscalYearStartMonth;
      const now = new Date();
      let startYear = now.getFullYear();

      if (startMonth > now.getMonth() + 1) {
        startYear -= 1;
      }

      const fiscalYearStart = new Date(startYear, startMonth - 1, 1);
      const fiscalYearEnd = new Date(startYear + 1, startMonth - 1, 0);

      const fiscalYearName = `FY ${startYear}-${startYear + 1}`;

      const fiscalYear = await tx.fiscalYear.create({
        data: {
          tenantId,
          name: fiscalYearName,
          startDate: fiscalYearStart,
          endDate: fiscalYearEnd,
        },
      });

      // Create 12 fiscal periods
      for (let i = 0; i < FISCAL_MONTHS; i++) {
        const periodMonth = ((startMonth - 1 + i) % 12);
        const periodYear = startYear + Math.floor((startMonth - 1 + i) / 12);
        const periodStart = new Date(periodYear, periodMonth, 1);
        const periodEnd = new Date(periodYear, periodMonth + 1, 0);

        const periodName = periodStart.toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
        });

        await tx.fiscalPeriod.create({
          data: {
            tenantId,
            fiscalYearId: fiscalYear.id,
            name: periodName,
            startDate: periodStart,
            endDate: periodEnd,
            periodNumber: i + 1,
          },
        });
      }

      return {
        tenant: updatedTenant,
        accountsCreated: templateAccounts.length,
        fiscalYear: {
          id: fiscalYear.id,
          name: fiscalYear.name,
          startDate: fiscalYear.startDate,
          endDate: fiscalYear.endDate,
        },
      };
    });
  }

  async getProfile(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        baseCurrency: true,
        fiscalYearStartMonth: true,
        timezone: true,
        locale: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        taxId: true,
        registrationNumber: true,
        status: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant not found`);
    }

    return tenant;
  }

  async updateProfile(tenantId: string, dto: UpdateTenantProfileDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant not found`);
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address || null }),
        ...(dto.city !== undefined && { city: dto.city || null }),
        ...(dto.state !== undefined && { state: dto.state || null }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode || null }),
        ...(dto.country !== undefined && { country: dto.country || null }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.email !== undefined && { email: dto.email || null }),
        ...(dto.website !== undefined && { website: dto.website || null }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId || null }),
        ...(dto.registrationNumber !== undefined && { registrationNumber: dto.registrationNumber || null }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        baseCurrency: true,
        fiscalYearStartMonth: true,
        timezone: true,
        locale: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        taxId: true,
        registrationNumber: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async getStats(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }

    const [
      userCount,
      activeUserCount,
      accountCount,
      voucherCount,
      journalEntryCount,
      contactCount,
      bankAccountCount,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { tenantId: id } }),
      this.prisma.user.count({ where: { tenantId: id, status: 'ACTIVE' } }),
      this.prisma.account.count({ where: { tenantId: id } }),
      this.prisma.voucher.count({ where: { tenantId: id } }),
      this.prisma.journalEntry.count({ where: { tenantId: id } }),
      this.prisma.contact.count({ where: { tenantId: id } }),
      this.prisma.bankAccount.count({ where: { tenantId: id } }),
    ]);

    return {
      tenantId: id,
      tenantName: tenant.name,
      status: tenant.status,
      users: {
        total: userCount,
        active: activeUserCount,
      },
      accounts: accountCount,
      vouchers: voucherCount,
      journalEntries: journalEntryCount,
      contacts: contactCount,
      bankAccounts: bankAccountCount,
    };
  }

  async uploadLogo(
    tenantId: string,
    file: { filename: string; mimetype: string; buffer: Buffer },
  ) {
    if (!LOGO_ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Allowed: PNG, JPEG, WebP, SVG, GIF`,
      );
    }
    if (file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }
    if (file.buffer.length > LOGO_MAX_BYTES) {
      throw new BadRequestException(
        `Logo must be ${LOGO_MAX_BYTES / 1024 / 1024} MB or smaller`,
      );
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const ext = mimeToExt(file.mimetype);
    const relativeDir = path.join(tenantId, 'images');
    const absoluteDir = path.join(UPLOADS_BASE, relativeDir);
    const fileName = `logo${ext}`;
    const relativePath = path.join(relativeDir, fileName);
    const absolutePath = path.join(absoluteDir, fileName);

    await fs.mkdir(absoluteDir, { recursive: true });

    if (tenant.logoPath && tenant.logoPath !== relativePath) {
      const oldAbs = path.join(UPLOADS_BASE, tenant.logoPath);
      await fs.unlink(oldAbs).catch(() => undefined);
    }

    await fs.writeFile(absolutePath, file.buffer);

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoPath: relativePath, logoMimeType: file.mimetype },
      select: { id: true, logoPath: true, logoMimeType: true },
    });
  }

  async getLogoForDownload(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { logoPath: true, logoMimeType: true },
    });
    if (!tenant?.logoPath || !tenant.logoMimeType) {
      throw new NotFoundException('Logo not set for this tenant');
    }
    const absolutePath = path.join(UPLOADS_BASE, tenant.logoPath);
    return { absolutePath, mimeType: tenant.logoMimeType };
  }

  async deleteLogo(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { logoPath: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (tenant.logoPath) {
      const abs = path.join(UPLOADS_BASE, tenant.logoPath);
      await fs.unlink(abs).catch(() => undefined);
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoPath: null, logoMimeType: null },
      select: { id: true },
    });
  }
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/webp':
      return '.webp';
    case 'image/svg+xml':
      return '.svg';
    case 'image/gif':
      return '.gif';
    default:
      return '';
  }
}
