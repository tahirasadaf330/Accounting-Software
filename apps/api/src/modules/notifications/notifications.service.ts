import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';

interface CreateNotificationData {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateNotificationData) {
    return this.prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        referenceId: data.referenceId || null,
        referenceType: data.referenceType || null,
      },
    });
  }

  async createMany(notifications: CreateNotificationData[]) {
    return this.prisma.notification.createMany({
      data: notifications.map((n) => ({
        tenantId: n.tenantId,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        referenceId: n.referenceId || null,
        referenceType: n.referenceType || null,
      })),
    });
  }

  async getForUser(
    tenantId: string,
    userId: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { tenantId, userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { tenantId, userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications,
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

  async getUnreadCount(tenantId: string, userId: string) {
    return this.prisma.notification.count({
      where: { tenantId, userId, isRead: false },
    });
  }

  async markAsRead(tenantId: string, userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, tenantId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { tenantId, userId, isRead: false },
      data: { isRead: true },
    });
  }

  async findUsersByRoles(tenantId: string, roles: string[]) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role: { in: roles as any },
        status: 'ACTIVE',
      },
      select: { id: true },
    });
  }
}
