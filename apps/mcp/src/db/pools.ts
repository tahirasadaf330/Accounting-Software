/**
 * Data access uses a SECOND datasource logged in as the SELECT-only account —
 * NEVER the app's read-write pool (Guide 4.2). A separate INSERT-only pool
 * writes the audit log. Both pools are small so AI traffic can't starve the app.
 */
import { Pool, types } from 'pg';
import { config } from '../config.js';
import { log } from '../logging.js';

// Numbers as numbers (Spec §6): return numeric/decimal as JS numbers, not strings.
// Accounting values are well within float64's ~15 significant digits.
types.setTypeParser(1700, (v: string | null) => (v === null ? null : Number.parseFloat(v))); // numeric/decimal
types.setTypeParser(20, (v: string | null) => (v === null ? null : Number.parseInt(v, 10))); // int8/bigint

/** Read-only datasource (atlas_mcp — SELECT-only, default_transaction_read_only). */
export const roPool = new Pool({
  connectionString: config.roDatabaseUrl,
  max: config.poolMax,
  application_name: `${config.systemSlug}-mcp-ro`,
  statement_timeout: config.statementTimeoutMs,
  idle_in_transaction_session_timeout: config.statementTimeoutMs,
});

/** Audit writer datasource (INSERT-only on mcp_audit_log, no other grants). */
export const auditPool = config.auditDatabaseUrl
  ? new Pool({
      connectionString: config.auditDatabaseUrl,
      max: 4,
      application_name: `${config.systemSlug}-mcp-audit`,
      statement_timeout: config.statementTimeoutMs,
    })
  : null;

/**
 * Narrow identity writer — its ONLY grant is UPDATE(oid) ON users (write-once
 * backfill, Spec §3.4). Data stays read-only; this account cannot read or write
 * anything else. Null when MCP_OID_WRITER_DATABASE_URL is unset (backfill off).
 */
export const oidWriterPool = config.oidWriterDatabaseUrl
  ? new Pool({
      connectionString: config.oidWriterDatabaseUrl,
      max: 2,
      application_name: `${config.systemSlug}-mcp-oidwriter`,
      statement_timeout: config.statementTimeoutMs,
    })
  : null;

roPool.on('error', (e) => log.error(null, 'read-only pool error', e));
auditPool?.on('error', (e) => log.error(null, 'audit pool error', e));
oidWriterPool?.on('error', (e) => log.error(null, 'oid-writer pool error', e));

export async function closePools(): Promise<void> {
  await Promise.allSettled([roPool.end(), auditPool?.end(), oidWriterPool?.end()].filter(Boolean) as Promise<void>[]);
}
