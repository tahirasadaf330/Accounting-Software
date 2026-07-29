/**
 * Tier 3 — the guarded query escape hatch (Guide 6.3). ONE read-only SELECT per
 * call. The SQL guard (sqlGuard.ts) parses, walks the full tree, rejects anything
 * outside a single read-only SELECT over the caller's allow-list, and injects a
 * tenant predicate on every tenant-scoped base table. Prefer curated tools for
 * common shapes — THIS IS THE ESCAPE HATCH.
 */
import { GuardRejectError } from '../errors.js';
import { config } from '../config.js';
import type { ToolContext, WorkResult } from '../runner.js';
import { guardAndRewrite } from './sqlGuard.js';

export async function query(ctx: ToolContext, args: Record<string, unknown>): Promise<WorkResult> {
  const sql = String(args.sql ?? '').trim();
  if (!sql) throw new GuardRejectError('empty query');

  const { sql: finalSql, relations } = guardAndRewrite(sql, ctx.perms, ctx.tenantId, config.rowCap);

  const res = await ctx.queryArray(finalSql);
  const columns = res.fields.map((f) => f.name);
  return { type: 'table', columns, rows: res.rows, relations };
}
