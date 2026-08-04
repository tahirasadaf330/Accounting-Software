/**
 * Resolve a verified token's identity to ONE local user + role (Spec §3.4/§3.5).
 *
 * Match order: token oid → email (case-insensitive, trimmed) → write-once backfill.
 * The token's Entra oid is matched against the users.azureOid column that Entra SSO
 * already populates (aliased AS oid below, so the rest of this file is column-agnostic).
 * Deny-by-default: unknown, ambiguous (>1), inactive, non-tenant role, or no
 * tenant all fail closed. Resolution is cached ≤60s (keyed by oid). Backfill is a
 * narrow identity write via the oid-writer account; the data path stays read-only.
 */
import { Role, TENANT_ROLES } from '@accounting-saas/shared';
import { roPool, oidWriterPool } from '../db/pools.js';
import { config } from '../config.js';
import { log } from '../logging.js';

export interface Principal {
  localUserId: string;
  oid: string;
  email: string | null;
  role: Role;
  tenantId: string;
  matchedBy: 'oid' | 'email';
}

export type ResolveResult =
  | { ok: true; principal: Principal }
  | { ok: false; reason: 'no_account' | 'ambiguous_account' };

const TENANT_ROLE_SET = new Set<string>(TENANT_ROLES as readonly string[]);
const SELECT_COLS = 'id, email, role, "tenantId" AS "tenantId", status, "azureOid" AS oid';

interface CacheEntry {
  expires: number;
  result: ResolveResult;
}
const cache = new Map<string, CacheEntry>();
const MAX_CACHE = 5000;

export async function resolvePrincipal(
  claims: { oid: string; email: string | null },
  requestId: string | null,
): Promise<ResolveResult> {
  const now = Date.now();
  const hit = cache.get(claims.oid);
  if (hit && hit.expires > now) return hit.result;

  let result: ResolveResult;
  try {
    result = await resolveUncached(claims, requestId);
  } catch (e) {
    log.error(requestId, 'role resolver error', e);
    return { ok: false, reason: 'no_account' }; // fail closed; do NOT cache errors
  }

  if (cache.size >= MAX_CACHE) {
    const k = cache.keys().next().value;
    if (k !== undefined) cache.delete(k);
  }
  cache.set(claims.oid, { expires: now + config.roleCacheTtlMs, result });
  return result;
}

async function resolveUncached(
  claims: { oid: string; email: string | null },
  requestId: string | null,
): Promise<ResolveResult> {
  // 1. by Entra oid (primary — matched against users.azureOid, populated by SSO)
  let rows = (await roPool.query(`SELECT ${SELECT_COLS} FROM users WHERE "azureOid" = $1 LIMIT 2`, [claims.oid])).rows;
  let matchedBy: 'oid' | 'email' = 'oid';

  // 2. fallback by email
  if (rows.length === 0 && claims.email) {
    rows = (await roPool.query(`SELECT ${SELECT_COLS} FROM users WHERE lower(email) = lower($1) LIMIT 2`, [claims.email.trim()])).rows;
    matchedBy = 'email';
  }

  if (rows.length === 0) return { ok: false, reason: 'no_account' };
  if (rows.length > 1) return { ok: false, reason: 'ambiguous_account' };

  const u = rows[0] as { id: string; email: string | null; role: string; tenantId: string | null; status: string; oid: string | null };
  // inactive / locked → identical generic outcome as "no account"
  if (u.status !== 'ACTIVE') return { ok: false, reason: 'no_account' };
  if (!TENANT_ROLE_SET.has(u.role) || !u.tenantId) return { ok: false, reason: 'no_account' };

  // 3. write-once azureOid backfill: only when empty, only after the active check,
  // only when the matched row's email genuinely equals the token email.
  if (
    matchedBy === 'email' &&
    !u.oid &&
    oidWriterPool &&
    claims.email &&
    u.email &&
    u.email.toLowerCase() === claims.email.trim().toLowerCase()
  ) {
    try {
      await oidWriterPool.query('UPDATE users SET "azureOid" = $1 WHERE id = $2 AND "azureOid" IS NULL AND lower(email) = lower($3)', [
        claims.oid,
        u.id,
        claims.email.trim(),
      ]);
    } catch (e) {
      log.warn(requestId, 'oid backfill failed (non-fatal)', e);
    }
  }

  return {
    ok: true,
    principal: {
      localUserId: u.id,
      oid: claims.oid,
      email: u.email ?? null,
      role: u.role as Role,
      tenantId: u.tenantId,
      matchedBy,
    },
  };
}

/** Test helper — clears the in-process resolution cache. */
export function _clearRoleCache(): void {
  cache.clear();
}
