import { IsNotEmpty, IsString, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFiscalYearDto {
  @ApiProperty({ example: 'FY 2025', description: 'Name of the fiscal year' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '2025-01-01', description: 'Start date of the fiscal year (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2025-12-31', description: 'End date of the fiscal year (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
