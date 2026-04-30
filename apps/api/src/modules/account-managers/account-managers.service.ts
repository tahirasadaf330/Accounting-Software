import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountManagerDto } from './dto/create-account-manager.dto';
import { UpdateAccountManagerDto } from './dto/update-account-manager.dto';

@Injectable()
export class AccountManagersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateAccountManagerDto) {
    const existing = await this.prisma.accountManager.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });
    if (existing) {
      throw new ConflictException('An account manager with this email already exists');
    }

    const am = await this.prisma.accountManager.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        managerType: dto.managerType ?? 'IN_HOUSE',
        isActive: dto.isActive ?? true,
      },
    });

    return this.formatResponse(am);
  }

  async findAll(
    tenantId: string,
    search?: string,
    isActive?: string,
    page?: number,
    limit?: number,
  ) {
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Paginated mode: only when caller explicitly supplied page/limit so the
    // existing array-shaped contract used by dropdowns keeps working.
    if (page !== undefined || limit !== undefined) {
      const safePage = Math.max(1, Number(page ?? 1) || 1);
      const safeLimit = Math.min(100, Math.max(1, Number(limit ?? 25) || 25));
      const skip = (safePage - 1) * safeLimit;

      const [accountManagers, total] = await this.prisma.$transaction([
        this.prisma.accountManager.findMany({
          where,
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip,
          take: safeLimit,
        }),
        this.prisma.accountManager.count({ where }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / safeLimit));

      return {
        data: accountManagers.map(this.formatResponse),
        meta: {
          total,
          page: safePage,
          limit: safeLimit,
          totalPages,
          hasNextPage: safePage < totalPages,
          hasPreviousPage: safePage > 1,
        },
      };
    }

    const accountManagers = await this.prisma.accountManager.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return accountManagers.map(this.formatResponse);
  }

  async findOne(tenantId: string, id: string) {
    const am = await this.prisma.accountManager.findFirst({
      where: { id, tenantId },
    });
    if (!am) {
      throw new NotFoundException('Account manager not found');
    }
    return this.formatResponse(am);
  }

  async update(tenantId: string, id: string, dto: UpdateAccountManagerDto) {
    const am = await this.prisma.accountManager.findFirst({
      where: { id, tenantId },
    });
    if (!am) {
      throw new NotFoundException('Account manager not found');
    }

    if (dto.email && dto.email !== am.email) {
      const existing = await this.prisma.accountManager.findUnique({
        where: { tenantId_email: { tenantId, email: dto.email } },
      });
      if (existing) {
        throw new ConflictException('An account manager with this email already exists');
      }
    }

    const updated = await this.prisma.accountManager.update({
      where: { id },
      data: dto,
    });

    return this.formatResponse(updated);
  }

  async delete(tenantId: string, id: string) {
    const am = await this.prisma.accountManager.findFirst({
      where: { id, tenantId },
    });
    if (!am) {
      throw new NotFoundException('Account manager not found');
    }

    const contactCount = await this.prisma.contactAccountManager.count({
      where: { accountManagerId: id },
    });
    if (contactCount > 0) {
      throw new BadRequestException(
        'Cannot delete account manager with assigned contacts. Unassign or reassign contacts first.',
      );
    }

    await this.prisma.accountManager.delete({ where: { id } });
  }

  private formatResponse(am: any) {
    return {
      id: am.id,
      name: am.name,
      email: am.email,
      managerType: am.managerType,
      isActive: am.isActive,
      createdAt: am.createdAt,
    };
  }
}
