import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'jane@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'User password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'Jane', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Smith', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    enum: [Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT],
    example: Role.ACCOUNTANT,
    description: 'User role within the tenant',
  })
  @IsEnum(Role, {
    message: `Role must be one of: ${Role.OWNER}, ${Role.CHIEF_ACCOUNTANT}, ${Role.ACCOUNTANT}`,
  })
  role: Role;
}
