/**
 * Tier 2 — curated tools (Guide 6.2). Each is a thin closure over the Part-V
 * runner. Parameters are ENUMS/scalars mapped server-side to real columns;
 * callers never pass table or column names. Every query is tenant-scoped
 * (WHERE "tenantId" = $1) and passes through requireTables() for the allow-list.
 * Monetary values stay decimal strings (numeric) — never floats.
 */
import type { ToolContext, WorkResult } from '../runner.js';
import { clampInt, parseDate, requireTables, requireUnmasked, datasetFreshness } from './shared.js';

type Args = Record<string, unknown>;
const asOfStamp = (d: string): string => `${d}T00:00:00Z`;

// ── Aging (invoice-based, gross of netting) ──────────────────────────────────
async function aging(ctx: ToolContext, args: Args, voucherType: 'SALES' | 'PURCHASE'): Promise<WorkResult> {
  requireTables(ctx.perms, ['vouchers', 'payment_allocations', 'contacts']);
  const asOf = parseDate(args.as_of);
  const params: unknown[] = [ctx.tenantId, asOf];
  let contactFilter = '';
  if (typeof args.contact === 'string' && args.contact.trim()) {
    params.push(`%${args.contact.trim()}%`);
    contactFilter = ` AND ct.name ILIKE $${params.length}`;
  }
  const sql = `
    WITH inv AS (
      SELECT
        (v."totalAmount" - COALESCE(
          (SELECT sum(pa.amount) FROM payment_allocations pa
            WHERE pa."invoiceVoucherId" = v.id AND pa."paidAt"::date <= $2::date), 0)) AS outstanding,
        ($2::date - (v.date + (COALESCE(ct."paymentTermDays", 0) || ' days')::interval)::date) AS days_overdue
      FROM vouchers v
      JOIN contacts ct ON ct.id = v."contactId"
      WHERE v."tenantId" = $1 AND v."voucherType" = '${voucherType}' AND v.status = 'POSTED'
        AND v.date <= $2::date${contactFilter}
    )
    SELECT
      CASE WHEN days_overdue <= 0 THEN 'current'
           WHEN days_overdue <= 30 THEN '1-30'
           WHEN days_overdue <= 60 THEN '31-60'
           WHEN days_overdue <= 90 THEN '61-90'
           ELSE '91+' END AS bucket,
      count(*)::int AS invoices,
      round(sum(outstanding), 4)::text AS outstanding_usd
    FROM inv
    WHERE outstanding > 0
    GROUP BY 1
    ORDER BY min(days_overdue)`;
  const { rows } = await ctx.query(sql, params);
  return {
    type: 'table',
    columns: ['bucket', 'invoices', 'outstanding_usd'],
    rows: rows.map((r) => [r.bucket, r.invoices, r.outstanding_usd]),
    relations: ['vouchers', 'payment_allocations', 'contacts'],
    asOf: asOfStamp(asOf),
  };
}

export const arAging = (ctx: ToolContext, args: Args) => aging(ctx, args, 'SALES');
export const apAging = (ctx: ToolContext, args: Args) => aging(ctx, args, 'PURCHASE');

