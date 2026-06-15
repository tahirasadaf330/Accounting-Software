import { IsString, IsOptional, IsDateString, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNettingCycleDto {
  @ApiProperty({ description: 'Contact ID' })
  @IsUUID()
  contactId: string;

  @ApiPropertyOptional({ example: '2026-04-01', description: 'Cycle start date (optional; defaults to beginning of time when omitted)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-04-07', description: 'Cycle end date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Invoice voucher IDs to include', type: [String] })
  @IsUUID('4', { each: true })
  invoiceIds: string[];
}

export class AddCommentDto {
  @ApiProperty({ example: 'Please review this netting', description: 'Comment message' })
  @IsString()
  message: string;
}

export class RejectDto {
  @ApiPropertyOptional({ example: 'Amounts do not match', description: 'Rejection reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}
