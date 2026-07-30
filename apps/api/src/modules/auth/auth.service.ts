import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { LoginDto } from './dto/login.dto';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { Role, UserStatus } from '@prisma/client';

/**
 * Two login modes share one session model (the httpOnly session cookie):
 *  - Microsoft Entra SSO (issueSsoSession, called by the SSO callback; AUTH_MODE 'sso'/'both')
 *  - classic email/password login (login; AUTH_MODE 'password'/'both')
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private activityLogs: ActivityLogsService,
  ) {}

  /** Sign the app's own short-lived (8h, per JWT_EXPIRATION) session JWT. No refresh token. */
  private signSession(user: {
    id: string;
    email: string;
    tenantId: string | null;
    role: Role;
  }): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      mfaVerified: true, // only issued after MFA (local) or Microsoft Entra auth (SSO)
    });
  }

  /** Issue the app session after a validated Microsoft SSO login. */
  async issueSsoSession(user: {
    id: string;
    email: string;
    tenantId: string | null;
    role: Role;
  }) {
    const accessToken = this.signSession(user);

    this.activityLogs.log({
      tenantId: user.tenantId ?? undefined,
      userId: user.id,
      action: 'login',
      entityType: 'User',
      entityId: user.id,
      description: `${user.email} signed in via Microsoft SSO`,
    });

    return { accessToken };
  }

  /** Classic email/password (+ optional TOTP MFA) login — active only when SSO is disabled. */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    if (!user.passwordHash) {
      // SSO-provisioned account with no local password.
      throw new UnauthorizedException('This account uses Microsoft sign-in');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        return { mfaRequired: true as const, message: 'MFA code required' };
      }

      const isValid = authenticator.verify({
        token: dto.mfaCode,
        secret: user.mfaSecret!,
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    const accessToken = this.signSession(user);

    this.activityLogs.log({
      tenantId: user.tenantId ?? undefined,
      userId: user.id,
      action: 'login',
      entityType: 'User',
      entityId: user.id,
      description: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() + ` logged in`,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
      tenant: user.tenant
        ? {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
            baseCurrency: user.tenant.baseCurrency,
            status: user.tenant.status,
            hasLogo: !!user.tenant.logoPath,
          }
        : null,
      accessToken,
    };
  }

  async logout(userId: string) {
    // SSO sessions issue no refresh tokens; clean up any legacy rows defensively.
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      this.activityLogs.log({
        tenantId: user.tenantId ?? undefined,
        userId: user.id,
        action: 'logout',
        entityType: 'User',
        entityId: user.id,
        description: `${user.email} signed out`,
      });
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        status: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            baseCurrency: true,
            status: true,
            logoPath: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { tenant, ...rest } = user;
    return {
      ...rest,
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            baseCurrency: tenant.baseCurrency,
            status: tenant.status,
            hasLogo: !!tenant.logoPath,
          }
        : null,
    };
  }
}
