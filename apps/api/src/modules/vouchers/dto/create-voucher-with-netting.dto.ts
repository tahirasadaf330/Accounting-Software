import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateVoucherDto } from './create-voucher.dto';

export class NettingAllocationItemDto {
  @ApiProperty()
  @IsString()
  nettingCycleId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  paidAt: string;
}

export class CreateVoucherWithNettingDto {
  @ApiProperty({ type: CreateVoucherDto })
  @ValidateNested()
  @Type(() => CreateVoucherDto)
  voucher: CreateVoucherDto;

  @ApiProperty({ type: [NettingAllocationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NettingAllocationItemDto)
  nettingAllocations: NettingAllocationItemDto[];
}
