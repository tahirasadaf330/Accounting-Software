import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUUID,
  IsNumber,
  IsInt,
  IsEnum,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '@prisma/client';

export class CreateContactDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Contact name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ enum: ContactType, example: 'CUSTOMER', description: 'Contact type (default: CUSTOMER)' })
  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;

  @ApiPropertyOptional({ example: 'contact@acme.com', description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-0100', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'Street address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'New York', description: 'City' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'NY', description: 'State/Province' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: 'US', description: 'Country' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: '10001', description: 'Postal code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'US-EIN-123456789', description: 'Tax identification number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({ example: 50000, description: 'Credit limit' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ example: 30, description: 'Payment term in days' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  paymentTermDays?: number;

  @ApiPropertyOptional({ example: 'USD', description: 'Currency code' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Existing GL account ID to link' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'In-House manager IDs', type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  inHouseManagerIds?: string[];

  @ApiPropertyOptional({ description: 'Partner manager IDs', type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  partnerManagerIds?: string[];

  @ApiPropertyOptional({ example: true, description: 'Auto-create a trade account (default: true)' })
  @IsOptional()
  @IsBoolean()
  autoCreateAccount?: boolean;
}
