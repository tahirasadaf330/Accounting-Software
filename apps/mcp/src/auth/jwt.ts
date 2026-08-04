/**
 * Verify the Atlas-signed identity token (Hayo MCP Integration Spec §3).
 *
 * Asymmetric: Atlas signs with a PRIVATE key; we hold only the PUBLIC key (JWKS
 * for prod, a local JWKS file for dev) and can only verify. Checks, in order:
 *   1. `Authorization: Bearer` present
 *   2. signature, RS256 ONLY (alg:none / HS256 rejected)
 *   3. iss === "atlas"
 *   4. aud === our identifier
 *   5. exp not passed, nbf arrived (±60s leeway)
 *   6. jti not seen before (replay protection)
 *   7. oid present
 * Anything missing/invalid → fail closed. jose's createRemoteJWKSet caches keys
 * and re-fetches on an unknown `kid`.
 */
import { readFileSync } from 'node:fs';
import { config } from '../config.js';
import { log } from '../logging.js';

export interface Claims {
  oid: string;
  email: string | null;
  name: string | null;
  correlationId: string;
  jti: string;
}

export type VerifyResult = { ok: true; claims: Claims } | { ok: false; reason: 'bad_token' | 'token_expired' | 'token_replayed' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let keyResolver: any = null;

async function getKeyResolver(): Promise<unknown> {
  if (keyResolver) return keyResolver;
  const jose = await import('jose');
  if (config.jwksUrl) {
    keyResolver = jose.createRemoteJWKSet(new URL(config.jwksUrl));
  } else {
    const jwks = JSON.parse(readFileSync(config.jwtPublicKeyFile, 'utf8'));
    keyResolver = jose.createLocalJWKSet(jwks);
  }
  return keyResolver;
}

// jti -> expiry (ms). Bounded; purged lazily. Length ~= token lifetime (~2 min).
const seenJti = new Map<string, number>();

function jtiIsFresh(jti: string, expSec: number | undefined): boolean {
  const now = Date.now();
  if (seenJti.size > 20_000) for (const [k, e] of seenJti) if (e <= now) seenJti.delete(k);
  const existing = seenJti.get(jti);
  if (existing && existing > now) return false; // already used → replay
  seenJti.set(jti, expSec ? expSec * 1000 : now + 180_000);
  return true;
}

export async function verifyToken(authHeader: string | undefined): Promise<VerifyResult> {
  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) return { ok: false, reason: 'bad_token' };
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { ok: false, reason: 'bad_token' };

  const jose = await import('jose');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any;
  try {
    const res = await jose.jwtVerify(token, (await getKeyResolver()) as never, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      algorithms: ['RS256'],
      clockTolerance: config.clockToleranceSec,
    });
    payload = res.payload;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = e as any;
    if (err?.code === 'ERR_JWT_EXPIRED') return { ok: false, reason: 'token_expired' };
    if (err?.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED' && err?.claim === 'nbf') return { ok: false, reason: 'token_expired' };
    // signature / iss / aud / alg-not-allowed / malformed → bad_token (never leak specifics to caller)
    log.warn(null, 'token verification failed', { code: err?.code, claim: err?.claim });
    return { ok: false, reason: 'bad_token' };
  }

  if (typeof payload.oid !== 'string' || !payload.oid) return { ok: false, reason: 'bad_token' };
  if (typeof payload.jti !== 'string' || !payload.jti) return { ok: false, reason: 'bad_token' };
  if (!jtiIsFresh(payload.jti, typeof payload.exp === 'number' ? payload.exp : undefined)) {
    return { ok: false, reason: 'token_replayed' };
  }

  return {
    ok: true,
    claims: {
      oid: payload.oid,
      email: typeof payload.email === 'string' ? payload.email : null,
      name: typeof payload.name === 'string' ? payload.name : null,
      correlationId: typeof payload.correlation_id === 'string' ? payload.correlation_id : 'unknown',
      jti: payload.jti,
    },
  };
}

/** Test helper — clears the jti replay cache. */
export function _clearJtiCache(): void {
  seenJti.clear();
}
