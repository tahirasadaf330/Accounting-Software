/**
 * SQL guard for the escape hatch (Guide 6.3 / Appendix B.1). Parses with the
 * Postgres-grammar parser, walks the FULL tree, and is FAIL-CLOSED: any parse
 * error, unknown/again-dangerous construct, out-of-allow-list relation, masked
 * column, or denied function rejects the WHOLE query (all-or-nothing).
 *
 * On success it returns a rewritten SQL string with a tenant predicate injected
 * onto every tenant-scoped base table (so an ad-hoc SELECT cannot cross tenants)
 * and a hard row LIMIT applied.
 */
import { parse, astVisitor, astMapper, toSql } from 'pgsql-ast-parser';
import { GuardRejectError } from '../errors.js';
import type { Permissions } from '../permissions/mapping.js';

// System catalogs & metadata are permanently outside every allow-list.
const SYSTEM_SCHEMAS = new Set(['pg_catalog', 'information_schema', 'pg_toast']);

// Allow-listed tables that have NO tenantId column (never inject a tenant filter).
const GLOBAL_TABLES = new Set(['currencies']);

// Function deny-list (sleep, remote, file/large-object, config/seq, admin/signal…).
const DENIED_FUNCTIONS = new Set([
  'pg_sleep', 'pg_sleep_for', 'pg_sleep_until',
  'dblink', 'dblink_exec', 'dblink_connect', 'dblink_open', 'dblink_fetch',
  'pg_read_file', 'pg_read_binary_file', 'pg_ls_dir', 'pg_stat_file', 'pg_read_server_files',
  'lo_import', 'lo_export', 'lo_get', 'lo_put', 'loread', 'lowrite',
  'set_config', 'setval', 'nextval', 'currval', 'pg_logical_emit_message',
  'pg_terminate_backend', 'pg_cancel_backend', 'pg_reload_conf', 'pg_rotate_logfile',
  'query_to_xml', 'query_to_xml_and_xmlschema', 'database_to_xml', 'table_to_xml',
  'pg_read_server_file', 'copy_from', 'copy_to',
]);

const ALLOWED_TOP_TYPES = new Set(['select', 'union', 'union all', 'values', 'with', 'with recursive']);

