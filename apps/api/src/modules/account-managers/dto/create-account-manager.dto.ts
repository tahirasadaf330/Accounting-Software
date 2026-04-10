import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ManagerType } from '@prisma/client';

export class CreateAccountManagerDto {
  @ApiProperty({ example: 'John Smith', description: 'Account manager name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Account manager email', maxLength: 255 })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ enum: ManagerType, example: 'IN_HOUSE', description: 'Manager type (default: IN_HOUSE)' })
  @IsOptional()
  @IsEnum(ManagerType)
  managerType?: ManagerType;

  @ApiPropertyOptional({ example: true, description: 'Active status (default: true)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
