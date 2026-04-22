import { Module } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';
import { JournalEntriesModule } from '../journal-entries/journal-entries.module';
import { PaymentAllocationsModule } from '../payment-allocations/payment-allocations.module';

@Module({
  imports: [JournalEntriesModule, PaymentAllocationsModule],
  controllers: [VouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
