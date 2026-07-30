import { Controller, Get, Logger, Query, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from '../../common/decorators/public.decorator';
import { SsoService } from './sso.service';
import { AuthService } from './auth.service';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  getAuthMode,
} from './auth.constants';

const OIDC_COOKIE = 'sso_oidc';

interface OidcStash {
  v: string; // PKCE code_verifier
  s: string; // state
  n: string; // nonce
  r: string; // returnTo (web path)
}

@ApiExcludeController()
@Controller('auth')
export class SsoController {
  private readonly logger = new Logger(SsoController.name);

  constructor(
    private readonly sso: SsoService,
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private get webUrl(): string {
    return this.config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  private get isProd(): boolean {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  /** Only allow returning to an in-app path — never an absolute/off-site URL (open-redirect guard). */
  private sanitizeReturnTo(returnTo?: string): string {
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }
    return '/dashboard';
  }

  @Public()
  @Get('microsoft')
  async start(
    @Query('returnTo') returnTo: string | undefined,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    if (getAuthMode(this.config) === 'password') {
      // Microsoft sign-in is switched off — the password login page is the way in.
      await reply.status(302).redirect(`${this.webUrl}/login`);
      return;
    }

    const returnPath = this.sanitizeReturnTo(returnTo);
    const authReq = await this.sso.createAuthRequest();

    const stash: OidcStash = {
      v: authReq.codeVerifier,
      s: authReq.state,
      n: authReq.nonce,
      r: returnPath,
    };

    reply.setCookie(OIDC_COOKIE, JSON.stringify(stash), {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isProd,
      signed: true,
      path: '/api/v1/auth',
      maxAge: 600, // 10 minutes to complete the round-trip
    });

    await reply.status(302).redirect(authReq.url);
  }

  @Public()
  @Get('microsoft/callback')
  async callback(
    @Query() query: Record<string, string>,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    if (getAuthMode(this.config) === 'password') {
      await reply.status(302).redirect(`${this.webUrl}/login`);
      return;
    }

    try {
      const raw = req.cookies?.[OIDC_COOKIE];
      const unsigned = raw ? req.unsignCookie(raw) : null;
      if (!unsigned?.valid || !unsigned.value) {
        // No valid transient cookie (expired / tampered / direct hit) — start over.
        await reply.status(302).redirect(`${this.webUrl}/login?error=session`);
        return;
      }
      reply.clearCookie(OIDC_COOKIE, { path: '/api/v1/auth' });

      const stash = JSON.parse(unsigned.value) as OidcStash;

      const identity = await this.sso.validateCallback(query, {
        codeVerifier: stash.v,
        state: stash.s,
        nonce: stash.n,
      });

      const user = await this.sso.resolveUser(identity);
      if (!user) {
        // Authenticated by Microsoft, but no active app account (guide §3.5). Deny — no auto-create.
        await reply.status(302).redirect(`${this.webUrl}/not-authorized`);
        return;
      }

      const { accessToken } = await this.authService.issueSsoSession(user);
      reply.setCookie(SESSION_COOKIE, accessToken, sessionCookieOptions(this.config));

      await reply.status(302).redirect(`${this.webUrl}${this.sanitizeReturnTo(stash.r)}`);
    } catch (err) {
      this.logger.error(`SSO callback failed: ${(err as Error).message}`);
      await reply.status(302).redirect(`${this.webUrl}/login?error=sso`);
    }
  }
}
