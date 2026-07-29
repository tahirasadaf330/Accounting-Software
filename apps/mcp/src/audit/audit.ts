/**
 * Append-only audit log (Guide 3.6). One row per tool call — including denials
 * and bad-secret probes — written BEFORE data is returned. The audit table is
 * written by a separate INSERT-only account; the read-only account has no grants
 * on it. If this write fails, the caller returns 'unavailable', NOT data.
 */
import { auditPool } from '../db/pools.js';
import { config } from '../config.js';

export interface AuditRow {
  requestId: string | null;
  userEmail: string | null;
  role: string | null;
  tool: string;
  queryText: string | null;
  relations: string[] | null;
  rowCount: number | null;
  outcome: 'ok' | 'denied' | 'error';
  denyReason: string | null;
}

/** Remove secret-shaped values before persisting query text. */
function scrub(text: string | null): string | null {
  if (!text) return text;
  let out = text;
  for (const secret of [config.secret, config.secretOld]) {
    if (secret) out = out.split(secret).join('[redacted]');
  }
  return out;
}

export async function writeAudit(row: AuditRow): Promise<void> {
  await auditPool.query(
    `INSERT INTO mcp_audit_log
       (request_id, user_email, role, tool, query_text, relations, row_count, outcome, deny_reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      row.requestId,
      row.userEmail,
      row.role,
      row.tool,
      scrub(row.queryText),
      row.relations,
      row.rowCount,
      row.outcome,
      row.denyReason,
    ],
  );
}
