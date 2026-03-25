import { Module } from '@nestjs/common';
import { FiscalYearService } from './fiscal-year.service';
import { FiscalYearController } from './fiscal-year.controller';

@Module({
  controllers: [FiscalYearController],
  providers: [FiscalYearService],
  exports: [FiscalYearService],
})
export class FiscalYearModule {}