export interface GuardResult {
  sql: string;
  relations: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

export function guardAndRewrite(
  rawSql: string,
  perms: Permissions,
  tenantId: string,
  rowCap: number,
  caseMap: Map<string, string> = new Map(),
): GuardResult {
  let statements: Node[];
  try {
    statements = parse(rawSql) as Node[];
  } catch {
    throw new GuardRejectError('parse error');
  }

  if (!Array.isArray(statements) || statements.length === 0) throw new GuardRejectError('no statement');
  if (statements.length > 1) throw new GuardRejectError('multiple statements');
  const stmt = statements[0];
  if (!ALLOWED_TOP_TYPES.has(stmt?.type)) throw new GuardRejectError(`disallowed statement type: ${stmt?.type}`);

  const cteNames = new Set<string>();
  const tables: Array<{ schema?: string; name: string }> = [];
  const funcs: string[] = [];
  const columns: Array<{ table?: string; name: string }> = [];
  let rejected: string | null = null;
  const reject = (why: string): void => {
    if (!rejected) rejected = why;
  };

  const visitor = astVisitor((v) => ({
    // Any mutating / DDL / side-effecting node ANYWHERE → reject (incl. data-modifying CTEs).
    insert: () => reject('insert'),
    update: () => reject('update'),
    delete: () => reject('delete'),
    drop: () => reject('drop'),
    truncateTable: () => reject('truncate'),
    createTable: () => reject('create/select-into'),
    createView: () => reject('create view'),
    createMaterializedView: () => reject('create materialized view'),
    refreshMaterializedView: () => reject('refresh materialized view'),
    createFunction: () => reject('create function'),
    createSchema: () => reject('create schema'),
    createExtension: () => reject('create extension'),
    createIndex: () => reject('create index'),
    createSequence: () => reject('create sequence'),
    createEnum: () => reject('create enum'),
    alterTable: () => reject('alter table'),
    alterSequence: () => reject('alter sequence'),
    do: () => reject('do block'),
    raise: () => reject('raise'),
    set: () => reject('set'),
    setGlobal: () => reject('set global'),
    setTimezone: () => reject('set timezone'),
    prepare: () => reject('prepare'),
    deallocate: () => reject('deallocate'),
    transaction: () => reject('transaction control'),
    // No caller-supplied bind parameters (avoids smuggling / ambiguity).
    parameter: (p: Node) => {
      reject('parameter');
      return p;
    },

    with: (w: Node) => {
      for (const b of w.bind ?? []) if (b?.alias?.name) cteNames.add(String(b.alias.name).toLowerCase());
      v.super().with(w);
      return w;
    },
    withRecursive: (w: Node) => {
      if (w?.alias?.name) cteNames.add(String(w.alias.name).toLowerCase());
      v.super().withRecursive(w);
      return w;
    },
    selection: (s: Node) => {
      if (s.for) reject('locking clause (FOR UPDATE/SHARE)');
      v.super().selection(s);
      return s;
    },
    tableRef: (t: Node) => {
      tables.push({ schema: t.schema, name: t.name });
      v.super().tableRef(t);
      return t;
    },
    call: (c: Node) => {
      const fn = c?.function?.name;
      if (typeof fn === 'string') funcs.push(fn.toLowerCase());
      v.super().call(c);
      return c;
    },
    ref: (r: Node) => {
      columns.push({ table: r?.table?.name, name: r.name });
      v.super().ref(r);
      return r;
    },
  }));

  visitor.statement(stmt);
  if (rejected) throw new GuardRejectError(rejected);

  // System catalogs / metadata always out.
  for (const t of tables) {
    if (t.schema && SYSTEM_SCHEMAS.has(t.schema.toLowerCase())) throw new GuardRejectError('system catalog reference');
  }
  // Denied functions.
  for (const fn of funcs) {
    if (DENIED_FUNCTIONS.has(fn)) throw new GuardRejectError(`denied function: ${fn}`);
  }

  const isCte = (t: { schema?: string; name: string }): boolean => !t.schema && cteNames.has(t.name.toLowerCase());

  // A CTE must not shadow a real allow-listed / global table (ambiguity → reject).
  for (const name of cteNames) {
    if (perms.allowedTables.has(name) || GLOBAL_TABLES.has(name)) throw new GuardRejectError('CTE shadows a real table');
  }

  // Every real relation must be in the caller's allow-list.
  const realTables = tables.filter((t) => !isCte(t));
  for (const t of realTables) {
    if (!perms.allowedTables.has(t.name.toLowerCase())) throw new GuardRejectError(`relation not in allow-list: ${t.name}`);
  }

  // Masked columns: reject if referenced when a masked table is in scope (fail-closed).
  const maskedTables = new Set([...perms.maskedColumns].map((k) => k.split('.')[0]));
  const maskedBare = new Set([...perms.maskedColumns].map((k) => k.split('.')[1]));
  const touchesMaskedTable = realTables.some((t) => maskedTables.has(t.name.toLowerCase()));
  if (touchesMaskedTable) {
    if (columns.some((c) => c.name === '*')) throw new GuardRejectError('SELECT * over a table with masked columns');
    for (const c of columns) {
      if (c.name !== '*' && maskedBare.has(c.name.toLowerCase())) throw new GuardRejectError('masked column referenced');
    }
  }

  // ── Rewrite: inject tenant predicate on every tenant-scoped base table ──
  const tenantScoped = (name: string): boolean =>
    perms.allowedTables.has(name.toLowerCase()) && !GLOBAL_TABLES.has(name.toLowerCase());

  const tenantPred = (alias: string): Node => ({
    type: 'binary',
    op: '=',
    left: { type: 'ref', table: { name: alias }, name: 'tenantId' },
    right: { type: 'string', value: tenantId },
  });

  const mapper = astMapper((m) => ({
    // Restore real camelCase for identifiers the agent wrote unquoted, so
    // toSql emits them quoted and Postgres finds the column.
    ref: (r: Node) => {
      if (r && typeof r.name === 'string' && r.name !== '*') {
        const real = caseMap.get(r.name.toLowerCase());
        if (real && real !== r.name) return { ...r, name: real };
      }
      return r;
    },
    selection: (s: Node) => {
      const mapped = m.super().selection(s) as Node;
      if (mapped?.type !== 'select' || !Array.isArray(mapped.from)) return mapped;
      const preds: Node[] = [];
      for (const f of mapped.from) {
        if (f?.type === 'table' && f.name && !isCte({ schema: f.name.schema, name: f.name.name }) && tenantScoped(f.name.name)) {
          preds.push(tenantPred(f.name.alias ?? f.name.name));
        }
      }
      if (preds.length === 0) return mapped;
      const where = preds.reduce<Node>((acc, p) => (acc ? { type: 'binary', op: 'AND', left: acc, right: p } : p), mapped.where ?? null);
      return { ...mapped, where };
    },
  }));

  const rewritten = mapper.statement(stmt) as Node;
  capLimit(rewritten, rowCap + 1);

  return {
    sql: toSql.statement(rewritten),
    relations: [...new Set(realTables.map((t) => t.name.toLowerCase()))],
  };
}

/** Apply a hard row LIMIT to a plain SELECT (or the final SELECT of a WITH). */
function capLimit(node: Node, cap: number): void {
  if (!node) return;
  if (node.type === 'select') {
    const capExpr = { type: 'integer', value: cap };
    const cur = node.limit?.limit;
    if (!node.limit) node.limit = { limit: capExpr };
    else if (!cur || cur.type !== 'integer' || cur.value > cap) node.limit = { ...node.limit, limit: capExpr };
  } else if (node.type === 'with' && node.in) {
    capLimit(node.in, cap);
  }
  // union / values: bounded by envelope row/byte caps + statement timeout.
}
