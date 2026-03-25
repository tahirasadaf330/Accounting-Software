import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectVoucherDto {
  @ApiProperty({ example: 'Incorrect account allocation for line item 2' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
