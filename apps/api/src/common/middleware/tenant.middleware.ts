import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@accounting-saas/shared';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: FastifyRequest['raw'] & { user?: any }, _res: FastifyReply['raw'], next: () => void) {
    const user = (req as any).user;

    if (!user) {
      return next();
    }

    // Super admin operates without tenant context
    if (user.role === Role.SUPER_ADMIN) {
      await this.prisma.clearTenantContext();
      return next();
    }

    if (!user.tenantId) {
      throw new ForbiddenException('No tenant associated with this user');
    }

    await this.prisma.setTenantContext(user.tenantId);
    next();
  }
}
