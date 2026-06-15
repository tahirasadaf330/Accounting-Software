import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankAccountDto {
  @ApiProperty({ description: 'COA account ID to link this bank account to', example: 'uuid-of-coa-account' })
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @ApiPropertyOptional({ description: 'Account type: BANK or CRYPTO', example: 'BANK', default: 'BANK' })
  @IsOptional()
  @IsIn(['BANK', 'CRYPTO'])
  accountType?: string;

  @ApiProperty({ description: 'Name of the bank or exchange', example: 'First National Bank' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  bankName: string;

  @ApiProperty({ description: 'Bank account number or exchange account ID', example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountNumber: string;

  @ApiPropertyOptional({ description: 'Wallet address (for crypto accounts)', example: '0xAbc123...' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  walletAddress?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}
