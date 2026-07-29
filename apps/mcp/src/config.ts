/**
 * Central configuration. Loaded once at startup.
 *
 * Ground rules enforced here:
 *  - Refuse to START without the shared secret configured (Guide 3.2).
 *  - One secret per connector per environment; support OLD+NEW during rotation (3.3).
 */

function str(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    return '';
  }
  return v;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export interface AppConfig {
  systemSlug: string;
  systemLabel: string;
  host: string;
  port: number;
  secret: string;
  secretOld: string;
  roDatabaseUrl: string;
  auditDatabaseUrl: string;
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
  secret: str('ATLAS_MCP_SECRET'),
  secretOld: str('ATLAS_MCP_SECRET_OLD'),
  roDatabaseUrl: str('MCP_DATABASE_URL'),
  auditDatabaseUrl: str('MCP_AUDIT_DATABASE_URL'),
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

  // The secret must be present and long enough. Never log its value.
  if (!config.secret) {
    problems.push('ATLAS_MCP_SECRET is unset — the connector refuses to start without it.');
  } else if (Buffer.byteLength(config.secret, 'utf8') < 32) {
    problems.push('ATLAS_MCP_SECRET must be at least 32 bytes.');
  }
  if (config.secretOld && Buffer.byteLength(config.secretOld, 'utf8') < 32) {
    problems.push('ATLAS_MCP_SECRET_OLD is set but shorter than 32 bytes.');
  }
  if (!config.roDatabaseUrl) {
    problems.push('MCP_DATABASE_URL (read-only DSN) is unset.');
  }
  if (!config.auditDatabaseUrl) {
    problems.push('MCP_AUDIT_DATABASE_URL (audit writer DSN) is unset.');
  }

  if (problems.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[accounting-mcp] startup configuration errors:');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
}
