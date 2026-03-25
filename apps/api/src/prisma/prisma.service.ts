import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Set the current tenant for Row-Level Security.
   * Must be called before any tenant-scoped query.
   */
  async setTenantContext(tenantId: string) {
    await this.$executeRawUnsafe(`SET app.current_tenant = '${tenantId}'`);
  }

  /**
   * Clear tenant context (for super admin operations).
   */
  async clearTenantContext() {
    await this.$executeRawUnsafe(`RESET app.current_tenant`);
  }
}
