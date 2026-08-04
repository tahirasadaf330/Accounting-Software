/**
 * The audit block your MCP returns on EVERY response (Hayo MCP Integration Spec
 * §4). Atlas stores it. Field names / outcome values are FIXED — Atlas parses
 * these into one shared table across every MCP, so they must match exactly.
 */
import { config, SESSION_TIME_ZONE } from '../config.js';

export type Outcome = 'ok' | 'denied' | 'error';

export type DenyReason =
  | 'bad_token'
  | 'token_expired'
  | 'token_replayed'
  | 'no_account'
  | 'ambiguous_account'
  | 'no_permission'
  | 'not_allowed_operation'
  | 'rate_limited';

export interface AuditSubject {
  oid: string | null;
  email: string | null;
  matched_by: 'oid' | 'email' | null;
  local_user_id?: string | null;
}

export interface AuditBlock {
  schema_version: 1;
  system: string;
  tool: string;
  outcome: Outcome;
  deny_reason: DenyReason | null;
  subject: AuditSubject;
  correlation_id: string;
  operation: { kind: string; statement: string | null };
  relations_touched: string[];
  row_count: number | null;
  columns_masked?: string[];
  duration_ms: number;
  server_time: string;
  timezone: string; // zone the DB session (and thus date filters/aging) resolved in
  detail?: Record<string, unknown>;
}

const MAX_STMT = 4000;
const MAX_RELATIONS = 50;

/** Strip secret-shaped values from the reported statement (assume it is stored). */
export function scrubStatement(text: string | null): string | null {
  if (!text) return text;
  let out = text.replace(/\b(password|secret|token|api[_-]?key|pwd)\b\s*=\s*'[^']*'/gi, "$1='[redacted]'");
  if (out.length > MAX_STMT) out = out.slice(0, MAX_STMT) + ' …[truncated]';
  return out;
}

export interface BuildArgs {
  tool: string;
  kind: string;
  outcome: Outcome;
  denyReason?: DenyReason | null;
  subject: AuditSubject;
  correlationId: string;
  statement: string | null;
  relations: string[];
  rowCount: number | null;
  columnsMasked?: string[];
  startMs: number;
  detail?: Record<string, unknown>;
}

export function buildAuditBlock(a: BuildArgs): AuditBlock {
  const relations = (a.relations ?? []).slice(0, MAX_RELATIONS);
  const block: AuditBlock = {
    schema_version: 1,
    system: config.systemSlug,
    tool: a.tool,
    outcome: a.outcome,
    deny_reason: a.denyReason ?? null,
    subject: a.subject,
    correlation_id: a.correlationId,
    operation: { kind: a.kind, statement: scrubStatement(a.statement) },
    relations_touched: relations,
    row_count: a.rowCount,
    duration_ms: Math.max(0, Date.now() - a.startMs),
    server_time: new Date().toISOString(), // ISO-8601 UTC (ends with Z)
    timezone: SESSION_TIME_ZONE, // matches the runner's SET LOCAL TIME ZONE
  };
  if (a.columnsMasked && a.columnsMasked.length) block.columns_masked = a.columnsMasked;
  if ((a.relations ?? []).length > MAX_RELATIONS) block.detail = { ...(a.detail ?? {}), relations_truncated: true };
  else if (a.detail && Object.keys(a.detail).length) block.detail = a.detail;
  return block;
}
