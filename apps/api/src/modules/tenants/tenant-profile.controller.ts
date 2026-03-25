import {
  Controller,
  Get,
  Patch,
  Body,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TenantsService } from './tenants.service';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('tenant-profile')
@ApiBearerAuth()
@Controller('tenant/profile')
export class TenantProfileController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current tenant company profile' })
  async getProfile(@TenantId() tenantId: string) {
    return this.tenantsService.getProfile(tenantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update tenant company profile (Owner only)' })
  async updateProfile(
    @TenantId() tenantId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateTenantProfileDto,
  ) {
    if (role !== Role.OWNER) {
      throw new ForbiddenException('Only the organization owner can update the company profile');
    }
    return this.tenantsService.updateProfile(tenantId, dto);
  }
}
