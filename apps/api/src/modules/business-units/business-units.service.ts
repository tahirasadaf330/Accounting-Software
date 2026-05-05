import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessUnitDto } from './dto/create-business-unit.dto';
import { UpdateBusinessUnitDto } from './dto/update-business-unit.dto';

@Injectable()
export class BusinessUnitsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateBusinessUnitDto) {
    const name = dto.name.trim();
    const existing = await this.prisma.businessUnit.findUnique({
      where: { tenantId_name: { tenantId, name } },
    });
    if (existing) {
      throw new ConflictException('A business unit with this name already exists');
    }

    const bu = await this.prisma.businessUnit.create({
      data: {
        tenantId,
        name,
        isActive: dto.isActive ?? true,
      },
    });

    return this.formatResponse(bu);
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
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (page !== undefined || limit !== undefined) {
      const safePage = Math.max(1, Number(page ?? 1) || 1);
      const safeLimit = Math.min(100, Math.max(1, Number(limit ?? 25) || 25));
      const skip = (safePage - 1) * safeLimit;

      const [items, total] = await this.prisma.$transaction([
        this.prisma.businessUnit.findMany({
          where,
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip,
          take: safeLimit,
        }),
        this.prisma.businessUnit.count({ where }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / safeLimit));

      return {
        data: items.map(this.formatResponse),
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

    const items = await this.prisma.businessUnit.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return items.map(this.formatResponse);
  }

  async findOne(tenantId: string, id: string) {
    const bu = await this.prisma.businessUnit.findFirst({
      where: { id, tenantId },
    });
    if (!bu) {
      throw new NotFoundException('Business unit not found');
    }
    return this.formatResponse(bu);
  }

  async update(tenantId: string, id: string, dto: UpdateBusinessUnitDto) {
    const bu = await this.prisma.businessUnit.findFirst({
      where: { id, tenantId },
    });
    if (!bu) {
      throw new NotFoundException('Business unit not found');
    }

    if (dto.name && dto.name.trim() !== bu.name) {
      const existing = await this.prisma.businessUnit.findUnique({
        where: { tenantId_name: { tenantId, name: dto.name.trim() } },
      });
      if (existing) {
        throw new ConflictException('A business unit with this name already exists');
      }
    }

    const updated = await this.prisma.businessUnit.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        isActive: dto.isActive,
      },
    });

    return this.formatResponse(updated);
  }

  async delete(tenantId: string, id: string) {
    const bu = await this.prisma.businessUnit.findFirst({
      where: { id, tenantId },
    });
    if (!bu) {
      throw new NotFoundException('Business unit not found');
    }

    const contactCount = await this.prisma.contact.count({
      where: { tenantId, businessUnitId: id },
    });
    if (contactCount > 0) {
      throw new BadRequestException(
        `Cannot delete business unit with ${contactCount} assigned contact(s). Reassign or deactivate them first.`,
      );
    }

    await this.prisma.businessUnit.delete({ where: { id } });
  }

  private formatResponse(bu: any) {
    return {
      id: bu.id,
      name: bu.name,
      isActive: bu.isActive,
      createdAt: bu.createdAt,
    };
  }
}
