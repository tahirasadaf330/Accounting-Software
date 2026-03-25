import { IsNotEmpty, IsString, Length, IsNumberString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetExchangeRateDto {
  @ApiProperty({ example: 'USD', description: 'Base currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  baseCurrency: string;

  @ApiProperty({ example: 'EUR', description: 'Target currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  targetCurrency: string;

  @ApiProperty({ example: '0.92150000', description: 'Exchange rate (up to 18 digits, 8 decimal places)' })
  @IsNumberString()
  @IsNotEmpty()
  rate: string;

  @ApiProperty({ example: '2025-01-15', description: 'Effective date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  effectiveDate: string;
}
