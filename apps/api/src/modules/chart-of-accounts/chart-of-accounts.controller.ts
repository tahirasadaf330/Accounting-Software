import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountFilterDto } from './dto/account-filter.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('accounts')
@ApiBearerAuth()
@Controller('accounts')
export class ChartOfAccountsController {
  constructor(
    private readonly chartOfAccountsService: ChartOfAccountsService,
  ) {}

  @Post()
  @Roles(Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Account code already exists' })
  create(@TenantId() tenantId: string, @Body() dto: CreateAccountDto) {
    return this.chartOfAccountsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List accounts with optional filters' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  findAll(@TenantId() tenantId: string, @Query() filters: AccountFilterDto) {
    return this.chartOfAccountsService.findAll(tenantId, filters);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get full account hierarchy tree' })
  @ApiResponse({ status: 200, description: 'Account tree structure' })
  findTree(@TenantId() tenantId: string) {
    return this.chartOfAccountsService.findTree(tenantId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List available chart of accounts templates' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  getTemplates() {
    return this.chartOfAccountsService.getTemplates();
  }

  @Post('templates/:templateId/apply')
  @Roles(Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a chart of accounts template to the tenant' })
  @ApiParam({ name: 'templateId', description: 'Template ID', type: String })
  @ApiResponse({ status: 200, description: 'Template applied successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  applyTemplate(
    @TenantId() tenantId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ) {
    return this.chartOfAccountsService.applyTemplate(tenantId, templateId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single account by ID' })
  @ApiParam({ name: 'id', description: 'Account ID', type: String })
  @ApiResponse({ status: 200, description: 'Account details' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chartOfAccountsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING)
  @ApiOperation({ summary: 'Update an account (cannot change code or type)' })
  @ApiParam({ name: 'id', description: 'Account ID', type: String })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or system account' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.chartOfAccountsService.update(tenantId, id, dto);
  }

  @Post(':id/deactivate')
  @Roles(Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate an account' })
  @ApiParam({ name: 'id', description: 'Account ID', type: String })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 400, description: 'Account has active children or posted transactions' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  deactivate(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chartOfAccountsService.deactivate(tenantId, id);
  }

  @Post(':id/activate')
  @Roles(Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a previously deactivated account' })
  @ApiParam({ name: 'id', description: 'Account ID', type: String })
  @ApiResponse({ status: 200, description: 'Account activated successfully' })
  @ApiResponse({ status: 400, description: 'Parent account is inactive' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  activate(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chartOfAccountsService.activate(tenantId, id);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete an account' })
  @ApiParam({ name: 'id', description: 'Account ID', type: String })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 400, description: 'Account has children, transactions, or is a system account' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async delete(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.chartOfAccountsService.delete(tenantId, id);
  }
}
