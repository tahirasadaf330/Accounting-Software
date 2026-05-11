import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { NettingCyclesController } from './netting-cycles.controller';
import { NettingReviewController } from './netting-review.controller';
import { NettingCyclesService } from './netting-cycles.service';

@Module({
  imports: [MailModule, VouchersModule],
  controllers: [NettingCyclesController, NettingReviewController],
  providers: [NettingCyclesService],
  exports: [NettingCyclesService],
})
export class NettingCyclesModule {}
