import { IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TrialBalanceQueryDto {
  @ApiPropertyOptional({
    description: 'Trial balance as of this date (inclusive). Defaults to today.',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by fiscal year ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID()
  fiscalYearId?: string;
}
