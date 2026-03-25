import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { OnboardTenantDto } from './dto/onboard-tenant.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { PAGINATION_DEFAULTS } from '@accounting-saas/shared';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('admin/tenants')
@Roles(Role.SUPER_ADMIN)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 25 })
  async findAll(
    @Query('page', new DefaultValuePipe(PAGINATION_DEFAULTS.page), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(PAGINATION_DEFAULTS.limit), ParseIntPipe) limit: number,
  ) {
    return this.tenantsService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, dto);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a tenant' })
  async suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.suspend(id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a tenant' })
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.activate(id);
  }

  @Post(':id/onboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete tenant onboarding setup' })
  async onboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OnboardTenantDto,
  ) {
    return this.tenantsService.onboard(id, dto);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get tenant statistics' })
  async getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.getStats(id);
  }
}
