import { Module } from '@nestjs/common';
import { PaymentAllocationsController } from './payment-allocations.controller';
import { PaymentAllocationsService } from './payment-allocations.service';

@Module({
  controllers: [PaymentAllocationsController],
  providers: [PaymentAllocationsService],
  exports: [PaymentAllocationsService],
})
export class PaymentAllocationsModule {}
