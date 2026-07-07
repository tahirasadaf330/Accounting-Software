import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ExternalDbService } from './external-db.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('external-db')
@ApiBearerAuth()
@Controller('external-db')
export class ExternalDbController {
  constructor(private readonly service: ExternalDbService) {}

  @Get('jerasoft/test')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Test Jerasoft PostgreSQL connection' })
  testJerasoft() {
    return this.service.testJerasoftConnection();
  }

  @Get('asmse/test')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Test ASMSE SQL Server connection' })
  testAsmse() {
    return this.service.testAsmseConnection();
  }

  @Get('jerasoft/contacts')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Fetch contacts from Jerasoft filtered by type' })
  @ApiQuery({ name: 'type', enum: ['VENDOR', 'CUSTOMER', 'BOTH'], required: false })
  getJerasoftContacts(@Query('type') type: 'VENDOR' | 'CUSTOMER' | 'BOTH' = 'BOTH') {
    return this.service.getJerasoftContacts(type);
  }

  @Get('jerasoft/contacts/:id')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Fetch a single Jerasoft contact by ID' })
  getJerasoftContact(@Param('id') id: string) {
    return this.service.getJerasoftContactById(id);
  }

  @Get('asmse/contacts')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Fetch contacts from ASMSE filtered by type' })
  @ApiQuery({ name: 'type', enum: ['VENDOR', 'CUSTOMER', 'BOTH'], required: false })
  getAsmseContacts(@Query('type') type: 'VENDOR' | 'CUSTOMER' | 'BOTH' = 'BOTH') {
    return this.service.getAsmseContacts(type);
  }

  @Get('asmse/contacts/:id')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Fetch a single ASMSE contact by ID' })
  getAsmseContact(@Param('id') id: string) {
    return this.service.getAsmseContactById(id);
  }
}
