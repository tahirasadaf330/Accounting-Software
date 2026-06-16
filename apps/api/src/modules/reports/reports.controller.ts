import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TrialBalanceService } from './trial-balance.service';
import { BalanceSheetService } from './balance-sheet.service';
import { IncomeStatementService } from './income-statement.service';
import { StatementOfAccountService } from './statement-of-account.service';
import { InvoiceReportService } from './invoice-report.service';
import { ARReportService } from './ar-report.service';
import { APReportService } from './ap-report.service';
import { TrialBalanceQueryDto } from './dto/trial-balance-query.dto';
import { ReportDateRangeDto } from './dto/report-date-range.dto';
import { InvoiceReportQueryDto } from './dto/invoice-report-query.dto';
import { ARAPReportQueryDto } from './dto/ar-ap-report-query.dto';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@Roles(Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING, Role.SENIOR_OFFICE_PAYMENTS, Role.SENIOR_ARAP_OFFICER, Role.PAYMENT_OFFICER)
export class ReportsController {
  constructor(
    private readonly trialBalanceService: TrialBalanceService,
    private readonly balanceSheetService: BalanceSheetService,
    private readonly incomeStatementService: IncomeStatementService,
    private readonly statementOfAccountService: StatementOfAccountService,
    private readonly invoiceReportService: InvoiceReportService,
    private readonly arReportService: ARReportService,
    private readonly apReportService: APReportService,
  ) {}

  @Get('trial-balance')
  @ApiOperation({ summary: 'Generate trial balance report' })
  @ApiResponse({
    status: 200,
    description: 'Trial balance generated successfully',
  })
  async getTrialBalance(
    @TenantId() tenantId: string,
    @Query() query: TrialBalanceQueryDto,
  ) {
    return this.trialBalanceService.generate(
      tenantId,
      query.asOfDate,
      query.fiscalYearId,
    );
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Generate balance sheet report' })
  @ApiResponse({
    status: 200,
    description: 'Balance sheet generated successfully',
  })
  async getBalanceSheet(
    @TenantId() tenantId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.balanceSheetService.generate(tenantId, asOfDate);
  }

  @Get('income-statement')
  @ApiOperation({ summary: 'Generate income statement (profit & loss) report' })
  @ApiResponse({
    status: 200,
    description: 'Income statement generated successfully',
  })
  async getIncomeStatement(
    @TenantId() tenantId: string,
    @Query() query: ReportDateRangeDto,
  ) {
    return this.incomeStatementService.generate(
      tenantId,
      query.fromDate,
      query.toDate,
    );
  }

  @Get('statement-of-account/:accountId')
  @ApiOperation({ summary: 'Generate statement of account (account ledger)' })
  @ApiResponse({
    status: 200,
    description: 'Statement of account generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getStatementOfAccount(
    @TenantId() tenantId: string,
    @Param('accountId') accountId: string,
    @Query() query: ReportDateRangeDto,
  ) {
    return this.statementOfAccountService.generate(
      tenantId,
      accountId,
      query.fromDate,
      query.toDate,
    );
  }

  @Get('invoices')
  @Roles(Role.OWNER, Role.ASSISTANT_MANAGER_BILLING, Role.SENIOR_OFFICE_PAYMENTS, Role.SENIOR_ARAP_OFFICER, Role.PAYMENT_OFFICER)
  @ApiOperation({ summary: 'Generate invoice report (sales & purchase)' })
  @ApiResponse({ status: 200, description: 'Invoice report generated successfully' })
  async getInvoiceReport(
    @TenantId() tenantId: string,
    @Query() query: InvoiceReportQueryDto,
  ) {
    return this.invoiceReportService.generate(tenantId, query);
  }

  @Get('ar')
  @ApiOperation({ summary: 'Generate Accounts Receivable (AR) aging report' })
  @ApiResponse({ status: 200, description: 'AR report generated successfully' })
  async getARReport(
    @TenantId() tenantId: string,
    @Query() query: ARAPReportQueryDto,
  ) {
    return this.arReportService.generate(tenantId, query);
  }

  @Get('ap')
  @ApiOperation({ summary: 'Generate Accounts Payable (AP) aging report' })
  @ApiResponse({ status: 200, description: 'AP report generated successfully' })
  async getAPReport(
    @TenantId() tenantId: string,
    @Query() query: ARAPReportQueryDto,
  ) {
    return this.apReportService.generate(tenantId, query);
  }
}
