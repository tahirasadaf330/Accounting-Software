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

  @ApiProperty({ enum: [Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING, Role.SENIOR_OFFICE_PAYMENTS, Role.SENIOR_ARAP_OFFICER, Role.PAYMENT_OFFICER] })
  @IsEnum(Role, { message: 'Role must be FINANCE_MANAGER, ASSISTANT_MANAGER_BILLING, SENIOR_OFFICE_PAYMENTS, SENIOR_ARAP_OFFICER, or PAYMENT_OFFICER' })
  role: Role;
}
