import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartReconciliationDto {
  @ApiProperty({ description: 'Bank account ID to reconcile', example: 'uuid-of-bank-account' })
  @IsUUID()
  @IsNotEmpty()
  bankAccountId: string;

  @ApiProperty({ description: 'Start of reconciliation period', example: '2025-01-01' })
  @IsDateString()
  @IsNotEmpty()
  periodStart: string;

  @ApiProperty({ description: 'End of reconciliation period', example: '2025-01-31' })
  @IsDateString()
  @IsNotEmpty()
  periodEnd: string;

  @ApiPropertyOptional({ description: 'Notes for this reconciliation', example: 'January 2025 bank reconciliation' })
  @IsOptional()
  @IsString()
  notes?: string;
}
