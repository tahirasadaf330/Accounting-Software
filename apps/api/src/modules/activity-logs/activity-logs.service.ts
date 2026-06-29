import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LogActivityParams {
  tenantId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async log(params: LogActivityParams) {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: params.tenantId ?? null,
          userId: params.userId ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          newValue: params.description ? { description: params.description } : undefined,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        },
      });
    } catch {
      // never let logging break the main flow
    }
  }

  async findAll(
    tenantId: string,
    filters: {
      entityType?: string;
      userId?: string;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { entityType, userId, from, to, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
