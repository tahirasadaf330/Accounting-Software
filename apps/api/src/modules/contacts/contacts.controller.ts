import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@TenantId() tenantId: string, @Body() dto: CreateContactDto) {
    return this.contactsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List contacts with optional filters' })
  @ApiResponse({ status: 200, description: 'List of contacts' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, email, or phone' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by contact type (CUSTOMER, VENDOR, BOTH)' })
  findAll(
    @TenantId() tenantId: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('type') type?: string,
  ) {
    return this.contactsService.findAll(tenantId, search, isActive, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single contact by ID' })
  @ApiParam({ name: 'id', description: 'Contact ID', type: String })
  @ApiResponse({ status: 200, description: 'Contact details' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Update a contact' })
  @ApiParam({ name: 'id', description: 'Contact ID', type: String })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiParam({ name: 'id', description: 'Contact ID', type: String })
  @ApiResponse({ status: 204, description: 'Contact deleted successfully' })
  @ApiResponse({ status: 400, description: 'Contact has linked transactions' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async delete(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.contactsService.delete(tenantId, id);
  }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Get statement of account for a contact' })
  @ApiParam({ name: 'id', description: 'Contact ID', type: String })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Contact statement of account' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  getStatement(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.contactsService.getStatement(tenantId, id, fromDate, toDate);
  }
}
