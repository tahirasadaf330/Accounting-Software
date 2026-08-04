/**
 * THE SPINE (Hayo MCP Integration Spec). Every tool call flows through this one
 * runner; a tool cannot skip a step. Sequence:
 *
 *   1. verify the Atlas JWT (signature/RS256, iss, aud, exp/nbf, jti-replay, oid)
 *   2/3. resolve identity → local user + role (oid → email → backfill)
 *   4. rate-limit per subject
 *   5. execute READ-ONLY inside a txn with a statement timeout
 *   6. return { result | error, audit } — the audit block is ALWAYS included
 *
 * Denials/errors are normal results whose JSON carries `error` + `audit`. No
 * exception/driver/parser text ever reaches the caller.
 */
import type { PoolClient } from 'pg';
import { Role } from '@accounting-saas/shared';
import { roPool } from './db/pools.js';
import { config } from './config.js';
import { log } from './logging.js';
import { verifyToken } from './auth/jwt.js';
import { resolvePrincipal } from './auth/roleResolver.js';
import { permissionsFor, type Permissions } from './permissions/mapping.js';
import { buildEnvelope } from './envelope.js';
import { allow as rateAllow } from './rateLimit.js';
import { GuardRejectError } from './errors.js';
import { denialMessage, errorMessage, textResult } from './responses.js';
import { buildAuditBlock, type AuditSubject, type DenyReason, type Outcome } from './audit/block.js';
import { writeLocalAudit } from './audit/audit.js';

export interface ToolContext {
  role: Role;
  tenantId: string;
  perms: Permissions;
  correlationId: string;
  /** Read-only query (object rows). Text is captured for operation.statement. */
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; fields: { name: string }[] }>;
  /** Read-only query returning positional rows (escape hatch). */
  queryArray: (text: string) => Promise<{ rows: unknown[][]; fields: { name: string }[] }>;
}

export type WorkResult =
  | { type: 'table'; columns: string[]; rows: unknown[][]; relations: string[]; asOf?: string; currency?: string }
  | { type: 'doc'; json: unknown; relations: string[] };

export type Work = (ctx: ToolContext) => Promise<WorkResult>;

interface Extra {
  requestInfo?: { headers?: Record<string, string | string[] | undefined> };
}
type ToolResult = { content: Array<{ type: 'text'; text: string }> };

function header(headers: Record<string, string | string[] | undefined> | undefined, name: string): string | undefined {
  const v = headers?.[name] ?? headers?.[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
}

function maskedForRelations(perms: Permissions, relations: string[]): string[] {
  const rel = new Set(relations.map((r) => r.toLowerCase()));
  const out: string[] = [];
  for (const key of perms.maskedColumns) {
    const [t] = key.split('.');
    if (rel.has(t)) out.push(key);
  }
  return out;
}

export async function run(extra: Extra, tool: string, work: Work): Promise<ToolResult> {
  const start = Date.now();
  const kind = tool.endsWith('_describe') ? 'describe' : 'sql_select';
  const headers = extra?.requestInfo?.headers;

  interface FinalizeArgs {
    outcome: Outcome;
    denyReason?: DenyReason | null;
    subject: AuditSubject;
    correlationId: string;
    statement: string | null;
    relations: string[];
    rowCount: number | null;
    columnsMasked?: string[];
    detail?: Record<string, unknown>;
  }
  const finalize = async (payload: { result: unknown } | { error: string }, a: FinalizeArgs): Promise<ToolResult> => {
    const audit = buildAuditBlock({ tool, kind, startMs: start, ...a });
    void writeLocalAudit(audit).catch((e) => log.warn(a.correlationId, 'local audit write failed (non-fatal)', e));
    return textResult(JSON.stringify({ ...payload, audit }));
  };
  const deny = (reason: DenyReason, subject: AuditSubject, correlationId: string, detail?: Record<string, unknown>) =>
    finalize(
      { error: denialMessage(reason) },
      { outcome: 'denied', denyReason: reason, subject, correlationId, statement: null, relations: [], rowCount: null, detail },
    );

  // 1. Verify the Atlas token. Nothing is trusted until this passes.
  const verified = await verifyToken(header(headers, 'authorization'));
  if (!verified.ok) {
    return deny(verified.reason, { oid: null, email: null, matched_by: null }, 'unknown', { check_failed: verified.reason });
  }
  const claims = verified.claims;
  const correlationId = claims.correlationId;

  // 2/3. Resolve to a local user + role.
  const resolved = await resolvePrincipal(claims, correlationId);
  if (!resolved.ok) {
    return deny(resolved.reason, { oid: claims.oid, email: claims.email, matched_by: null }, correlationId);
  }
  const principal = resolved.principal;
  const subject: AuditSubject = {
    oid: principal.oid,
    email: principal.email,
    matched_by: principal.matchedBy,
    local_user_id: principal.localUserId,
  };

  // 4. Rate limit per subject.
  if (!rateAllow(principal.oid)) return deny('rate_limited', subject, correlationId);

  const perms = permissionsFor(principal.role);
  const executed: string[] = [];

  // 5. Execute READ-ONLY with a statement timeout.
  let result: WorkResult;
  let client: PoolClient | undefined;
  try {
    client = await roPool.connect();
    await client.query('BEGIN');
    await client.query('SET TRANSACTION READ ONLY');
    await client.query(`SET LOCAL statement_timeout = ${Number(config.statementTimeoutMs)}`);
    const ctx: ToolContext = {
      role: principal.role,
      tenantId: principal.tenantId,
      perms,
      correlationId,
      query: (text, params) => {
        executed.push(text);
        return client!.query(text, params) as Promise<{ rows: any[]; fields: { name: string }[] }>;
      },
      queryArray: (text) => {
        executed.push(text);
        return client!.query({ text, rowMode: 'array' }) as Promise<{ rows: unknown[][]; fields: { name: string }[] }>;
      },
    };
    result = await work(ctx);
    await client.query('COMMIT');
  } catch (e) {
    if (client) await client.query('ROLLBACK').catch(() => undefined);
    const statement = executed.length ? executed.join(';\n') : null;
    if (e instanceof GuardRejectError) {
      return finalize(
        { error: denialMessage('not_allowed_operation') },
        { outcome: 'denied', denyReason: 'not_allowed_operation', subject, correlationId, statement, relations: [], rowCount: null, detail: { reason: e.reason, role: principal.role } },
      );
    }
    log.error(correlationId, `tool ${tool} failed`, e); // full detail stays server-side
    return finalize(
      { error: errorMessage() },
      { outcome: 'error', subject, correlationId, statement, relations: [], rowCount: null, detail: { role: principal.role } },
    );
  } finally {
    if (client) client.release();
  }

  // 6. Shape result + always return the audit block.
  const statement = executed.length ? executed.join(';\n') : null;
  const columnsMasked = maskedForRelations(perms, result.relations);
  if (result.type === 'doc') {
    return finalize(
      { result: result.json },
      { outcome: 'ok', subject, correlationId, statement, relations: result.relations, rowCount: null, columnsMasked, detail: { role: principal.role, matched_by: principal.matchedBy } },
    );
  }
  const { envelope } = buildEnvelope(result.columns, result.rows, {
    rowCap: config.rowCap,
    byteCap: config.byteCap,
    asOf: result.asOf,
    currency: result.currency,
  });
  return finalize(
    { result: envelope },
    { outcome: 'ok', subject, correlationId, statement, relations: result.relations, rowCount: envelope.row_count, columnsMasked, detail: { role: principal.role, matched_by: principal.matchedBy } },
  );
}
