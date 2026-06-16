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
    enum: [Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING, Role.SENIOR_OFFICE_PAYMENTS, Role.SENIOR_ARAP_OFFICER, Role.PAYMENT_OFFICER],
    example: Role.PAYMENT_OFFICER,
    description: 'User role within the tenant',
  })
  @IsEnum(Role, {
    message: `Role must be one of: ${Role.OWNER}, ${Role.FINANCE_MANAGER}, ${Role.ASSISTANT_MANAGER_BILLING}, ${Role.SENIOR_OFFICE_PAYMENTS}, ${Role.SENIOR_ARAP_OFFICER}, ${Role.PAYMENT_OFFICER}`,
  })
  role: Role;
}
