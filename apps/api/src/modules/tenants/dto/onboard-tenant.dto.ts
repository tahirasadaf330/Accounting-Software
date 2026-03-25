import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardTenantDto {
  @ApiProperty({ example: 'USD', description: 'Base currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  baseCurrency: string;

  @ApiProperty({ example: 1, description: 'Fiscal year start month (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStartMonth: number;

  @ApiPropertyOptional({ example: 'America/New_York', description: 'Timezone' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional({ example: 'en-US', description: 'Locale' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Account template ID to use for default Chart of Accounts',
  })
  @IsUUID()
  @IsNotEmpty()
  coaTemplateId: string;
}
