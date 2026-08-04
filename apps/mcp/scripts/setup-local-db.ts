/**
 * Local DB setup: applies scripts/db-hardening.sql against your local Postgres,
 * then VERIFIES the read-only guarantees hold (Guide Part VIII "Read-only:
 * verified at the DB"). Run once after the DB is up & seeded:
 *
 *   pnpm --filter mcp db:setup
 *
 * Env (all optional — defaults target the docker-compose Postgres):
 *   MCP_ADMIN_DATABASE_URL   superuser DSN (default postgres:postgres@localhost:5432/accounting_dev)
 *   MCP_DB_PASSWORD          atlas_mcp password        (default atlas_mcp_pw)
 *   MCP_AUDIT_DB_PASSWORD    atlas_mcp_audit password  (default atlas_mcp_audit_pw)
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import { DATASETS } from '../src/permissions/mapping.js';

const ADMIN = process.env.MCP_ADMIN_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/accounting_dev';
const MCP_PW = process.env.MCP_DB_PASSWORD || 'atlas_mcp_pw';
const AUDIT_PW = process.env.MCP_AUDIT_DB_PASSWORD || 'atlas_mcp_audit_pw';
const OID_PW = process.env.MCP_OID_DB_PASSWORD || 'atlas_mcp_oid_pw';

function adminHost(dsn: string): { host: string; port: string; db: string } {
  try {
    const u = new URL(dsn);
    return { host: u.hostname, port: u.port || '5432', db: u.pathname.replace(/^\//, '') };
  } catch {
    return { host: '?', port: '?', db: '?' };
  }
}

function mcpDsn(user: string, pw: string): string {
  const a = adminHost(ADMIN);
  return `postgresql://${user}:${encodeURIComponent(pw)}@${a.host}:${a.port}/${a.db}`;
}

async function expectFail(dsn: string, sql: string, label: string, results: string[]): Promise<void> {
  const c = new Client({ connectionString: dsn });
  try {
    await c.connect();
    await c.query(sql);
    results.push(`FAIL  ${label} — expected an error but the statement SUCCEEDED`);
  } catch (e) {
    results.push(`PASS  ${label} — correctly blocked (${(e as Error).message.split('\n')[0]})`);
  } finally {
    await c.end().catch(() => undefined);
  }
}

async function expectOk(dsn: string, sql: string, label: string, results: string[]): Promise<void> {
  const c = new Client({ connectionString: dsn });
  try {
    await c.connect();
    await c.query(sql);
    results.push(`PASS  ${label}`);
  } catch (e) {
    results.push(`FAIL  ${label} — ${(e as Error).message.split('\n')[0]}`);
  } finally {
    await c.end().catch(() => undefined);
  }
}

async function main(): Promise<void> {
  const sqlPath = join(__dirname, 'db-hardening.sql');
  let sql = readFileSync(sqlPath, 'utf8');

  // Drift guard: every mapping table must be granted in the SQL.
  const mappingTables = new Set<string>(Object.values(DATASETS).flatMap((d) => d.tables));
  const missing = [...mappingTables].filter((t) => !new RegExp(`\\b${t}\\b`).test(sql));
  if (missing.length > 0) {
    console.error('db-hardening.sql is missing GRANTs for mapping tables:', missing.join(', '));
    process.exit(1);
  }

  sql = sql
    .split('__MCP_PASSWORD__')
    .join(MCP_PW)
    .split('__AUDIT_PASSWORD__')
    .join(AUDIT_PW)
    .split('__OID_WRITER_PASSWORD__')
    .join(OID_PW);

  const a = adminHost(ADMIN);
  console.log(`Applying db-hardening.sql to ${a.host}:${a.port}/${a.db} …`);
  const admin = new Client({ connectionString: ADMIN });
  await admin.connect();
  try {
    await admin.query(sql);
  } finally {
    await admin.end().catch(() => undefined);
  }
  console.log('Applied. Verifying read-only guarantees…\n');

  const roDsn = mcpDsn('atlas_mcp', MCP_PW);
  const auditDsn = mcpDsn('atlas_mcp_audit', AUDIT_PW);
  const results: string[] = [];

  // Read-only account:
  await expectOk(roDsn, 'SELECT count(*) FROM contacts', 'atlas_mcp can SELECT an allow-listed table', results);
  await expectOk(roDsn, 'SELECT email, role, "tenantId", status FROM users LIMIT 1', 'atlas_mcp can read users identity columns', results);
  await expectFail(roDsn, 'SELECT "passwordHash" FROM users LIMIT 1', 'atlas_mcp CANNOT read users.passwordHash', results);
  await expectFail(roDsn, 'SELECT * FROM refresh_tokens LIMIT 1', 'atlas_mcp CANNOT read un-granted table (refresh_tokens)', results);
  await expectFail(roDsn, 'UPDATE tenants SET name = name', 'atlas_mcp CANNOT write (read-only)', results);
  await expectFail(roDsn, 'INSERT INTO mcp_audit_log (tool, outcome) VALUES ($x$t$x$, $x$ok$x$)', 'atlas_mcp CANNOT touch the audit table', results);

  // Audit writer:
  await expectOk(
    auditDsn,
    "INSERT INTO mcp_audit_log (tool, outcome, deny_reason) VALUES ('setup.verify', 'ok', 'db:setup self-test')",
    'atlas_mcp_audit CAN INSERT an audit row',
    results,
  );
  await expectFail(auditDsn, 'SELECT * FROM mcp_audit_log LIMIT 1', 'atlas_mcp_audit CANNOT read the audit table', results);
  await expectFail(auditDsn, "UPDATE mcp_audit_log SET outcome = 'error'", 'atlas_mcp_audit CANNOT update the audit table', results);

  // atlas_mcp can now read users.azureOid too (the Entra oid it matches on):
  await expectOk(roDsn, 'SELECT "azureOid" FROM users LIMIT 1', 'atlas_mcp can read users.azureOid', results);

  // Narrow oid writer: can write ONLY the azureOid column, nothing else:
  const oidDsn = mcpDsn('atlas_mcp_oid', OID_PW);
  await expectOk(oidDsn, 'UPDATE users SET "azureOid" = "azureOid" WHERE 1=0', 'atlas_mcp_oid CAN UPDATE users.azureOid (write-once backfill)', results);
  await expectFail(oidDsn, 'SELECT "passwordHash" FROM users LIMIT 1', 'atlas_mcp_oid CANNOT read users.passwordHash', results);
  await expectFail(oidDsn, 'UPDATE users SET status = status WHERE 1=0', 'atlas_mcp_oid CANNOT update any other column', results);
  await expectFail(oidDsn, 'SELECT * FROM contacts LIMIT 1', 'atlas_mcp_oid CANNOT read data tables', results);

  console.log(results.join('\n'));
  const failed = results.filter((r) => r.startsWith('FAIL'));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) process.exit(1);
  console.log('\n✅ Read-only DB role + audit writer are correctly locked down.');
}

main().catch((e) => {
  console.error('setup-local-db failed:', (e as Error).message);
  process.exit(1);
});
