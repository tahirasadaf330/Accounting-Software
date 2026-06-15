import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsInt,
  IsUUID,
  IsDateString,
  IsEnum,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, AccountClassification } from '@prisma/client';

export class UpdateContactDto {
  @ApiPropertyOptional({ example: 'Acme Corp', description: 'Contact name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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

  @ApiPropertyOptional({
    example: 1000,
    description:
      'Minimum transaction amount. Transactions below this amount will be blocked.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  minThreshold?: number;

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

  @ApiPropertyOptional({ example: 'Payment due within 30 days of invoice date.', description: 'Invoice terms text' })
  @IsOptional()
  @IsString()
  invoiceTerms?: string;

  @ApiPropertyOptional({ example: 'Acme Corp', description: 'Beneficiary name (account holder)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankBeneficiaryName?: string;

  @ApiPropertyOptional({ example: 'Chase Bank', description: 'Bank name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankName?: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'Bank account number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'GB29NWBK60161331926819', description: 'IBAN' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankIban?: string;

  @ApiPropertyOptional({ example: 'CHASUS33', description: 'Swift / Sort code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankSwiftCode?: string;

  @ApiPropertyOptional({ example: '021000021', description: 'Routing number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankRoutingNumber?: string;

  @ApiPropertyOptional({ example: '270 Park Ave, New York', description: 'Bank address' })
  @IsOptional()
  @IsString()
  bankAddress?: string;

  @ApiPropertyOptional({ enum: PaymentMethod, example: 'WIRE', description: 'Method of payment' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ enum: AccountClassification, example: 'PREPAYMENT', description: 'Account type: prepayment or post payment' })
  @IsOptional()
  @IsEnum(AccountClassification)
  accountClassification?: AccountClassification;

  @ApiPropertyOptional({ description: 'Business unit ID' })
  @IsOptional()
  @IsUUID()
  businessUnitId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Require Account Manager approval for this contact’s transactions',
  })
  @IsOptional()
  @IsBoolean()
  amApprovalRequired?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-04-01', description: 'Billing cycle start date' })
  @IsOptional()
  @IsDateString()
  billingStartDate?: string;

  @ApiPropertyOptional({ description: 'In-House manager IDs', type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  inHouseManagerIds?: string[];

  @ApiPropertyOptional({ description: 'Partner manager IDs', type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  partnerManagerIds?: string[];
}
