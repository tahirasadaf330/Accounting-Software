import { IsOptional, IsString, Length, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExchangeRateFilterDto {
  @ApiPropertyOptional({ example: 'USD', description: 'Filter by base currency code' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  baseCurrency?: string;

  @ApiPropertyOptional({ example: 'EUR', description: 'Filter by target currency code' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  targetCurrency?: string;

  @ApiPropertyOptional({ example: '2025-01-15', description: 'Filter by effective date' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
