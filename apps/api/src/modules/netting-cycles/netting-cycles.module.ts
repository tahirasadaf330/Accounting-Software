import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { NettingCyclesController } from './netting-cycles.controller';
import { NettingReviewController } from './netting-review.controller';
import { NettingCyclesService } from './netting-cycles.service';

@Module({
  imports: [MailModule],
  controllers: [NettingCyclesController, NettingReviewController],
  providers: [NettingCyclesService],
  exports: [NettingCyclesService],
})
export class NettingCyclesModule {}
