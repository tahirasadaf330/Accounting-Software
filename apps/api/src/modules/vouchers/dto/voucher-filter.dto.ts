import { IsOptional, IsEnum, IsDateString, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VoucherType, VoucherStatus } from '@prisma/client';

export class VoucherFilterDto {
  @ApiPropertyOptional({ enum: VoucherType })
  @IsOptional()
  @IsEnum(VoucherType)
  type?: VoucherType;

  @ApiPropertyOptional({ enum: VoucherStatus })
  @IsOptional()
  @IsEnum(VoucherStatus)
  status?: VoucherStatus;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-01-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description:
      'Search across voucher number, narration, reference, currency, voucher type, status, total amount, date (YYYY-MM-DD), contact name, and creator name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'createdAt', enum: ['date', 'voucherNumber', 'totalAmount', 'createdAt'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
