/**
 * Data access uses a SECOND datasource logged in as the SELECT-only account —
 * NEVER the app's read-write pool (Guide 4.2). A separate INSERT-only pool
 * writes the audit log. Both pools are small so AI traffic can't starve the app.
 */
import { Pool } from 'pg';
import { config } from '../config.js';
import { log } from '../logging.js';

/** Read-only datasource (atlas_mcp — SELECT-only, default_transaction_read_only). */
export const roPool = new Pool({
  connectionString: config.roDatabaseUrl,
  max: config.poolMax,
  application_name: `${config.systemSlug}-mcp-ro`,
  statement_timeout: config.statementTimeoutMs,
  idle_in_transaction_session_timeout: config.statementTimeoutMs,
});

/** Audit writer datasource (INSERT-only on mcp_audit_log, no other grants). */
export const auditPool = new Pool({
  connectionString: config.auditDatabaseUrl,
  max: 4,
  application_name: `${config.systemSlug}-mcp-audit`,
  statement_timeout: config.statementTimeoutMs,
});

roPool.on('error', (e) => log.error(null, 'read-only pool error', e));
auditPool.on('error', (e) => log.error(null, 'audit pool error', e));

export async function closePools(): Promise<void> {
  await Promise.allSettled([roPool.end(), auditPool.end()]);
}
