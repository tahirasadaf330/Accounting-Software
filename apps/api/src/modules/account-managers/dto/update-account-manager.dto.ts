import { IsString, IsOptional, IsBoolean, IsEmail, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ManagerType } from '@prisma/client';

export class UpdateAccountManagerDto {
  @ApiPropertyOptional({ example: 'John Smith', description: 'Account manager name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Account manager email', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ enum: ManagerType, example: 'IN_HOUSE', description: 'Manager type' })
  @IsOptional()
  @IsEnum(ManagerType)
  managerType?: ManagerType;

  @ApiPropertyOptional({ example: true, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
