/**
 * End-to-end integration tests (Guide 8.1 / 11.1). Drives the running connector
 * through a real MCP client with identity headers, then checks the audit DB.
 *
 * REQUIRES: `pnpm --filter mcp db:setup` done, and the server running
 * (`pnpm --filter mcp dev`). If the server is unreachable, these tests SKIP.
 */
import 'dotenv/config';
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client as PgClient } from 'pg';

const MCP_URL = process.env.MCP_URL || 'http://127.0.0.1:7801/mcp';
const HEALTH = MCP_URL.replace(/\/mcp$/, '/health');
const SECRET = process.env.ATLAS_MCP_SECRET || '';
const OWNER = 'tahira.sadaf@kingrevolution.com';
const PAYMENT_OFFICER = 'imran.abbas@kingrevolution.com';
const DENIAL = /Access denied/;
const REJECT = /Query rejected/;

let up = false;
before(async () => {
  try {
    const r = await fetch(HEALTH);
    up = r.ok;
  } catch {
    up = false;
  }
  if (!up) console.warn(`\n[integration] server not reachable at ${HEALTH} — these tests will skip.\n`);
});

interface CallOpts {
  user?: string;
  secret?: string;
  noUser?: boolean;
}

async function call(tool: string, args: Record<string, unknown>, opts: CallOpts = {}): Promise<string> {
  const headers: Record<string, string> = {
    'x-atlas-agent-key': opts.secret ?? SECRET,
    'x-atlas-request-id': 'itest-' + Math.random().toString(36).slice(2),
  };
  if (!opts.noUser) headers['x-atlas-user-id'] = opts.user ?? OWNER;
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), { requestInit: { headers } });
  const client = new Client({ name: 'itest', version: '0.0.0' });
  await client.connect(transport);
  try {
    const res = (await client.callTool({ name: tool, arguments: args })) as { content?: Array<{ text?: string }> };
    return (res.content ?? []).map((c) => c.text ?? '').join('\n');
  } finally {
    await client.close();
  }
}

test('describe: OWNER sees all 6 datasets', async (t) => {
  if (!up) return t.skip('server not running');
  const j = JSON.parse(await call('accounting_describe', {}, { user: OWNER }));
  assert.equal(j.datasets.length, 6);
});

test('describe: PAYMENT_OFFICER sees only 3 datasets', async (t) => {
  if (!up) return t.skip('server not running');
  const j = JSON.parse(await call('accounting_describe', {}, { user: PAYMENT_OFFICER }));
  assert.equal(j.datasets.length, 3);
});

test('auth: wrong secret → generic denial', async (t) => {
  if (!up) return t.skip('server not running');
  assert.match(await call('accounting_describe', {}, { user: OWNER, secret: 'definitely-the-wrong-secret-0000000000' }), DENIAL);
});

test('auth: missing user id → generic denial', async (t) => {
  if (!up) return t.skip('server not running');
  assert.match(await call('accounting_describe', {}, { noUser: true }), DENIAL);
});

test('auth: unknown user → generic denial', async (t) => {
  if (!up) return t.skip('server not running');
  assert.match(await call('accounting_describe', {}, { user: 'nobody@nowhere.example' }), DENIAL);
});

test('role: PAYMENT_OFFICER blocked from the general ledger (trial balance)', async (t) => {
  if (!up) return t.skip('server not running');
  assert.match(await call('accounting_trial_balance', {}, { user: PAYMENT_OFFICER }), REJECT);
});

test('escape hatch: valid SELECT returns data', async (t) => {
  if (!up) return t.skip('server not running');
  const j = JSON.parse(await call('accounting_query', { sql: 'SELECT count(*) AS n FROM vouchers' }, { user: OWNER }));
  assert.ok(j.columns.includes('n'));
  assert.equal(j.row_count, 1);
});

test('escape hatch: out-of-allow-list table → guard reject', async (t) => {
  if (!up) return t.skip('server not running');
  assert.match(await call('accounting_query', { sql: 'SELECT * FROM users' }, { user: OWNER }), REJECT);
});

test('escape hatch: multi-statement → guard reject', async (t) => {
  if (!up) return t.skip('server not running');
  assert.match(await call('accounting_query', { sql: 'SELECT 1; DROP TABLE vouchers' }, { user: OWNER }), REJECT);
});

test('audit: a row is written per call (incl. denials)', async (t) => {
  if (!up) return t.skip('server not running');
  const adminDsn = process.env.MCP_ADMIN_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/accounting_dev';
  const pg = new PgClient({ connectionString: adminDsn });
  await pg.connect();
  try {
    const before = (await pg.query("SELECT count(*)::int n FROM mcp_audit_log WHERE tool = 'accounting_data_freshness'")).rows[0].n;
    await call('accounting_data_freshness', {}, { user: OWNER });
    // bad secret is audited too (with null user)
    await call('accounting_data_freshness', {}, { user: OWNER, secret: 'wrong-0000000000000000000000000000000' });
    const after = (await pg.query("SELECT count(*)::int n FROM mcp_audit_log WHERE tool = 'accounting_data_freshness'")).rows[0].n;
    assert.ok(after >= before + 2, `expected >=2 new audit rows, before=${before} after=${after}`);
    const probe = (
      await pg.query("SELECT count(*)::int n FROM mcp_audit_log WHERE outcome = 'denied' AND deny_reason = 'bad agent key'")
    ).rows[0].n;
    assert.ok(probe >= 1, 'bad-secret probe should be audited with a deny reason');
  } finally {
    await pg.end();
  }
});
