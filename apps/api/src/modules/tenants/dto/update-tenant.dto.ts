import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Acme Corp Ltd', description: 'Updated organization name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'EUR', description: 'Base currency code (ISO 4217)' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  baseCurrency?: string;

  @ApiPropertyOptional({ example: 7, description: 'Fiscal year start month (1-12)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStartMonth?: number;

  @ApiPropertyOptional({ example: 'Europe/London', description: 'Timezone identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional({ example: 'en-GB', description: 'Locale identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;
}
