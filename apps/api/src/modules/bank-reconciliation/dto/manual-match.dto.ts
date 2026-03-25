import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualMatchDto {
  @ApiProperty({ description: 'Bank statement line ID to match', example: 'uuid-of-bank-statement-line' })
  @IsUUID()
  @IsNotEmpty()
  bankStatementLineId: string;

  @ApiProperty({ description: 'Journal entry line ID to match against', example: 'uuid-of-journal-entry-line' })
  @IsUUID()
  @IsNotEmpty()
  journalEntryLineId: string;
}
