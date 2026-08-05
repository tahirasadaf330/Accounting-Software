/**
 * Tier 1 — describe (Guide 6.1 / A.2). Returns the caller-scoped catalog + domain
 * primer: ONLY the datasets the role allows, with real table/column names, the
 * caller's masked columns, and LIVE last_refresh per dataset. Columns are read
 * from information_schema (so they can't drift), minus this role's masked ones.
 *
 * Critical domain rules live HERE (not in any agent prompt): currency, what
 * "outstanding" means, and the netting caveat.
 */
import { config } from '../config.js';
import { isMasked } from '../permissions/mapping.js';
import type { ToolContext, WorkResult } from '../runner.js';
import { datasetFreshness } from './shared.js';

const GLOSSARY: Record<string, string> = {
  voucher: 'A single accounting document. Invoices, bills, payments and receipts are all Voucher rows, discriminated by voucherType.',
  SALES: 'A customer invoice (accounts receivable).',
  PURCHASE: 'A vendor bill (accounts payable).',
  RECEIPT: 'Cash/funds received from a customer.',
  PAYMENT: 'Cash/funds paid to a vendor.',
  CREDIT_NOTE: 'A reduction of a customer invoice.',
  DEBIT_NOTE: 'A reduction of a vendor bill.',
  outstanding: 'Invoice/bill total minus payments allocated to it (invoice-based view).',
  'net balance': 'Sum of debits minus credits on a contact\'s ledger account (reflects all receipts/payments).',
  'aging bucket': 'current / 1-30 / 31-60 / 61-90 / 91+ days past the due date (invoice date + payment term).',
  'netting cycle': 'Bilateral AR/AP settlement between the company and a BOTH-type contact, with AM then CEO approval.',
  SOA: 'Statement of Account — opening balance, dated ledger movements, and running/closing balance for one contact account.',
};

const READING_NOTES = [
  "'our receivables / what are we owed' means the sum across ALL contacts, never a single customer name.",
  'AR/AP AGING tools are INVOICE-based (gross of netting): outstanding = invoice total − allocated payments. They reflect payments only where recorded as payment allocations.',
  'contact_statement and top_contacts are ACCOUNT/LEDGER-based (net debits − credits) and reflect ALL receipts/payments — use these for a contact\'s true balance.',
  'On a debit-normal account, a positive net balance is a RECEIVABLE; negative is a PAYABLE.',
  'Netting-adjusted and hierarchical (parent/child) views live in the app UI; this connector returns base-ledger figures only.',
  'Prefer the curated tools; use accounting_query only for shapes the curated tools do not cover.',
];

export async function describe(ctx: ToolContext): Promise<WorkResult> {
  const allowedTables = [...ctx.perms.allowedTables];

  // Introspect real columns for the allow-listed tables (drift-proof).
  const colsByTable = new Map<string, string[]>();
  if (allowedTables.length > 0) {
    const { rows } = await ctx.query(
      `SELECT table_name, column_name
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ANY($1)
        ORDER BY table_name, ordinal_position`,
      [allowedTables],
    );
    for (const r of rows as Array<{ table_name: string; column_name: string }>) {
      const list = colsByTable.get(r.table_name) ?? [];
      list.push(r.column_name);
      colsByTable.set(r.table_name, list);
    }
  }

  const datasets = [];
  for (const d of ctx.perms.datasets) {
    const columns: Record<string, string[]> = {};
    const maskedForYou: string[] = [];
    for (const t of d.tables) {
      const cols = colsByTable.get(t) ?? [];
      columns[t] = cols.filter((c) => {
        if (isMasked(ctx.perms, t, c)) {
          maskedForYou.push(`${t}.${c}`);
          return false;
        }
        return true;
      });
    }
    const fresh = await datasetFreshness(ctx, d.name);
    datasets.push({
      name: d.name,
      description: d.description,
      tables: d.tables,
      columns,
      masked_for_you: maskedForYou,
      last_refresh: fresh.lastRefresh,
      rows_available: fresh.rows, // 0 ⇒ dataset is empty for this tenant (a null last_refresh is expected, not a stale/broken job)
      refresh_schedule: 'live (transactional — reflects committed data at query time)',
    });
  }

  // Relationships (join/FK map) — read from real FK constraints so accounting_query
  // knows how tables connect. Drift-proof; only shows edges where BOTH tables are in
  // the caller's allow-list. Sourced from pg_catalog: the read-only role can't see
  // information_schema.constraint_column_usage (that view only shows tables it OWNS).
  const relationships: string[] = [];
  if (allowedTables.length > 0) {
    const allowSet = new Set(allowedTables);
    const strip = (t: string) => t.replace(/^public\./, '').replace(/"/g, '');
    const { rows: fks } = await ctx.query(
      `SELECT con.conrelid::regclass::text  AS from_t, att.attname  AS from_c,
              con.confrelid::regclass::text AS to_t,   att2.attname AS to_c
         FROM pg_constraint con
         JOIN pg_attribute att  ON att.attrelid  = con.conrelid  AND att.attnum  = ANY(con.conkey)
         JOIN pg_attribute att2 ON att2.attrelid = con.confrelid AND att2.attnum = ANY(con.confkey)
        WHERE con.contype = 'f' AND con.connamespace = 'public'::regnamespace
          AND array_length(con.conkey, 1) = 1
        ORDER BY 1, 2`,
    );
    for (const r of fks as Array<{ from_t: string; from_c: string; to_t: string; to_c: string }>) {
      const from = strip(r.from_t);
      const to = strip(r.to_t);
      if (allowSet.has(from) && allowSet.has(to)) relationships.push(`${from}.${r.from_c} -> ${to}.${r.to_c}`);
    }
  }

  return {
    type: 'doc',
    relations: allowedTables,
    json: {
      about: `${config.systemLabel}: read-only connector over a double-entry accounting ledger (slug: ${config.systemSlug}). Invoices, bills, payments and receipts are all Voucher rows discriminated by voucherType. You are scoped to ONE tenant and ONE role; you see only the datasets listed below.`,
      currency: "Monetary values are raw numbers (never formatted); their currency is given by each tabular result's `currency` field (USD for this tenant).",
      conventions: {
        timezone: 'UTC',
        dates: 'ISO-8601 (YYYY-MM-DD)',
        windows: 'days=N is measured against UTC now and includes today’s partial day',
        amounts: 'decimal strings with 4 places; never floats',
      },
      glossary: GLOSSARY,
      reading_notes: READING_NOTES,
      relationships,
      datasets,
    },
  };
}
