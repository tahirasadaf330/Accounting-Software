import {
  IsOptional,
  IsString,
  IsEmail,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantProfileDto {
  @ApiPropertyOptional({ example: 'Acme Corp Ltd', description: 'Organization name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Suite 100', description: 'Street address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'New York', description: 'City' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'NY', description: 'State or province' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '10001', description: 'Postal / ZIP code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'United States', description: 'Country' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: '+1-555-123-4567', description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'info@acmecorp.com', description: 'Company email' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'https://acmecorp.com', description: 'Website URL' })
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Website must be a valid URL (e.g. https://example.com)' })
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ example: '12-3456789', description: 'Tax identification number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxId?: string;

  @ApiPropertyOptional({ example: 'REG-2024-001', description: 'Company registration number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;
}
