import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateVoucherDto } from './create-voucher.dto';
import { AllocationLineDto } from '../../payment-allocations/dto/allocate-payment.dto';

export class CreateVoucherWithAllocationsDto {
  @ApiProperty({ type: CreateVoucherDto })
  @IsObject()
  @ValidateNested()
  @Type(() => CreateVoucherDto)
  voucher: CreateVoucherDto;

  @ApiProperty({ type: [AllocationLineDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one allocation is required' })
  @ValidateNested({ each: true })
  @Type(() => AllocationLineDto)
  allocations: AllocationLineDto[];
}
