/**
 * End-to-end integration (Hayo MCP Integration Spec + Atlas answers). Mints
 * Atlas-style RS256 tokens and drives the running connector, checking the
 * structuredContent { data, audit } shape (Spec §2.1) and per-role scoping.
 * REQUIRES: `pnpm --filter mcp gen:keys`, db:setup, and the server running.
 * SKIPS if the server or dev keys are absent.
 */
import 'dotenv/config';
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_URL = process.env.MCP_URL || 'http://127.0.0.1:7801/mcp';
const HEALTH = MCP_URL.replace(/\/mcp$/, '/health');
const AUD = process.env.MCP_AUD || 'accounting-mcp-local';
const ISS = process.env.ATLAS_ISS || 'atlas';
const OWNER = 'tahira.sadaf@kingrevolution.com';
const PAYMENT_OFFICER = 'imran.abbas@kingrevolution.com';
const KEYS = 'dev-keys/private.jwk.json';

let up = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let priv: any;
before(async () => {
  if (!existsSync(KEYS)) {
    console.warn('\n[integration] dev-keys missing — run `pnpm --filter mcp gen:keys`. Skipping.\n');
    return;
  }
  priv = JSON.parse(readFileSync(KEYS, 'utf8'));
  try {
    up = (await fetch(HEALTH)).ok;
  } catch {
    up = false;
  }
  if (!up) console.warn(`\n[integration] server not reachable at ${HEALTH} — skipping.\n`);
});

function oidFor(email: string): string {
  const h = createHash('sha256').update(email.toLowerCase()).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

interface TokOpts {
  aud?: string;
  expired?: boolean;
}
async function mint(email: string, opts: TokOpts = {}): Promise<string> {
  const jose = await import('jose');
  const key = await jose.importJWK(priv, 'RS256');
  const now = Math.floor(Date.now() / 1000);
  return new jose.SignJWT({ oid: oidFor(email), email, correlation_id: 'itest-' + randomUUID().slice(0, 8) })
    .setProtectedHeader({ alg: 'RS256', kid: priv.kid })
    .setIssuer(ISS)
    .setAudience(opts.aud ?? AUD)
    .setJti(randomUUID())
    .setIssuedAt(opts.expired ? now - 600 : now)
    .setNotBefore(opts.expired ? now - 600 : now)
    .setExpirationTime(opts.expired ? now - 300 : now + 120)
    .sign(key);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(token: string | null, tool: string, args: Record<string, unknown>): Promise<{ data: any; audit: any; text: string }> {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), { requestInit: { headers } });
  const client = new Client({ name: 'itest', version: '0.0.0' });
  await client.connect(transport);
  try {
    const res = (await client.callTool({ name: tool, arguments: args })) as {
      content?: Array<{ text?: string }>;
      structuredContent?: { data: unknown; audit: unknown };
    };
    const sc = res.structuredContent ?? { data: undefined, audit: undefined };
    return { data: sc.data, audit: sc.audit, text: (res.content ?? []).map((c) => c.text ?? '').join(' ') };
  } finally {
    await client.close();
  }
}

test('describe: OWNER → 6 datasets; audit in structuredContent', async (t) => {
  if (!up) return t.skip('server/keys not available');
  const r = await call(await mint(OWNER), 'accounting_describe', {});
  assert.equal(r.data.datasets.length, 6);
  assert.equal(r.audit.outcome, 'ok');
  assert.equal(r.audit.schema_version, 1);
  assert.equal(r.audit.system, 'accounting');
  assert.equal(r.audit.subject.email, OWNER);
  assert.ok(r.audit.subject.oid);
  assert.ok(r.audit.server_time.endsWith('Z'));
});

test('describe: PAYMENT_OFFICER → 3 datasets', async (t) => {
  if (!up) return t.skip();
  const r = await call(await mint(PAYMENT_OFFICER), 'accounting_describe', {});
  assert.equal(r.data.datasets.length, 3);
});

test('no token → denied/bad_token as a NORMAL result (data null, audit present)', async (t) => {
  if (!up) return t.skip();
  const r = await call(null, 'accounting_describe', {});
  assert.equal(r.data, null);
  assert.equal(r.audit.outcome, 'denied');
  assert.equal(r.audit.deny_reason, 'bad_token');
  assert.equal(r.audit.subject.oid, null);
  assert.match(r.text, /Access denied/);
});

test('expired token → token_expired', async (t) => {
  if (!up) return t.skip();
  const r = await call(await mint(OWNER, { expired: true }), 'accounting_describe', {});
  assert.equal(r.audit.deny_reason, 'token_expired');
});

test('wrong audience → bad_token', async (t) => {
  if (!up) return t.skip();
  const r = await call(await mint(OWNER, { aud: 'some-other-mcp' }), 'accounting_describe', {});
  assert.equal(r.audit.deny_reason, 'bad_token');
});

test('role: PAYMENT_OFFICER blocked from general ledger', async (t) => {
  if (!up) return t.skip();
  const r = await call(await mint(PAYMENT_OFFICER), 'accounting_trial_balance', {});
  assert.equal(r.audit.outcome, 'denied');
  assert.equal(r.audit.deny_reason, 'not_allowed_operation');
});

test('escape hatch: valid SELECT → ok, numbers, audit shows the executed statement', async (t) => {
  if (!up) return t.skip();
  const r = await call(await mint(OWNER), 'accounting_query', { sql: 'SELECT count(*) AS n FROM vouchers' });
  assert.equal(r.audit.outcome, 'ok');
  assert.equal(typeof r.data.rows[0][0], 'number');
  assert.match(r.audit.operation.statement, /tenantId/);
  assert.ok(r.audit.relations_touched.includes('vouchers'));
});

test('escape hatch: out-of-allow-list table → not_allowed_operation', async (t) => {
  if (!up) return t.skip();
  const r = await call(await mint(OWNER), 'accounting_query', { sql: 'SELECT * FROM users' });
  assert.equal(r.audit.deny_reason, 'not_allowed_operation');
});
