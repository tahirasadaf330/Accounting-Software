import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, NormalBalance } from '@prisma/client';

export class CreateAccountDto {
  @ApiProperty({ example: '1010', description: 'Unique account code within tenant', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Cash in Hand', description: 'Account name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: AccountType, example: AccountType.ASSET, description: 'Type of the account' })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiPropertyOptional({ example: 'uuid-of-parent', description: 'Parent account ID for sub-accounts' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ example: 1, description: 'Account hierarchy level (1-4)', minimum: 1, maximum: 4 })
  @IsInt()
  @Min(1)
  @Max(4)
  level: number;

  @ApiProperty({ enum: NormalBalance, example: NormalBalance.DEBIT, description: 'Normal balance side' })
  @IsEnum(NormalBalance)
  normalBalance: NormalBalance;

  @ApiPropertyOptional({ example: false, description: 'Whether this is a system-protected account' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({ example: 'Petty cash and cash on hand', description: 'Account description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
