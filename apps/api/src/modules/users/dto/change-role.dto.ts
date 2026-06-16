import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class ChangeRoleDto {
  @ApiProperty({
    enum: [Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING, Role.SENIOR_OFFICE_PAYMENTS, Role.SENIOR_ARAP_OFFICER, Role.PAYMENT_OFFICER],
    example: Role.FINANCE_MANAGER,
    description: 'New role for the user',
  })
  @IsEnum(Role, {
    message: `Role must be one of: ${Role.OWNER}, ${Role.FINANCE_MANAGER}, ${Role.ASSISTANT_MANAGER_BILLING}, ${Role.SENIOR_OFFICE_PAYMENTS}, ${Role.SENIOR_ARAP_OFFICER}, ${Role.PAYMENT_OFFICER}`,
  })
  role: Role;
}
