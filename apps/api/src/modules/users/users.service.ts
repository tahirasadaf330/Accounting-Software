import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Role, UserStatus, InvitationStatus } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { PAGINATION_DEFAULTS } from '@accounting-saas/shared';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(tenantId: string, dto: CreateUserDto) {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required to create a user');
    }

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${tenantId}" not found`);
    }

    // Prevent creating OWNER users programmatically (set separately)
    if (dto.role === Role.OWNER) {
      throw new ForbiddenException('Cannot assign OWNER role via this endpoint');
    }

    // Check if email is already in use
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // SSO users have no local password; only hash one if an admin explicitly set it.
    const passwordHash = dto.password ? await argon2.hash(dto.password) : null;

    return this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAllByTenant(tenantId: string, page?: number, limit?: number) {
    const currentPage = page && page > 0 ? page : PAGINATION_DEFAULTS.page;
    const currentLimit = limit && limit > 0
      ? Math.min(limit, PAGINATION_DEFAULTS.maxLimit)
      : PAGINATION_DEFAULTS.limit;
    const skip = (currentPage - 1) * currentLimit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { tenantId },
        skip,
        take: currentLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          mfaEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where: { tenantId } }),
    ]);

    const totalPages = Math.ceil(total / currentLimit);

    return {
      data,
      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new BadRequestException('User is already inactive');
    }

    if (user.role === Role.OWNER) {
      throw new ForbiddenException('Cannot deactivate an OWNER user');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async activate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User is already active');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (user.id === currentUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    if (user.role === Role.OWNER) {
      throw new ForbiddenException('Cannot delete an OWNER user');
    }

    await this.prisma.user.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  }

  async changeRole(id: string, newRole: Role) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (user.role === Role.OWNER) {
      throw new ForbiddenException('Cannot change the role of an OWNER user');
    }

    if (newRole === Role.OWNER) {
      throw new ForbiddenException('Cannot assign OWNER role via this endpoint');
    }

    if (user.role === newRole) {
      throw new BadRequestException(`User already has the role "${newRole}"`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async inviteUser(tenantId: string, invitedById: string, dto: InviteUserDto) {
    // Only allow non-OWNER roles for invitations
    if (dto.role === Role.OWNER) {
      throw new BadRequestException('Cannot invite users with OWNER role');
    }

    // Check no existing user with this email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Check no active pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        tenantId,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('An active invitation already exists for this email');
    }

    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedById },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        email: dto.email.toLowerCase(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        invitedById,
        token,
        expiresAt,
      },
    });

    await this.mailService.sendInvitation({
      email: dto.email.toLowerCase(),
      firstName: dto.firstName,
      lastName: dto.lastName,
      inviterName: inviter ? `${inviter.firstName} ${inviter.lastName}` : 'A team member',
      companyName: tenant.name,
      role: dto.role,
      token,
    });

    return invitation;
  }

  async getInvitationsByTenant(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async resendInvitation(tenantId: string, invitationId: string, resendById: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { tenant: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this invitation');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be resent');
    }

    // Generate a new token and extend expiry
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { token, expiresAt },
    });

    const resender = await this.prisma.user.findUnique({
      where: { id: resendById },
    });

    await this.mailService.sendInvitation({
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      inviterName: resender ? `${resender.firstName} ${resender.lastName}` : 'A team member',
      companyName: invitation.tenant.name,
      role: invitation.role,
      token,
    });

    return updated;
  }

  async cancelInvitation(tenantId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this invitation');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be cancelled');
    }

    await this.prisma.invitation.delete({
      where: { id: invitationId },
    });

    return { message: 'Invitation cancelled' };
  }
}