// ── Top contacts (ledger-based net balance) ──────────────────────────────────
export async function topContacts(ctx: ToolContext, args: Args): Promise<WorkResult> {
  requireTables(ctx.perms, ['contacts', 'accounts', 'journal_entry_lines', 'journal_entries']);
  const metric = args.metric === 'payable' ? 'payable' : 'receivable';
  const n = clampInt(args.n, 10, 1, 50);
  const asOf = parseDate(args.as_of);
  const cmp = metric === 'receivable' ? '> 0' : '< 0';
  const dir = metric === 'receivable' ? 'DESC' : 'ASC';
  const sql = `
    SELECT ct.name AS contact,
           round(abs(sum(jl."baseCurrencyDebit" - jl."baseCurrencyCredit")), 4)::text AS amount_usd
    FROM contacts ct
    JOIN accounts a ON a.id = ct."accountId"
    JOIN journal_entry_lines jl ON jl."accountId" = a.id AND jl."tenantId" = $1
    JOIN journal_entries je ON je.id = jl."journalEntryId"
    WHERE ct."tenantId" = $1 AND je."entryDate" <= $2::date
    GROUP BY ct.id, ct.name
    HAVING sum(jl."baseCurrencyDebit" - jl."baseCurrencyCredit") ${cmp}
    ORDER BY sum(jl."baseCurrencyDebit" - jl."baseCurrencyCredit") ${dir}
    LIMIT ${n}`;
  const { rows } = await ctx.query(sql, [ctx.tenantId, asOf]);
  const col = metric === 'receivable' ? 'receivable_usd' : 'payable_usd';
  return {
    type: 'table',
    columns: ['contact', col],
    rows: rows.map((r) => [r.contact, r.amount_usd]),
    relations: ['contacts', 'accounts', 'journal_entry_lines'],
    asOf: asOfStamp(asOf),
  };
}

// ── Statement of account (one contact, ledger-based) ─────────────────────────
export async function contactStatement(ctx: ToolContext, args: Args): Promise<WorkResult> {
  requireTables(ctx.perms, ['contacts', 'accounts', 'journal_entry_lines', 'journal_entries']);
  const q = String(args.contact ?? '').trim();
  const rels = ['contacts', 'accounts', 'journal_entry_lines'];

  const find = async (pattern: string, like: boolean) =>
    (
      await ctx.query(
        `SELECT ct.id, ct."accountId" AS acct, ct.name, a."normalBalance" AS nb
           FROM contacts ct JOIN accounts a ON a.id = ct."accountId"
          WHERE ct."tenantId" = $1 AND ${like ? 'ct.name ILIKE $2' : 'lower(ct.name) = lower($2)'}`,
        [ctx.tenantId, pattern],
      )
    ).rows;

  let matches = await find(q, false);
  if (matches.length === 0) matches = await find(`%${q}%`, true);

  if (matches.length === 0) {
    return { type: 'table', columns: ['date', 'voucher', 'narration', 'debit', 'credit', 'balance', 'nature'], rows: [], relations: rels };
  }
  if (matches.length > 1) {
    // Disambiguation: return the candidate names so the caller can refine.
    return { type: 'table', columns: ['matched_contact'], rows: matches.slice(0, 25).map((m) => [m.name]), relations: ['contacts'] };
  }

  const contact = matches[0] as { acct: string; name: string; nb: string };
  const isDebitNormal = contact.nb === 'DEBIT';
  const to = parseDate(args.to);
  const from = parseDate(args.from, `${to.slice(0, 4)}-01-01`);

  const open = await ctx.query(
    `SELECT COALESCE(sum(jl."baseCurrencyDebit"), 0) AS dr, COALESCE(sum(jl."baseCurrencyCredit"), 0) AS cr
       FROM journal_entry_lines jl JOIN journal_entries je ON je.id = jl."journalEntryId"
      WHERE jl."tenantId" = $1 AND jl."accountId" = $2 AND je."entryDate" < $3::date`,
    [ctx.tenantId, contact.acct, from],
  );
  const openingDr = Number(open.rows[0].dr);
  const openingCr = Number(open.rows[0].cr);
  const opening = isDebitNormal ? openingDr - openingCr : openingCr - openingDr;

  const period = await ctx.query(
    `WITH lines AS (
       SELECT je."entryDate" AS d, v."voucherNumber" AS vn,
              COALESCE(jl.narration, je.narration) AS narr,
              jl."baseCurrencyDebit" AS dr, jl."baseCurrencyCredit" AS cr, jl."createdAt" AS cat
         FROM journal_entry_lines jl
         JOIN journal_entries je ON je.id = jl."journalEntryId"
         LEFT JOIN vouchers v ON v.id = je."voucherId"
        WHERE jl."tenantId" = $1 AND jl."accountId" = $2
          AND je."entryDate" >= $3::date AND je."entryDate" <= $4::date
     )
     SELECT to_char(d, 'YYYY-MM-DD') AS date, vn, narr, dr::text, cr::text,
            ($5::numeric + sum(CASE WHEN $6::bool THEN dr - cr ELSE cr - dr END)
              OVER (ORDER BY d, cat ROWS UNBOUNDED PRECEDING)) AS signed_balance
       FROM lines ORDER BY d, cat`,
    [ctx.tenantId, contact.acct, from, to, opening.toFixed(4), isDebitNormal],
  );

  const nature = (signed: number): string => (Math.abs(signed) < 0.00005 ? 'Settled' : signed > 0 ? 'Receivable' : 'Payable');
  const rows: unknown[][] = [
    ['(opening)', '', `Opening balance as of ${from}`, '', '', Math.abs(opening).toFixed(4), nature(opening)],
  ];
  for (const r of period.rows as Array<Record<string, string>>) {
    const signed = Number(r.signed_balance);
    rows.push([r.date, r.vn ?? '', r.narr ?? '', r.dr, r.cr, Math.abs(signed).toFixed(4), nature(signed)]);
  }
  return {
    type: 'table',
    columns: ['date', 'voucher', 'narration', 'debit', 'credit', 'balance', 'nature'],
    rows,
    relations: rels,
    asOf: asOfStamp(to),
  };
}

