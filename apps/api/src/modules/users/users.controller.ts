import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { PAGINATION_DEFAULTS } from '@accounting-saas/shared';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user in the current tenant' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(tenantId, dto);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new user to the tenant via email' })
  async inviteUser(
    @TenantId() tenantId: string,
    @CurrentUser('id') currentUserId: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.usersService.inviteUser(tenantId, currentUserId, dto);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'List all invitations for the current tenant' })
  async getInvitations(@TenantId() tenantId: string) {
    return this.usersService.getInvitationsByTenant(tenantId);
  }

  @Post('invitations/:id/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend an invitation email' })
  async resendInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.usersService.resendInvitation(tenantId, id, currentUserId);
  }

  @Post('invitations/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending invitation' })
  async cancelInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    return this.usersService.cancelInvitation(tenantId, id);
  }

  @Get()
  @ApiOperation({ summary: 'List all users in the current tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 25 })
  async findAll(
    @TenantId() tenantId: string,
    @Query('page', new DefaultValuePipe(PAGINATION_DEFAULTS.page), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(PAGINATION_DEFAULTS.limit), ParseIntPipe) limit: number,
  ) {
    return this.usersService.findAllByTenant(tenantId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    const user = await this.usersService.findOne(id);

    // Ensure the user belongs to the requesting user's tenant
    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this user');
    }

    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.findOne(id);

    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this user');
    }

    return this.usersService.update(id, dto);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a user' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    const user = await this.usersService.findOne(id);

    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this user');
    }

    if (user.id === currentUserId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    return this.usersService.deactivate(id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a user' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    const user = await this.usersService.findOne(id);

    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this user');
    }

    return this.usersService.activate(id);
  }

  @Patch(':id/role')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Change a user role (OWNER only)' })
  async changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') currentUserId: string,
    @Body() dto: ChangeRoleDto,
  ) {
    const user = await this.usersService.findOne(id);

    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this user');
    }

    if (user.id === currentUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    return this.usersService.changeRole(id, dto.role);
  }
}
