/**
 * SQL-guard attack corpus (Guide 8.1 #3 / 11.1). Pure unit tests — no DB.
 * Every attack MUST reject; valid queries must pass and be tenant-scoped.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Role } from '@accounting-saas/shared';
import { guardAndRewrite } from '../src/tools/sqlGuard.js';
import { permissionsFor } from '../src/permissions/mapping.js';
import { GuardRejectError } from '../src/errors.js';

const OWNER = permissionsFor(Role.OWNER);
const PO = permissionsFor(Role.PAYMENT_OFFICER); // no GL; contacts bank cols masked
const TENANT = 'tenant-abc';
const CAP = 10_000;

function rejects(sql: string, perms = OWNER): void {
  assert.throws(() => guardAndRewrite(sql, perms, TENANT, CAP), GuardRejectError, `should reject: ${sql}`);
}
function allows(sql: string, perms = OWNER): string {
  const r = guardAndRewrite(sql, perms, TENANT, CAP);
  return r.sql;
}

test('rejects: multiple statements', () => {
  rejects('SELECT 1; DROP TABLE vouchers');
  rejects('SELECT * FROM vouchers; SELECT * FROM contacts');
});

test('rejects: non-SELECT top level', () => {
  rejects('INSERT INTO vouchers (id) VALUES (1)');
  rejects('UPDATE vouchers SET status = 2');
  rejects('DELETE FROM vouchers');
  rejects('DROP TABLE vouchers');
  rejects('TRUNCATE vouchers');
  rejects('ALTER TABLE vouchers ADD COLUMN x int');
  rejects('CREATE TABLE x (id int)');
});

test('rejects: data-modifying CTE', () => {
  rejects('WITH x AS (INSERT INTO vouchers (id) VALUES (1) RETURNING id) SELECT * FROM x');
  rejects('WITH x AS (DELETE FROM vouchers RETURNING id) SELECT * FROM x');
});

test('rejects: SELECT ... INTO', () => {
  rejects('SELECT * INTO evil FROM vouchers');
});

test('rejects: locking clause', () => {
  rejects('SELECT * FROM vouchers FOR UPDATE');
  rejects('SELECT * FROM vouchers FOR SHARE');
});

test('rejects: EXPLAIN ANALYZE', () => {
  rejects('EXPLAIN ANALYZE SELECT * FROM vouchers');
});

test('rejects: dangerous functions', () => {
  rejects('SELECT pg_sleep(10)');
  rejects("SELECT dblink('x','y')");
  rejects("SELECT pg_read_file('/etc/passwd')");
  rejects("SELECT lo_import('/etc/passwd')");
  rejects("SELECT set_config('x','y',false)");
});

test('rejects: system catalogs & metadata', () => {
  rejects('SELECT * FROM pg_catalog.pg_tables');
  rejects('SELECT * FROM information_schema.columns');
  rejects('SELECT * FROM pg_catalog.pg_user');
});

test('rejects: out-of-allow-list tables (direct, join, subquery, CTE)', () => {
  rejects('SELECT * FROM users');
  rejects('SELECT * FROM refresh_tokens');
  // PAYMENT_OFFICER cannot reach the general ledger
  rejects('SELECT * FROM journal_entry_lines', PO);
  rejects('SELECT v.id FROM vouchers v JOIN journal_entry_lines jl ON jl.id = v.id', PO);
  rejects('SELECT * FROM contacts WHERE "accountId" IN (SELECT id FROM accounts)', PO);
  rejects('WITH j AS (SELECT * FROM journal_entry_lines) SELECT * FROM j', PO);
});

test('rejects: masked column (aliased, expression, star)', () => {
  rejects('SELECT "bankIban" FROM contacts', PO);
  rejects('SELECT "bankIban" AS b FROM contacts', PO);
  rejects('SELECT upper("bankIban") FROM contacts', PO);
  rejects('SELECT * FROM contacts', PO); // star over a table with masked columns
});

test('allows: masked column is fine for an unmasked role', () => {
  const sql = allows('SELECT "bankIban" FROM contacts', OWNER);
  assert.match(sql, /"tenantId"/);
});

test('allows: valid single SELECT is tenant-scoped', () => {
  const sql = allows('SELECT count(*) FROM vouchers');
  assert.match(sql, /"tenantId"/);
  assert.match(sql, /'tenant-abc'/);
  assert.match(sql, /limit/i);
});

test('allows: join injects tenant predicate for BOTH tables', () => {
  const sql = allows('SELECT ct.name FROM vouchers v JOIN contacts ct ON ct.id = v."contactId"');
  const count = (sql.match(/"tenantId"/g) ?? []).length;
  assert.equal(count, 2, `expected 2 tenant predicates, got ${count} in: ${sql}`);
});

test('allows: subquery gets its own tenant predicate', () => {
  const sql = allows('SELECT * FROM vouchers WHERE "contactId" IN (SELECT id FROM contacts)');
  const count = (sql.match(/"tenantId"/g) ?? []).length;
  assert.equal(count, 2, `expected 2 tenant predicates, got ${count}`);
});

test('allows: global table (currencies) gets NO tenant predicate', () => {
  const sql = allows('SELECT code, name FROM currencies');
  assert.doesNotMatch(sql, /"tenantId"/);
});

test('allows: valid CTE over allow-listed tables', () => {
  const sql = allows('WITH s AS (SELECT "contactId", "totalAmount" FROM vouchers) SELECT * FROM s');
  assert.match(sql, /"tenantId"/); // the inner vouchers select is scoped
});
