/**
 * Builds an McpServer and registers every tool as a thin closure over the
 * Part-V runner — the runner IS the security. A fresh server instance is created
 * per session; nothing leaks between calls. Tool names are prefixed with the
 * system slug (Guide 6.0). Docstrings are written FOR an AI (Guide 6.5): when to
 * use / when NOT, parameters with caps, output columns + units, pitfalls.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z, type ZodRawShape } from 'zod';
import { config } from '../config.js';
import { run } from '../runner.js';
import type { ToolContext, WorkResult } from '../runner.js';
import { describe } from '../tools/describe.js';
import {
  arAging,
  apAging,
  topContacts,
  contactStatement,
  voucherSummary,
  creditLimitStatus,
  nettingStatus,
  trialBalance,
  dataFreshness,
} from '../tools/curated.js';
import { query } from '../tools/query.js';

const VOUCHER_TYPES = ['SALES', 'PURCHASE', 'PAYMENT', 'RECEIPT', 'JOURNAL', 'CONTRA', 'CREDIT_NOTE', 'DEBIT_NOTE'] as const;
const VOUCHER_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'POSTED', 'REVERSED'] as const;
const NETTING_STATUSES = ['OPEN', 'PENDING_AM', 'PENDING_CEO', 'APPROVED', 'REJECTED', 'AM_REJECTED', 'CEO_REJECTED', 'PARTIAL', 'SETTLED'] as const;

// Every tool returns { data, audit } in structuredContent (Spec §2.1). `data` is
// the tabular result / describe doc, or null on a denial/error.
const OUTPUT_SCHEMA = { data: z.any(), audit: z.record(z.any()) };

export function buildServer(): McpServer {
  const server = new McpServer({ name: `${config.systemSlug}-mcp`, version: '0.2.0' });
  const slug = config.systemSlug;

  const reg = (
    name: string,
    cfg: { title: string; description: string; inputSchema: ZodRawShape },
    fn: (ctx: ToolContext, args: Record<string, unknown>) => Promise<WorkResult>,
  ): void => {
    const fullName = `${slug}_${name}`;
    server.registerTool(
      fullName,
      { ...cfg, outputSchema: OUTPUT_SCHEMA },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (args: any, extra: any) => run(extra, fullName, (ctx) => fn(ctx, (args ?? {}) as Record<string, unknown>)),
    );
  };

  // Tier 1 — describe (call first).
  server.registerTool(
    `${slug}_describe`,
    {
      title: `Describe (${slug})`,
      description:
        'CALL THIS FIRST. Returns the caller-scoped catalog + domain primer: the datasets/tables/columns you may read for THIS user, which columns are masked for you, currency and date conventions, a glossary, and reading notes (incl. the invoice-based vs ledger-based distinction). No parameters.',
      inputSchema: {},
      outputSchema: OUTPUT_SCHEMA,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (_args: any, extra: any) => run(extra, `${slug}_describe`, describe),
  );

  reg(
    'ar_aging',
    {
      title: 'Accounts receivable aging',
      description:
        'Outstanding CUSTOMER invoices (POSTED SALES) bucketed by age: current / 1-30 / 31-60 / 61-90 / 91+ days past due. USE FOR "who owes us", "overdue receivables", "AR aging". Invoice-based and GROSS of netting (see describe). For a single customer\'s true balance use accounting_contact_statement; for rankings use accounting_top_contacts. Params: as_of (YYYY-MM-DD, default today), contact (optional name substring). Output columns: bucket, invoices, outstanding_usd (USD).',
      inputSchema: {
        as_of: z.string().optional().describe('As-of date YYYY-MM-DD (UTC). Default: today.'),
        contact: z.string().optional().describe('Optional case-insensitive customer name substring filter.'),
      },
    },
    arAging,
  );

  reg(
    'ap_aging',
    {
      title: 'Accounts payable aging',
      description:
        'Outstanding VENDOR bills (POSTED PURCHASE) bucketed by age (current / 1-30 / 31-60 / 61-90 / 91+). USE FOR "what we owe", "overdue payables", "AP aging". Invoice-based and gross of netting. Params: as_of (YYYY-MM-DD, default today), contact (optional vendor name substring). Output columns: bucket, invoices, outstanding_usd (USD).',
      inputSchema: {
        as_of: z.string().optional().describe('As-of date YYYY-MM-DD (UTC). Default: today.'),
        contact: z.string().optional().describe('Optional case-insensitive vendor name substring filter.'),
      },
    },
    apAging,
  );

  reg(
    'top_contacts',
    {
      title: 'Top contacts by balance',
      description:
        'Top-N contacts by LEDGER net balance (reflects all receipts/payments). USE FOR "biggest customers we\'re owed by" (metric=receivable) or "biggest vendors we owe" (metric=payable). This is the true net balance, unlike the invoice-based aging tools. Params: metric (receivable|payable, default receivable), n (default 10, max 50), as_of (default today). Output columns: contact, receivable_usd|payable_usd (USD, absolute value).',
      inputSchema: {
        metric: z.enum(['receivable', 'payable']).default('receivable').describe('receivable = net owed TO us; payable = net WE owe.'),
        n: z.coerce.number().int().optional().describe('How many rows (default 10, max 50).'),
        as_of: z.string().optional().describe('As-of date YYYY-MM-DD (UTC). Default: today.'),
      },
    },
    topContacts,
  );

  reg(
    'contact_statement',
    {
      title: 'Statement of account',
      description:
        'Statement of Account for ONE contact: opening balance, dated ledger movements, running balance and nature (Receivable/Payable/Settled). Ledger-based (true balance). USE FOR "show me X\'s statement/ledger/history". If the name matches multiple contacts, returns a single column matched_contact so you can retry with a fuller name; if none match, returns an empty statement. Params: contact (required name), from/to (YYYY-MM-DD; default: Jan 1 of `to`\'s year → today). Output columns: date, voucher, narration, debit, credit, balance, nature (amounts USD).',
      inputSchema: {
        contact: z.string().describe('Contact name (exact preferred; falls back to substring match).'),
        from: z.string().optional().describe('Start date YYYY-MM-DD. Default: Jan 1 of the `to` year.'),
        to: z.string().optional().describe('End date YYYY-MM-DD. Default: today.'),
      },
    },
    contactStatement,
  );

  reg(
    'voucher_summary',
    {
      title: 'Voucher activity summary',
      description:
        'Counts and totals of vouchers over a recent window, grouped by voucherType and status. USE FOR "how many invoices last month", "posting activity", "totals by type". Params: days (default 30, max 365), voucher_type (optional enum), status (optional enum). Output columns: voucher_type, status, count, total_usd (USD). Note: totals mix AR and AP types — filter by voucher_type for one side.',
      inputSchema: {
        days: z.coerce.number().int().optional().describe('Lookback window in days (default 30, max 365).'),
        voucher_type: z.enum(VOUCHER_TYPES).optional().describe('Optional voucher type filter.'),
        status: z.enum(VOUCHER_STATUSES).optional().describe('Optional status filter (e.g. POSTED).'),
      },
    },
    voucherSummary,
  );

  reg(
    'credit_limit_status',
    {
      title: 'Credit limit utilisation',
      description:
        'Customers whose receivable balance reaches a % of their credit limit. USE FOR "who is near/over their credit limit". Only contacts with a credit limit set are considered. Requires the creditLimit column to be visible to your role (otherwise access is denied). Params: threshold (percent, default 80). Output columns: contact, credit_limit_usd, receivable_usd, utilization_pct.',
      inputSchema: {
        threshold: z.coerce.number().int().optional().describe('Minimum utilisation percent to include (default 80).'),
      },
    },
    creditLimitStatus,
  );

  reg(
    'netting_status',
    {
      title: 'Netting cycle status',
      description:
        'AR/AP netting cycles and their approval status. USE FOR "open netting cycles", "what\'s pending CEO approval". Params: status (optional enum: OPEN, PENDING_AM, PENDING_CEO, APPROVED, PARTIAL, SETTLED, REJECTED, AM_REJECTED, CEO_REJECTED). Output columns: contact, status, start_date, end_date, due_date. May return zero rows if there are no cycles.',
      inputSchema: {
        status: z.enum(NETTING_STATUSES).optional().describe('Optional netting cycle status filter.'),
      },
    },
    nettingStatus,
  );

  reg(
    'trial_balance',
    {
      title: 'Trial balance',
      description:
        'Trial balance as of a date: every account with ledger activity and its net debit or credit position. USE FOR "trial balance", "account balances", checking the books balance (total debit should equal total credit). Params: as_of (YYYY-MM-DD, default today). Output columns: account_code, account_name, account_type, debit_usd, credit_usd.',
      inputSchema: {
        as_of: z.string().optional().describe('As-of date YYYY-MM-DD (UTC). Default: today.'),
      },
    },
    trialBalance,
  );

  reg(
    'data_freshness',
    {
      title: 'Dataset freshness',
      description:
        'The latest data timestamp (last_refresh) for each dataset you can access. USE FOR "how fresh is the data", "when was this last updated". No parameters. Output columns: dataset, last_refresh (ISO-8601 UTC, or n/a).',
      inputSchema: {},
    },
    dataFreshness,
  );

  // Tier 3 — the guarded escape hatch. Registered specially so the raw SQL is
  // recorded in the audit row (scrubbed) as query_text.
  server.registerTool(
    `${slug}_query`,
    {
      title: 'Guarded read-only SQL',
      description:
        'THE ESCAPE HATCH — run ONE read-only SELECT for a shape the curated tools do not cover. PREFER the curated tools (ar_aging, top_contacts, contact_statement, trial_balance, voucher_summary…) for common questions. Rules: exactly one SELECT (no INSERT/UPDATE/DELETE/DDL, no multiple statements, no CTE writes, no locking, no EXPLAIN); only tables in your describe allow-list (joins/subqueries/CTEs included); no masked columns; no system catalogs. Tenant scoping is enforced automatically and a row cap is applied. Param: sql (string). Output columns match your SELECT list.',
      inputSchema: {
        sql: z.string().describe('A single read-only SELECT over your allow-listed tables. Do not include a trailing semicolon or multiple statements.'),
      },
      outputSchema: OUTPUT_SCHEMA,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any, extra: any) => run(extra, `${slug}_query`, (ctx) => query(ctx, (args ?? {}) as Record<string, unknown>)),
  );

  return server;
}
