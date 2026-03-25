import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class ChangeRoleDto {
  @ApiProperty({
    enum: [Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT],
    example: Role.CHIEF_ACCOUNTANT,
    description: 'New role for the user',
  })
  @IsEnum(Role, {
    message: `Role must be one of: ${Role.OWNER}, ${Role.CHIEF_ACCOUNTANT}, ${Role.ACCOUNTANT}`,
  })
  role: Role;
}