// ── Voucher activity summary ─────────────────────────────────────────────────
export async function voucherSummary(ctx: ToolContext, args: Args): Promise<WorkResult> {
  requireTables(ctx.perms, ['vouchers']);
  const days = clampInt(args.days, 30, 1, 365);
  const params: unknown[] = [ctx.tenantId];
  let filter = '';
  if (typeof args.voucher_type === 'string' && args.voucher_type) {
    params.push(args.voucher_type);
    filter += ` AND "voucherType" = $${params.length}`;
  }
  if (typeof args.status === 'string' && args.status) {
    params.push(args.status);
    filter += ` AND status = $${params.length}`;
  }
  const sql = `
    SELECT "voucherType" AS voucher_type, status,
           count(*)::int AS count, round(sum("totalAmount"), 4)::text AS total_usd
    FROM vouchers
    WHERE "tenantId" = $1 AND date >= (CURRENT_DATE - ${days})${filter}
    GROUP BY 1, 2 ORDER BY 1, 2`;
  const { rows } = await ctx.query(sql, params);
  return {
    type: 'table',
    columns: ['voucher_type', 'status', 'count', 'total_usd'],
    rows: rows.map((r) => [r.voucher_type, r.status, r.count, r.total_usd]),
    relations: ['vouchers'],
  };
}

// ── Credit-limit monitor (needs unmasked creditLimit) ────────────────────────
export async function creditLimitStatus(ctx: ToolContext, args: Args): Promise<WorkResult> {
  requireTables(ctx.perms, ['contacts', 'accounts', 'journal_entry_lines', 'journal_entries']);
  requireUnmasked(ctx.perms, 'contacts', ['creditLimit']);
  const threshold = clampInt(args.threshold, 80, 0, 1000);
  const sql = `
    WITH bal AS (
      SELECT ct.name, ct."creditLimit" AS lim,
             sum(jl."baseCurrencyDebit" - jl."baseCurrencyCredit") AS net
      FROM contacts ct
      JOIN accounts a ON a.id = ct."accountId"
      JOIN journal_entry_lines jl ON jl."accountId" = a.id AND jl."tenantId" = $1
      WHERE ct."tenantId" = $1 AND ct."creditLimit" IS NOT NULL AND ct."creditLimit" > 0
      GROUP BY ct.id, ct.name, ct."creditLimit"
    )
    SELECT name AS contact, round(lim, 4)::text AS credit_limit_usd,
           round(greatest(net, 0), 4)::text AS receivable_usd,
           round(greatest(net, 0) / lim * 100, 1)::text AS utilization_pct
    FROM bal
    WHERE greatest(net, 0) / lim * 100 >= ${threshold}
    ORDER BY greatest(net, 0) / lim DESC`;
  const { rows } = await ctx.query(sql, [ctx.tenantId]);
  return {
    type: 'table',
    columns: ['contact', 'credit_limit_usd', 'receivable_usd', 'utilization_pct'],
    rows: rows.map((r) => [r.contact, r.credit_limit_usd, r.receivable_usd, r.utilization_pct]),
    relations: ['contacts', 'accounts', 'journal_entry_lines'],
  };
}

