/**
 * THE SPINE (Guide Part V). Every tool call flows through this ONE runner; a
 * tool is structurally unable to skip a step. Sequence:
 *
 *   1. verify shared secret (constant-time)      → denial + audit (null user)
 *   2. extract + validate x-atlas-user-id        → denial + audit
 *   3/4. resolve user → account → ONE role       → denial + audit
 *   5. role → permissions/allow-list             → (passed to the tool body)
 *   6. execute tool body READ-ONLY (stmt timeout)→ friendly error + audit
 *   7. mask/omit + row/byte caps + truncated     → (handled by the tool/envelope)
 *   8. write audit row; ONLY THEN return         → 'unavailable' if audit fails
 *
 * Denials/errors are returned as NORMAL tool results whose text is one of the
 * three approved strings. No exception/driver/parser message ever reaches the
 * agent (Guide 5.1).
 */
import type { PoolClient } from 'pg';
import { Role } from '@accounting-saas/shared';
import { roPool } from './db/pools.js';
import { config } from './config.js';
import { log } from './logging.js';
import { parseIdentity } from './http/headers.js';
import { isValidAgentKey } from './auth/secret.js';
import { resolvePrincipal } from './auth/roleResolver.js';
import { permissionsFor, type Permissions } from './permissions/mapping.js';
import { writeAudit, type AuditRow } from './audit/audit.js';
import { buildEnvelope } from './envelope.js';
import { allow as rateAllow } from './rateLimit.js';
import { GuardRejectError } from './errors.js';
import { denialMessage, guardRejectMessage, internalErrorMessage, textResult } from './responses.js';

export interface ToolContext {
  userId: string;
  role: Role;
  tenantId: string;
  perms: Permissions;
  requestId: string | null;
  /** Runs a query on the read-only connection inside the RO txn (object rows). */
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; fields: { name: string }[] }>;
  /** Same, but returns positional array rows (for the escape hatch's arbitrary columns). */
  queryArray: (text: string) => Promise<{ rows: unknown[][]; fields: { name: string }[] }>;
}

export type WorkResult =
  | { type: 'table'; columns: string[]; rows: unknown[][]; relations: string[]; asOf?: string }
  | { type: 'doc'; json: unknown; relations: string[] };

export type Work = (ctx: ToolContext) => Promise<WorkResult>;

interface Extra {
  requestInfo?: { headers?: Record<string, string | string[] | undefined> };
}

type ToolResult = { content: Array<{ type: 'text'; text: string }> };

export async function run(extra: Extra, tool: string, queryText: string | null, work: Work): Promise<ToolResult> {
  const id = parseIdentity(extra?.requestInfo?.headers);
  const reqId = id.requestId;

  // Audit BEFORE returning. If the audit write fails, return 'unavailable' — not
  // data — and ALERT (audit-write failure must page, not silently deny).
  const auditAndReturn = async (row: AuditRow, text: string): Promise<ToolResult> => {
    try {
      await writeAudit(row);
    } catch (e) {
      log.alert(reqId, 'AUDIT WRITE FAILED — returning unavailable', e);
      return textResult(internalErrorMessage(reqId));
    }
    return textResult(text);
  };

  const deny = (userEmail: string | null, role: string | null, reason: string) =>
    auditAndReturn(
      { requestId: reqId, userEmail, role, tool, queryText, relations: null, rowCount: null, outcome: 'denied', denyReason: reason },
      denialMessage(),
    );

  // 1. Shared secret. Duplicated identity headers = smuggling → deny (null user).
  if (id.duplicated || !isValidAgentKey(id.agentKey)) {
    return deny(null, null, id.duplicated ? 'duplicate identity header' : 'bad agent key');
  }

  // 2. User id present + well-formed?
  if (!id.userId) return deny(null, null, 'no user identity');
  const userId = id.userId;

  // 3/4. Resolve to ONE role + tenant (local mirror, cached <= 60s).
  const resolved = await resolvePrincipal(userId, reqId);
  if (!resolved.ok) return deny(userId, null, resolved.reason);
  const { role, tenantId } = resolved.principal;

  // Per-user rate limit → fast friendly error, not a hang.
  if (!rateAllow(userId)) {
    return auditAndReturn(
      { requestId: reqId, userEmail: userId, role, tool, queryText, relations: null, rowCount: null, outcome: 'error', denyReason: 'rate limit' },
      internalErrorMessage(reqId),
    );
  }

  // 5. Permissions/allow-list for this call.
  const perms = permissionsFor(role);

  // 6. Execute READ-ONLY with a statement timeout. Everything below stays server-side.
  let result: WorkResult;
  let client: PoolClient | undefined;
  try {
    client = await roPool.connect();
    await client.query('BEGIN');
    await client.query('SET TRANSACTION READ ONLY');
    await client.query(`SET LOCAL statement_timeout = ${Number(config.statementTimeoutMs)}`);
    const ctx: ToolContext = {
      userId,
      role,
      tenantId,
      perms,
      requestId: reqId,
      query: (text, params) => client!.query(text, params) as Promise<{ rows: any[]; fields: { name: string }[] }>,
      queryArray: (text) => client!.query({ text, rowMode: 'array' }) as Promise<{ rows: unknown[][]; fields: { name: string }[] }>,
    };
    result = await work(ctx);
    await client.query('COMMIT');
  } catch (e) {
    if (client) await client.query('ROLLBACK').catch(() => undefined);
    // Guard rejections are an expected ACL outcome, not an internal error.
    if (e instanceof GuardRejectError) {
      return auditAndReturn(
        { requestId: reqId, userEmail: userId, role, tool, queryText, relations: null, rowCount: null, outcome: 'denied', denyReason: `guard: ${e.reason}` },
        guardRejectMessage(),
      );
    }
    log.error(reqId, `tool ${tool} failed`, e); // full detail (incl. any driver/SQL text) stays HERE
    return auditAndReturn(
      { requestId: reqId, userEmail: userId, role, tool, queryText, relations: null, rowCount: null, outcome: 'error', denyReason: 'internal' },
      internalErrorMessage(reqId),
    );
  } finally {
    if (client) client.release();
  }

  // 7 + 8. Shape output, then audit BEFORE returning.
  if (result.type === 'doc') {
    return auditAndReturn(
      { requestId: reqId, userEmail: userId, role, tool, queryText, relations: result.relations, rowCount: null, outcome: 'ok', denyReason: null },
      JSON.stringify(result.json),
    );
  }
  const { text, envelope } = buildEnvelope(result.columns, result.rows, {
    rowCap: config.rowCap,
    byteCap: config.byteCap,
    asOf: result.asOf,
  });
  return auditAndReturn(
    { requestId: reqId, userEmail: userId, role, tool, queryText, relations: result.relations, rowCount: envelope.row_count, outcome: 'ok', denyReason: null },
    text,
  );
}
