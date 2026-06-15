import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BankReconciliationService } from './bank-reconciliation.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { ImportStatementDto } from './dto/import-statement.dto';
import { StartReconciliationDto } from './dto/start-reconciliation.dto';
import { ManualMatchDto } from './dto/manual-match.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('bank-reconciliation')
@ApiBearerAuth()
@Controller('bank-reconciliation')
export class BankReconciliationController {
  constructor(private readonly bankReconciliationService: BankReconciliationService) {}

  // ---------------------------------------------------------------------------
  // Bank Accounts
  // ---------------------------------------------------------------------------

  @Post('bank-accounts')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Create a bank account linked to a COA account' })
  async createBankAccount(
    @TenantId() tenantId: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.bankReconciliationService.createBankAccount(tenantId, dto);
  }

  @Get('bank-accounts')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'List all bank accounts for the tenant' })
  async findBankAccounts(@TenantId() tenantId: string) {
    return this.bankReconciliationService.findBankAccounts(tenantId);
  }

  @Patch('bank-accounts/:id')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Update a bank/crypto account' })
  async updateBankAccount(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.bankReconciliationService.updateBankAccount(tenantId, id, dto);
  }

  @Delete('bank-accounts/:id')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a bank/crypto account (only if no statements exist)' })
  async deleteBankAccount(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.bankReconciliationService.deleteBankAccount(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // Statements
  // ---------------------------------------------------------------------------

  @Post('bank-accounts/:bankAccountId/statements')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Import a bank statement with parsed lines' })
  async importStatement(
    @TenantId() tenantId: string,
    @Param('bankAccountId') bankAccountId: string,
    @Body() dto: ImportStatementDto,
  ) {
    return this.bankReconciliationService.importStatement(tenantId, bankAccountId, dto);
  }

  @Get('bank-accounts/:bankAccountId/statements')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'List statements for a bank account' })
  async getStatements(
    @TenantId() tenantId: string,
    @Param('bankAccountId') bankAccountId: string,
  ) {
    return this.bankReconciliationService.getStatements(tenantId, bankAccountId);
  }

  @Get('statements/:statementId/lines')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get lines for a bank statement' })
  async getStatementLines(
    @TenantId() tenantId: string,
    @Param('statementId') statementId: string,
  ) {
    return this.bankReconciliationService.getStatementLines(tenantId, statementId);
  }

  // ---------------------------------------------------------------------------
  // Reconciliations
  // ---------------------------------------------------------------------------

  @Post('reconciliations')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Start a new reconciliation for a period' })
  async startReconciliation(
    @TenantId() tenantId: string,
    @Body() dto: StartReconciliationDto,
  ) {
    return this.bankReconciliationService.startReconciliation(tenantId, dto);
  }

  @Get('reconciliations/:id')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get reconciliation details with matches and summary' })
  async getReconciliation(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.bankReconciliationService.getReconciliation(tenantId, id);
  }

  @Post('reconciliations/:id/auto-match')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Run auto-matching algorithm on a reconciliation' })
  async autoMatch(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.bankReconciliationService.autoMatch(tenantId, id);
  }

  @Post('reconciliations/:id/match')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Manually match a bank statement line to a journal entry line' })
  async manualMatch(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: ManualMatchDto,
  ) {
    return this.bankReconciliationService.manualMatch(tenantId, id, dto);
  }

  @Delete('reconciliations/:id/matches/:matchId')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Remove a match from a reconciliation' })
  async unmatch(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('matchId') matchId: string,
  ) {
    return this.bankReconciliationService.unmatch(tenantId, id, matchId);
  }

  @Get('reconciliations/:id/unmatched')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get unmatched bank lines and journal entries' })
  async getUnmatchedItems(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.bankReconciliationService.getUnmatchedItems(tenantId, id);
  }

  @Post('reconciliations/:id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Mark a reconciliation as completed' })
  async completeReconciliation(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bankReconciliationService.completeReconciliation(tenantId, id, userId);
  }
}