// ── Netting cycle status ─────────────────────────────────────────────────────
export async function nettingStatus(ctx: ToolContext, args: Args): Promise<WorkResult> {
  requireTables(ctx.perms, ['netting_cycles', 'contacts']);
  const params: unknown[] = [ctx.tenantId];
  let filter = '';
  if (typeof args.status === 'string' && args.status) {
    params.push(args.status);
    filter = ` AND nc.status = $${params.length}`;
  }
  const sql = `
    SELECT ct.name AS contact, nc.status,
           to_char(nc."startDate", 'YYYY-MM-DD') AS start_date,
           to_char(nc."endDate", 'YYYY-MM-DD') AS end_date,
           to_char(nc."dueDate", 'YYYY-MM-DD') AS due_date
    FROM netting_cycles nc JOIN contacts ct ON ct.id = nc."contactId"
    WHERE nc."tenantId" = $1${filter}
    ORDER BY nc."startDate" DESC`;
  const { rows } = await ctx.query(sql, params);
  return {
    type: 'table',
    columns: ['contact', 'status', 'start_date', 'end_date', 'due_date'],
    rows: rows.map((r) => [r.contact, r.status, r.start_date, r.end_date, r.due_date]),
    relations: ['netting_cycles', 'contacts'],
  };
}

// ── Trial balance (ledger-based) ─────────────────────────────────────────────
export async function trialBalance(ctx: ToolContext, args: Args): Promise<WorkResult> {
  requireTables(ctx.perms, ['accounts', 'journal_entry_lines', 'journal_entries']);
  const asOf = parseDate(args.as_of);
  const sql = `
    SELECT a.code AS account_code, a.name AS account_name, a."accountType" AS account_type,
           round(CASE WHEN net > 0 THEN net ELSE 0 END, 4)::text AS debit_usd,
           round(CASE WHEN net < 0 THEN -net ELSE 0 END, 4)::text AS credit_usd
    FROM (
      SELECT jl."accountId",
             sum(jl."baseCurrencyDebit") - sum(jl."baseCurrencyCredit") AS net
      FROM journal_entry_lines jl
      JOIN journal_entries je ON je.id = jl."journalEntryId"
      WHERE jl."tenantId" = $1 AND je."entryDate" <= $2::date
      GROUP BY jl."accountId"
    ) t
    JOIN accounts a ON a.id = t."accountId"
    ORDER BY a.code`;
  const { rows } = await ctx.query(sql, [ctx.tenantId, asOf]);
  return {
    type: 'table',
    columns: ['account_code', 'account_name', 'account_type', 'debit_usd', 'credit_usd'],
    rows: rows.map((r) => [r.account_code, r.account_name, r.account_type, r.debit_usd, r.credit_usd]),
    relations: ['accounts', 'journal_entry_lines'],
    asOf: asOfStamp(asOf),
  };
}

// ── Dataset freshness / health ───────────────────────────────────────────────
export async function dataFreshness(ctx: ToolContext, _args: Args): Promise<WorkResult> {
  const rows: unknown[][] = [];
  for (const d of ctx.perms.datasets) {
    rows.push([d.name, (await datasetFreshness(ctx, d.name)) ?? 'n/a']);
  }
  return {
    type: 'table',
    columns: ['dataset', 'last_refresh'],
    rows,
    relations: [...ctx.perms.allowedTables],
  };
}
