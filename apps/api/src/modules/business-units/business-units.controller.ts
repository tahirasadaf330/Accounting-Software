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
import { BusinessUnitsService } from './business-units.service';
import { CreateBusinessUnitDto } from './dto/create-business-unit.dto';
import { UpdateBusinessUnitDto } from './dto/update-business-unit.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('business-units')
@ApiBearerAuth()
@Controller('business-units')
export class BusinessUnitsController {
  constructor(private readonly service: BusinessUnitsService) {}

  @Post()
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new business unit' })
  @ApiResponse({ status: 201, description: 'Business unit created' })
  create(@TenantId() tenantId: string, @Body() dto: CreateBusinessUnitDto) {
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List business units' })
  @ApiResponse({ status: 200, description: 'List of business units' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @TenantId() tenantId: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page !== undefined ? Number(page) : undefined;
    const limitNum = limit !== undefined ? Number(limit) : undefined;
    return this.service.findAll(tenantId, search, isActive, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a business unit by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Business unit details' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Update a business unit' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Business unit updated' })
  update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessUnitDto,
  ) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a business unit' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 400, description: 'Has assigned contacts' })
  async delete(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.service.delete(tenantId, id);
  }
}
