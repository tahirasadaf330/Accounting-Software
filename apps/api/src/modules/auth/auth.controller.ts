import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  getAuthMode,
} from './auth.constants';

/**
 * Session endpoints. The active login method depends on AUTH_MODE:
 *  - 'password' → email/password form only
 *  - 'both'     → password login AND Microsoft SSO (migration period)
 *  - 'sso'      → Microsoft only; POST /auth/login is disabled (403)
 * Every mode sets the same httpOnly session cookie.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password (disabled in sso-only mode)' })
  async login(@Body() dto: LoginDto, @Res() reply: FastifyReply) {
    if (getAuthMode(this.config) === 'sso') {
      throw new ForbiddenException('Password login is disabled — sign in with Microsoft');
    }

    const result = await this.authService.login(dto);

    if ('mfaRequired' in result) {
      reply.send(result);
      return;
    }

    const { accessToken, ...body } = result;
    reply.setCookie(SESSION_COOKIE, accessToken, sessionCookieOptions(this.config));
    reply.send(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out and clear the session cookie' })
  async logout(@CurrentUser('id') userId: string, @Res() reply: FastifyReply) {
    await this.authService.logout(userId);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    reply.send({ message: 'Logged out successfully' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
