import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsDateString,
  MaxLength,
  IsNumberString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VoucherType } from '@prisma/client';

export class VoucherLineItemDto {
  @ApiProperty({ example: 'uuid-of-account' })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ example: '1000.00', description: 'Debit amount' })
  @IsNumberString()
  debit: string;

  @ApiProperty({ example: '0.00', description: 'Credit amount' })
  @IsNumberString()
  credit: string;

  @ApiPropertyOptional({ example: 'Office supplies purchase' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  narration?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({ example: '1.00000000' })
  @IsOptional()
  @IsNumberString()
  exchangeRate?: string;

  @ApiPropertyOptional({ example: 'MARKETING' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  costCenter?: string;
}

export class CreateVoucherDto {
  @ApiProperty({ enum: VoucherType, example: VoucherType.JOURNAL })
  @IsEnum(VoucherType)
  voucherType: VoucherType;

  @ApiProperty({ example: '2026-01-15', description: 'Voucher date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Monthly rent payment' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  narration: string;

  @ApiPropertyOptional({ example: 'INV-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({ example: '1.00000000', default: '1' })
  @IsOptional()
  @IsNumberString()
  exchangeRate?: string;

  @ApiPropertyOptional({ description: 'Customer/Contact ID to link this voucher to' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ example: '2026-03-01', description: 'Period start date' })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({ example: '2026-03-31', description: 'Period end date' })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiProperty({ type: [VoucherLineItemDto], minItems: 2 })
  @IsArray()
  @ArrayMinSize(2, { message: 'A voucher must have at least 2 line items (double-entry)' })
  @ValidateNested({ each: true })
  @Type(() => VoucherLineItemDto)
  lineItems: VoucherLineItemDto[];
}
