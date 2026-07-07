import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { ChartOfAccountsModule } from './modules/chart-of-accounts/chart-of-accounts.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { JournalEntriesModule } from './modules/journal-entries/journal-entries.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { BankReconciliationModule } from './modules/bank-reconciliation/bank-reconciliation.module';
import { ReportsModule } from './modules/reports/reports.module';
import { FiscalYearModule } from './modules/fiscal-year/fiscal-year.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MailModule } from './modules/mail/mail.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { AccountManagersModule } from './modules/account-managers/account-managers.module';
import { BusinessUnitsModule } from './modules/business-units/business-units.module';
import { PaymentAllocationsModule } from './modules/payment-allocations/payment-allocations.module';
import { NettingCyclesModule } from './modules/netting-cycles/netting-cycles.module';
import { ExternalDbModule } from './modules/external-db/external-db.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    EventEmitterModule.forRoot(),
    MailModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    ChartOfAccountsModule,
    VouchersModule,
    JournalEntriesModule,
    CurrenciesModule,
    BankReconciliationModule,
    ReportsModule,
    FiscalYearModule,
    NotificationsModule,
    ContactsModule,
    AccountManagersModule,
    BusinessUnitsModule,
    PaymentAllocationsModule,
    NettingCyclesModule,
    ExternalDbModule,
  ],
})
export class AppModule {}
