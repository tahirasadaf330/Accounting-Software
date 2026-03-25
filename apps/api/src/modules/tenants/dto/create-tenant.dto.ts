import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corporation', description: 'Tenant organization name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'acme-corp', description: 'URL-friendly unique slug' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'USD', description: 'Base currency code (ISO 4217)' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  baseCurrency?: string;

  @ApiPropertyOptional({ example: 1, description: 'Fiscal year start month (1-12)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStartMonth?: number;

  @ApiPropertyOptional({ example: 'America/New_York', description: 'Timezone identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional({ example: 'en-US', description: 'Locale identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;
}
