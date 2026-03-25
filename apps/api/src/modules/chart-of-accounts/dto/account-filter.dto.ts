import { IsOptional, IsEnum, IsInt, IsBoolean, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class AccountFilterDto {
  @ApiPropertyOptional({ enum: AccountType, description: 'Filter by account type' })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @ApiPropertyOptional({ description: 'Filter by hierarchy level (1-4)', minimum: 1, maximum: 4 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(4)
  level?: number;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by account code or name' })
  @IsOptional()
  @IsString()
  search?: string;
}
