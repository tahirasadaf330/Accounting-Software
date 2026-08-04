/**
 * OPTIONAL local audit copy. Under the Hayo spec, Atlas is the single logger and
 * we RETURN the audit block (see block.ts). Keeping a local append-only copy is a
 * convenience for our own ops — so it is BEST-EFFORT: if it fails we log and move
 * on (we never block the response on it, because Atlas already has the block).
 */
import { auditPool } from '../db/pools.js';
import type { AuditBlock } from './block.js';

export async function writeLocalAudit(block: AuditBlock): Promise<void> {
  if (!auditPool) return; // local copy disabled
  await auditPool.query(
    `INSERT INTO mcp_audit_log
       (request_id, user_email, role, tool, query_text, relations, row_count, outcome, deny_reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      block.correlation_id,
      block.subject.email,
      (block.detail?.role as string | undefined) ?? null,
      block.tool,
      block.operation.statement,
      block.relations_touched,
      block.row_count,
      block.outcome,
      block.deny_reason,
    ],
  );
}
