/**
 * role_permissions mapping — the SINGLE source of truth for what each role may
 * read (Guide 1.4 / 3.5). Reviewed like code (PR), never tweaked ad-hoc.
 *
 * The app itself has no permission table today (authorization is scattered
 * `@Roles()` decorators), so this config mirrors the app's de-facto per-role
 * access. Deny-by-default: any table not in a granted dataset is invisible, and
 * is additionally denied at the DB by GRANT (see scripts/db-hardening.sql).
 *
 *  - allow-list for a caller = UNION of `tables` across their role's datasets.
 *  - masked columns are OMITTED by curated tools and REJECTED by the escape hatch.
 */
import { Role } from '@accounting-saas/shared';

export interface DatasetDef {
  name: string;
  tables: string[];
  description: string;
}

/** Datasets = named groups of real relations, with agent-facing descriptions. */
export const DATASETS: Record<string, DatasetDef> = {
  gl: {
    name: 'gl',
    tables: ['accounts', 'journal_entries', 'journal_entry_lines', 'voucher_line_items', 'account_balances'],
    description: 'General ledger: chart of accounts and posted double-entry journal lines.',
  },
  ap_ar: {
    name: 'ap_ar',
    tables: ['vouchers', 'payment_allocations'],
    description:
      'Invoices, bills, payments and receipts (all Voucher rows discriminated by voucher_type), plus payment↔invoice settlement allocations.',
  },
  contacts: {
    name: 'contacts',
    tables: ['contacts', 'business_units', 'account_managers', 'contact_account_managers'],
    description: 'Customer & vendor master data, their business units and account managers.',
  },
  banking: {
    name: 'banking',
    tables: ['bank_accounts', 'bank_statements', 'bank_statement_lines', 'reconciliations', 'reconciliation_matches'],
    description: 'Bank accounts, imported statements and reconciliation matches.',
  },
  netting: {
    name: 'netting',
    tables: ['netting_cycles', 'netting_cycle_invoices', 'netting_cycle_comments'],
    description: 'AR/AP netting cycles (bilateral settlement) and their invoices/comments.',
  },
  reference: {
    name: 'reference',
    tables: ['currencies', 'exchange_rates', 'fiscal_years', 'fiscal_periods'],
    description: 'Reference data: currencies, exchange rates, fiscal years and periods.',
  },
};

/** Role → datasets. Mirrors the app's de-facto endpoint access. Deny-by-default. */
export const ROLE_DATASETS: Record<Role, string[]> = {
  [Role.OWNER]: ['gl', 'ap_ar', 'contacts', 'banking', 'netting', 'reference'],
  [Role.FINANCE_MANAGER]: ['gl', 'ap_ar', 'contacts', 'banking', 'netting', 'reference'],
  [Role.ASSISTANT_MANAGER_BILLING]: ['gl', 'ap_ar', 'contacts', 'netting', 'reference'],
  [Role.SENIOR_ARAP_OFFICER]: ['ap_ar', 'netting', 'banking', 'contacts', 'reference'],
  [Role.SENIOR_OFFICE_PAYMENTS]: ['ap_ar', 'banking', 'contacts', 'reference'],
  [Role.PAYMENT_OFFICER]: ['ap_ar', 'contacts', 'reference'],
  // SUPER_ADMIN is a cross-tenant platform role — never served by the connector.
  [Role.SUPER_ADMIN]: [],
};

/** Sensitive contact columns (bank/tax/credit) — masked for lower roles. */
const SENSITIVE_CONTACT_COLUMNS = [
  'bankBeneficiaryName',
  'bankName',
  'bankAccountNumber',
  'bankIban',
  'bankSwiftCode',
  'bankRoutingNumber',
  'bankAddress',
  'taxId',
  'creditLimit',
  'minThreshold',
];

interface MaskedCol {
  table: string;
  column: string;
}

const contactMasks: MaskedCol[] = SENSITIVE_CONTACT_COLUMNS.map((column) => ({ table: 'contacts', column }));

/** Role → masked columns. Curated tools omit these; the escape hatch rejects them. */
export const ROLE_MASKED: Record<Role, MaskedCol[]> = {
  [Role.OWNER]: [],
  [Role.FINANCE_MANAGER]: [],
  [Role.ASSISTANT_MANAGER_BILLING]: [],
  [Role.SENIOR_ARAP_OFFICER]: [],
  [Role.SENIOR_OFFICE_PAYMENTS]: contactMasks,
  [Role.PAYMENT_OFFICER]: contactMasks,
  [Role.SUPER_ADMIN]: [],
};

export interface Permissions {
  role: Role;
  datasets: DatasetDef[];
  /** lower-cased table names the caller may read */
  allowedTables: Set<string>;
  /** `${table}.${column}` (both lower-cased) that must never be exposed */
  maskedColumns: Set<string>;
}

export function permissionsFor(role: Role): Permissions {
  const names = ROLE_DATASETS[role] ?? [];
  const datasets = names.map((n) => DATASETS[n]).filter((d): d is DatasetDef => Boolean(d));
  const allowedTables = new Set<string>();
  for (const d of datasets) for (const t of d.tables) allowedTables.add(t.toLowerCase());
  const maskedColumns = new Set<string>();
  for (const m of ROLE_MASKED[role] ?? []) maskedColumns.add(`${m.table.toLowerCase()}.${m.column.toLowerCase()}`);
  return { role, datasets, allowedTables, maskedColumns };
}

/** True if `column` on `table` is masked for this permission set (case-insensitive). */
export function isMasked(perms: Permissions, table: string, column: string): boolean {
  return perms.maskedColumns.has(`${table.toLowerCase()}.${column.toLowerCase()}`);
}
