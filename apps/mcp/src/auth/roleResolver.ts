/**
 * Resolve a caller's e-mail to ONE role + tenant from the LOCAL mirror (the
 * app's users table). No Microsoft Graph call on the request path (Guide 1.3).
 *
 * Deny-by-default (3.4): unknown, inactive, non-tenant role, missing tenant, or
 * ambiguous (>1 row) all fail closed. The resolution — including denials — is
 * cached for <= 60s (3.5). Resolver ERRORS are never cached (don't pin an outage).
 *
 * Reads only identity columns of `users` (email, role, tenantId, status); the
 * DB grant is column-scoped so this account can never read passwordHash/mfaSecret.
 */
import { Role, TENANT_ROLES } from '@accounting-saas/shared';
import { roPool } from '../db/pools.js';
import { config } from '../config.js';
import { log } from '../logging.js';

export type ResolveResult =
  | { ok: true; principal: { userId: string; role: Role; tenantId: string } }
  | { ok: false; reason: string };

const TENANT_ROLE_SET = new Set<string>(TENANT_ROLES as readonly string[]);

interface CacheEntry {
  expires: number;
  result: ResolveResult;
}
const cache = new Map<string, CacheEntry>();
const MAX_CACHE = 5000;

export async function resolvePrincipal(email: string, requestId: string | null): Promise<ResolveResult> {
  const now = Date.now();
  const hit = cache.get(email);
  if (hit && hit.expires > now) return hit.result;

  let result: ResolveResult;
  try {
    const { rows } = await roPool.query(
      'SELECT email, role, "tenantId" AS "tenantId", status FROM users WHERE lower(email) = $1 LIMIT 2',
      [email],
    );
    if (rows.length === 0) {
      result = { ok: false, reason: 'no principal' };
    } else if (rows.length > 1) {
      // Multiple accounts for one e-mail = misconfiguration → DENY (never merge).
      result = { ok: false, reason: 'ambiguous principal' };
    } else {
      const r = rows[0] as { role: string; tenantId: string | null; status: string };
      if (r.status !== 'ACTIVE') result = { ok: false, reason: 'inactive' };
      else if (!TENANT_ROLE_SET.has(r.role)) result = { ok: false, reason: 'role not permitted' };
      else if (!r.tenantId) result = { ok: false, reason: 'no tenant' };
      else result = { ok: true, principal: { userId: email, role: r.role as Role, tenantId: r.tenantId } };
    }
  } catch (e) {
    // Fail closed but do NOT cache — a transient DB error must not pin denials.
    log.error(requestId, 'role resolver error', e);
    return { ok: false, reason: 'resolver error' };
  }

  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(email, { expires: now + config.roleCacheTtlMs, result });
  return result;
}

/** Test helper — clears the in-process resolution cache. */
export function _clearRoleCache(): void {
  cache.clear();
}
