import { IsUUID, IsNumber, IsDateString, IsArray, ValidateNested, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AllocationLineDto {
  @ApiProperty({ description: 'Invoice voucher ID' })
  @IsUUID()
  @IsNotEmpty()
  invoiceVoucherId: string;

  @ApiProperty({ example: 5000, description: 'Amount to allocate' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  amount: number;

  @ApiProperty({ example: '2026-04-05T14:30:00Z', description: 'Date/time of payment' })
  @IsDateString()
  paidAt: string;
}

export class AllocatePaymentDto {
  @ApiProperty({ type: [AllocationLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllocationLineDto)
  allocations: AllocationLineDto[];
}
