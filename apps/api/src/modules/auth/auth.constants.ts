import type { ConfigService } from '@nestjs/config';
import type { CookieSerializeOptions } from '@fastify/cookie';

/** Name of the httpOnly cookie that carries the app session JWT (SSO or password login). */
export const SESSION_COOKIE = 'access_token';

/** Session cookie lifetime = the JWT lifetime (JWT_EXPIRATION, default 8h), in seconds. */
export function sessionMaxAgeSeconds(config: ConfigService): number {
  const raw = config.get<string>('JWT_EXPIRATION', '8h').trim();
  const match = /^(\d+)\s*([smhd])$/.exec(raw);
  if (!match) return 8 * 60 * 60;
  const value = parseInt(match[1], 10);
  const unit = { s: 1, m: 60, h: 3600, d: 86400 }[match[2]] ?? 3600;
  return value * unit;
}

/** Cookie options for the app session — shared by the SSO callback and the password login. */
export function sessionCookieOptions(config: ConfigService): CookieSerializeOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.get<string>('NODE_ENV') === 'production',
    path: '/',
    maxAge: sessionMaxAgeSeconds(config),
  };
}

/**
 * Login mode (AUTH_MODE env):
 *  - 'password' — email/password form only (SSO routes redirect to /login)
 *  - 'both'     — password form + "Sign in with Microsoft" (migration/verification period)
 *  - 'sso'      — Microsoft only (password endpoint returns 403)
 * Unknown/unset values fall back to 'password' so a typo can never lock everyone out.
 */
export type AuthMode = 'password' | 'both' | 'sso';

export function getAuthMode(config: ConfigService): AuthMode {
  const raw = config.get<string>('AUTH_MODE', 'password').toLowerCase();
  return raw === 'sso' || raw === 'both' ? raw : 'password';
}
