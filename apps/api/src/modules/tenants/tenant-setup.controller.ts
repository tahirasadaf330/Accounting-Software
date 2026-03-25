import {
  Controller,
  Post,
  Body,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role, TenantStatus } from '@prisma/client';
import { TenantsService } from './tenants.service';
import { SetupTenantDto } from './dto/setup-tenant.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('tenant-setup')
@ApiBearerAuth()
@Controller('tenant/setup')
export class TenantSetupController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Complete tenant setup wizard (Owner only, PENDING_SETUP status)' })
  async setup(
    @TenantId() tenantId: string,
    @CurrentUser('role') role: string,
    @Body() dto: SetupTenantDto,
  ) {
    if (role !== Role.OWNER) {
      throw new ForbiddenException('Only the organization owner can complete setup');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.status !== TenantStatus.PENDING_SETUP) {
      throw new BadRequestException('Tenant is not in PENDING_SETUP state');
    }

    return this.tenantsService.setupTenant(tenantId, dto);
  }
}
