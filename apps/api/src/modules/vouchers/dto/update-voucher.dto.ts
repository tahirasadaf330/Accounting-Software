import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsDateString,
  MaxLength,
  IsNumberString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VoucherLineItemDto } from './create-voucher.dto';

export class UpdateVoucherDto {
  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Updated narration' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  narration?: string;

  @ApiPropertyOptional({ example: 'INV-2026-002' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({ example: '1.00000000' })
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

  @ApiPropertyOptional({ type: [VoucherLineItemDto], minItems: 2 })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2, { message: 'A voucher must have at least 2 line items (double-entry)' })
  @ValidateNested({ each: true })
  @Type(() => VoucherLineItemDto)
  lineItems?: VoucherLineItemDto[];
}
