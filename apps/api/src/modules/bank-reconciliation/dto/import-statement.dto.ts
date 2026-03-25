import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StatementLineDto {
  @ApiProperty({ description: 'Transaction date', example: '2025-01-15' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Transaction description', example: 'Wire transfer from Client A' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Transaction reference', example: 'REF-001' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @ApiProperty({ description: 'Debit amount (money out)', example: '0' })
  @IsString()
  @IsNotEmpty()
  debit: string;

  @ApiProperty({ description: 'Credit amount (money in)', example: '5000.00' })
  @IsString()
  @IsNotEmpty()
  credit: string;

  @ApiProperty({ description: 'Running balance after this transaction', example: '15000.00' })
  @IsString()
  @IsNotEmpty()
  balance: string;
}

export class ImportStatementDto {
  @ApiProperty({ description: 'Statement date', example: '2025-01-31' })
  @IsDateString()
  @IsNotEmpty()
  statementDate: string;

  @ApiProperty({ description: 'Opening balance of the statement', example: '10000.00' })
  @IsString()
  @IsNotEmpty()
  openingBalance: string;

  @ApiProperty({ description: 'Closing balance of the statement', example: '15000.00' })
  @IsString()
  @IsNotEmpty()
  closingBalance: string;

  @ApiProperty({ description: 'Original file name', example: 'jan-2025-statement.csv' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileName: string;

  @ApiProperty({ description: 'Array of statement lines', type: [StatementLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatementLineDto)
  lines: StatementLineDto[];
}
