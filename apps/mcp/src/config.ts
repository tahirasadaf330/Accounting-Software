/**
 * Central configuration. Loaded once at startup.
 *
 * Identity model (Hayo MCP Integration Spec): callers present an Atlas-signed
 * JWT in `Authorization: Bearer`. We verify it with Atlas's PUBLIC key (JWKS for
 * prod, a local JWK file for dev). There is NO shared secret and NO identity
 * header — identity lives only inside the verified token.
 */

function str(name: string, fallback = ''): string {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export interface AppConfig {
  systemSlug: string; // audit "system" field, lowercase (e.g. "accounting")
  systemLabel: string;
  host: string;
  port: number;

  // JWT / identity
  jwtIssuer: string; // expected `iss` (spec: "atlas")
  jwtAudience: string; // expected `aud` — unique to THIS mcp
  jwksUrl: string; // Atlas JWKS endpoint (prod)
  jwtPublicKeyFile: string; // local JWKS file (dev), used when jwksUrl is unset
  clockToleranceSec: number;

  // Datasources
  roDatabaseUrl: string; // read-only (atlas_mcp)
  auditDatabaseUrl: string; // optional local audit copy (atlas_mcp_audit)
  oidWriterDatabaseUrl: string; // narrow writer: UPDATE(oid) ON users only

  // Caps
  rowCap: number;
  byteCap: number;
  statementTimeoutMs: number;
  httpBodyLimit: number;
  rateLimitPerMin: number;
  poolMax: number;
  roleCacheTtlMs: number;
}

export const config: AppConfig = {
  systemSlug: str('SYSTEM_SLUG', 'accounting'),
  systemLabel: str('SYSTEM_LABEL', 'Accounting'),
  host: str('MCP_HOST', '127.0.0.1'),
  port: int('MCP_PORT', 7801),

  jwtIssuer: str('ATLAS_JWT_ISS', 'atlas'),
  jwtAudience: str('ATLAS_JWT_AUD'),
  jwksUrl: str('ATLAS_JWKS_URL'),
  jwtPublicKeyFile: str('ATLAS_JWT_PUBLIC_KEY_FILE'),
  clockToleranceSec: int('ATLAS_JWT_CLOCK_TOLERANCE', 60),

  roDatabaseUrl: str('MCP_DATABASE_URL'),
  auditDatabaseUrl: str('MCP_AUDIT_DATABASE_URL'),
  oidWriterDatabaseUrl: str('MCP_OID_WRITER_DATABASE_URL'),

  rowCap: int('MCP_ROW_CAP', 10_000),
  byteCap: int('MCP_BYTE_CAP', 1_048_576),
  statementTimeoutMs: int('MCP_STATEMENT_TIMEOUT_MS', 30_000),
  httpBodyLimit: int('MCP_HTTP_BODY_LIMIT', 65_536),
  rateLimitPerMin: int('MCP_RATE_LIMIT_PER_MIN', 30),
  poolMax: int('MCP_POOL_MAX', 8),
  roleCacheTtlMs: int('ROLE_CACHE_TTL_MS', 60_000),
};

/** Fail-closed startup validation. Exits the process on misconfiguration. */
export function validateConfigOrExit(): void {
  const problems: string[] = [];
  const warnings: string[] = [];

  if (!config.jwtAudience) {
    problems.push('ATLAS_JWT_AUD is unset — required to reject tokens minted for another MCP.');
  }
  if (!config.jwksUrl && !config.jwtPublicKeyFile) {
    problems.push('No token verification key: set ATLAS_JWKS_URL (prod) or ATLAS_JWT_PUBLIC_KEY_FILE (dev).');
  }
  if (!config.roDatabaseUrl) {
    problems.push('MCP_DATABASE_URL (read-only DSN) is unset.');
  }
  if (!config.auditDatabaseUrl) {
    warnings.push('MCP_AUDIT_DATABASE_URL unset — local audit copy disabled (audit block is still returned to Atlas).');
  }
  if (!config.oidWriterDatabaseUrl) {
    warnings.push('MCP_OID_WRITER_DATABASE_URL unset — oid write-once backfill disabled (matching still works via email).');
  }

  for (const w of warnings) console.warn('[accounting-mcp] warn: ' + w); // eslint-disable-line no-console
  if (problems.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[accounting-mcp] startup configuration errors:');
    for (const p of problems) console.error('  - ' + p); // eslint-disable-line no-console
    process.exit(1);
  }
}
