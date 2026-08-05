/**
 * Shared helpers for curated tools. Enforce allow-list + masking per call, clamp
 * caps, and compute live dataset freshness.
 */
import { GuardRejectError } from '../errors.js';
import { isMasked, type Permissions } from '../permissions/mapping.js';
import type { ToolContext } from '../runner.js';

export function clampInt(value: unknown, def: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns a YYYY-MM-DD date string; defaults to today (UTC). */
export function parseDate(value: unknown, fallback?: string): string {
  if (typeof value === 'string' && DATE_RE.test(value)) return value;
  return fallback ?? new Date().toISOString().slice(0, 10);
}

/** Every table the tool reads must be in the caller's allow-list, else guard-reject. */
export function requireTables(perms: Permissions, tables: string[]): void {
  for (const t of tables) {
    if (!perms.allowedTables.has(t.toLowerCase())) {
      throw new GuardRejectError(`table ${t} not in allow-list for role ${perms.role}`);
    }
  }
}

/** The tool needs these columns unmasked; if masked for this role, guard-reject. */
export function requireUnmasked(perms: Permissions, table: string, columns: string[]): void {
  for (const col of columns) {
    if (isMasked(perms, table, col)) {
      throw new GuardRejectError(`column ${table}.${col} masked for role ${perms.role}`);
    }
  }
}

// Representative "freshness" column per dataset (data is live-transactional; there
// is no ETL bookmark, so last_refresh = max(timestamp) on a primary table).
const FRESHNESS: Record<string, { table: string; col: string }> = {
  gl: { table: 'journal_entries', col: 'createdAt' },
  ap_ar: { table: 'vouchers', col: 'updatedAt' },
  contacts: { table: 'contacts', col: 'updatedAt' },
  banking: { table: 'bank_statements', col: 'createdAt' },
  netting: { table: 'netting_cycles', col: 'updatedAt' },
  reference: { table: 'exchange_rates', col: 'createdAt' },
};

export async function datasetFreshness(
  ctx: ToolContext,
  datasetName: string,
): Promise<{ lastRefresh: string | null; rows: number }> {
  const f = FRESHNESS[datasetName];
  if (!f) return { lastRefresh: null, rows: 0 };
  const { rows } = await ctx.query(
    `SELECT max("${f.col}") AS m, count(*)::int AS n FROM ${f.table} WHERE "tenantId" = $1`,
    [ctx.tenantId],
  );
  const m = rows[0]?.m;
  // rows=0 explains a null lastRefresh (dataset empty for this tenant), so callers
  // can tell "no data yet" apart from a broken refresh.
  return { lastRefresh: m ? new Date(m).toISOString() : null, rows: Number(rows[0]?.n ?? 0) };
}
