import { IsOptional, IsDateString, IsUUID, IsBooleanString } from 'class-validator';
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
  @IsBooleanString()
  @Transform(({ value }) => value === 'true' || value === true)
  showOutstandingOnly?: boolean;
}
