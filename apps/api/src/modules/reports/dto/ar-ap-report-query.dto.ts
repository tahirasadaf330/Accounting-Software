import { IsOptional, IsDateString, IsUUID, IsBoolean, IsBooleanString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ARAPReportQueryDto {
  @ApiPropertyOptional({
    description: 'Report as of this date. Defaults to today.',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @ApiPropertyOptional({ description: 'Filter by specific contact (customer or vendor)' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({
    description: 'When true, only rows with outstanding balance > 0 are returned',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  showOutstandingOnly?: boolean;

  @ApiPropertyOptional({
    description: 'When false, shows gross view with all invoices individually. Defaults to true.',
    default: true,
  })
  @IsOptional()
  @IsBooleanString()
  @Transform(({ value }) => value === 'true' || value === true)
  includeNettingAdjustments?: boolean;
}
