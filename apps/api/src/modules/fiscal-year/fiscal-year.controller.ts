import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { FiscalYearService } from './fiscal-year.service';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@accounting-saas/shared';

@ApiTags('fiscal-years')
@ApiBearerAuth()
@Controller('fiscal-years')
export class FiscalYearController {
  constructor(private readonly fiscalYearService: FiscalYearService) {}

  @Post()
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Create a new fiscal year with auto-generated monthly periods' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateFiscalYearDto,
  ) {
    return this.fiscalYearService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all fiscal years for the tenant' })
  async findAll(@TenantId() tenantId: string) {
    return this.fiscalYearService.findAll(tenantId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get the current fiscal year (containing today\'s date)' })
  async getCurrent(@TenantId() tenantId: string) {
    return this.fiscalYearService.getCurrentFiscalYear(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a fiscal year by ID with its periods' })
  @ApiParam({ name: 'id', description: 'Fiscal year UUID' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.fiscalYearService.findOne(tenantId, id);
  }

  @Post('periods/:periodId/close')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Close a fiscal period (prevents posting to it)' })
  @ApiParam({ name: 'periodId', description: 'Fiscal period UUID' })
  async closePeriod(
    @TenantId() tenantId: string,
    @Param('periodId') periodId: string,
  ) {
    return this.fiscalYearService.closePeriod(tenantId, periodId);
  }

  @Post('periods/:periodId/reopen')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Reopen a closed fiscal period (OWNER only)' })
  @ApiParam({ name: 'periodId', description: 'Fiscal period UUID' })
  async reopenPeriod(
    @TenantId() tenantId: string,
    @Param('periodId') periodId: string,
  ) {
    return this.fiscalYearService.reopenPeriod(tenantId, periodId);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Close a fiscal year (all periods must be closed first)' })
  @ApiParam({ name: 'id', description: 'Fiscal year UUID' })
  async closeYear(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.fiscalYearService.closeYear(tenantId, id);
  }
}
