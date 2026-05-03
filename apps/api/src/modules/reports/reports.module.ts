import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportsController } from './reports.controller';
import { TrialBalanceService } from './trial-balance.service';
import { StatementOfAccountService } from './statement-of-account.service';
import { BalanceSheetService } from './balance-sheet.service';
import { IncomeStatementService } from './income-statement.service';
import { InvoiceReportService } from './invoice-report.service';
import { ARReportService } from './ar-report.service';
import { APReportService } from './ap-report.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [
    TrialBalanceService,
    StatementOfAccountService,
    BalanceSheetService,
    IncomeStatementService,
    InvoiceReportService,
    ARReportService,
    APReportService,
  ],
  exports: [
    TrialBalanceService,
    StatementOfAccountService,
    BalanceSheetService,
    IncomeStatementService,
    InvoiceReportService,
    ARReportService,
    APReportService,
  ],
})
export class ReportsModule {}
