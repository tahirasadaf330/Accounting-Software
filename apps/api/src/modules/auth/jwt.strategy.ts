import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SESSION_COOKIE } from './auth.constants';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  role: string;
  mfaVerified: boolean;
}

/** Read the session JWT from the httpOnly cookie set after SSO login. */
const cookieExtractor = (req: { cookies?: Record<string, string> }): string | null =>
  req?.cookies?.[SESSION_COOKIE] ?? null;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor as (req: unknown) => string | null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        status: true,
        mfaEnabled: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      mfaEnabled: user.mfaEnabled,
      mfaVerified: payload.mfaVerified,
    };
  }
}
