import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportDateRangeDto {
  @ApiPropertyOptional({
    description: 'Start date of the reporting period (inclusive). Defaults to start of current fiscal year.',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'End date of the reporting period (inclusive). Defaults to today.',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
