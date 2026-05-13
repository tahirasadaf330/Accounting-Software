import { Module } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { VoucherImportService } from './voucher-import.service';
import { PaymentVoucherImportService } from './payment-voucher-import.service';
import { VouchersController } from './vouchers.controller';
import { JournalEntriesModule } from '../journal-entries/journal-entries.module';
import { PaymentAllocationsModule } from '../payment-allocations/payment-allocations.module';

@Module({
  imports: [JournalEntriesModule, PaymentAllocationsModule],
  controllers: [VouchersController],
  providers: [VouchersService, VoucherImportService, PaymentVoucherImportService],
  exports: [VouchersService],
})
export class VouchersModule {}
