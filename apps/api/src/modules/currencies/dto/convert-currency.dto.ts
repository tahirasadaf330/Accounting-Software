import { IsNotEmpty, IsString, Length, IsNumberString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConvertCurrencyDto {
  @ApiProperty({ example: '1000.00', description: 'Amount to convert' })
  @IsNumberString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ example: 'USD', description: 'Source currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  fromCurrency: string;

  @ApiProperty({ example: 'EUR', description: 'Target currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  toCurrency: string;

  @ApiPropertyOptional({ example: '2025-01-15', description: 'Date for exchange rate lookup (defaults to latest)' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
