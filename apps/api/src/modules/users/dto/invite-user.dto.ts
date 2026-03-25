import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class InviteUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({ enum: [Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT] })
  @IsEnum(Role, { message: 'Role must be CHIEF_ACCOUNTANT or ACCOUNTANT' })
  role: Role;
}
