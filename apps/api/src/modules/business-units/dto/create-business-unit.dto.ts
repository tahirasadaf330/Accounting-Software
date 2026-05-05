import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessUnitDto {
  @ApiProperty({ example: 'Voice', description: 'Business unit name', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: true, description: 'Active status (default: true)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
