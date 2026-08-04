/**
 * JWT verification (Hayo MCP Integration Spec §3). Unit tests — no server/DB, but
 * they need the dev keypair (`pnpm --filter mcp gen:keys`); they SKIP without it.
 */
import 'dotenv/config';
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { verifyToken, _clearJtiCache } from '../src/auth/jwt.js';

const KEYS = 'dev-keys/private.jwk.json';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let priv: any;
let have = false;
before(() => {
  have = existsSync(KEYS);
  if (have) priv = JSON.parse(readFileSync(KEYS, 'utf8'));
});

interface Over {
  oid?: string;
  email?: string;
  aud?: string;
  iss?: string;
  jti?: string;
  iat?: number;
  nbf?: number;
  exp?: number;
  noOid?: boolean;
}
async function mint(over: Over = {}): Promise<string> {
  const jose = await import('jose');
  const key = await jose.importJWK(priv, 'RS256');
  const now = Math.floor(Date.now() / 1000);
  const claims: Record<string, unknown> = { email: over.email ?? 'x@y.com', correlation_id: 'c' };
  if (!over.noOid) claims.oid = over.oid ?? randomUUID();
  return new jose.SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: priv.kid })
    .setIssuer(over.iss ?? 'atlas')
    .setAudience(over.aud ?? 'accounting-mcp-dev')
    .setJti(over.jti ?? randomUUID())
    .setIssuedAt(over.iat ?? now)
    .setNotBefore(over.nbf ?? now)
    .setExpirationTime(over.exp ?? now + 120)
    .sign(key);
}

test('valid token verifies with oid/email', async (t) => {
  if (!have) return t.skip('run `pnpm --filter mcp gen:keys` first');
  _clearJtiCache();
  const r = await verifyToken('Bearer ' + (await mint({ oid: 'the-oid', email: 'a@b.co' })));
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.claims.oid, 'the-oid');
    assert.equal(r.claims.email, 'a@b.co');
  }
});

test('missing Bearer → bad_token', async (t) => {
  if (!have) return t.skip();
  assert.deepEqual(await verifyToken(undefined), { ok: false, reason: 'bad_token' });
});

test('wrong audience → bad_token', async (t) => {
  if (!have) return t.skip();
  _clearJtiCache();
  const r = await verifyToken('Bearer ' + (await mint({ aud: 'some-other-mcp' })));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, 'bad_token');
});

test('wrong issuer → bad_token', async (t) => {
  if (!have) return t.skip();
  _clearJtiCache();
  const r = await verifyToken('Bearer ' + (await mint({ iss: 'evil' })));
  assert.equal(r.ok, false);
});

test('expired → token_expired', async (t) => {
  if (!have) return t.skip();
  _clearJtiCache();
  const now = Math.floor(Date.now() / 1000);
  const r = await verifyToken('Bearer ' + (await mint({ iat: now - 600, nbf: now - 600, exp: now - 300 })));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, 'token_expired');
});

test('missing oid → bad_token', async (t) => {
  if (!have) return t.skip();
  _clearJtiCache();
  const r = await verifyToken('Bearer ' + (await mint({ noOid: true })));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, 'bad_token');
});

test('replayed jti → token_replayed', async (t) => {
  if (!have) return t.skip();
  _clearJtiCache();
  const tok = 'Bearer ' + (await mint({ jti: 'fixed-jti-1' }));
  assert.equal((await verifyToken(tok)).ok, true);
  const r2 = await verifyToken(tok);
  assert.equal(r2.ok, false);
  if (!r2.ok) assert.equal(r2.reason, 'token_replayed');
});

test('HS256 (symmetric) rejected → bad_token', async (t) => {
  if (!have) return t.skip();
  _clearJtiCache();
  const jose = await import('jose');
  const now = Math.floor(Date.now() / 1000);
  const tok = await new jose.SignJWT({ oid: 'x' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('atlas')
    .setAudience('accounting-mcp-dev')
    .setJti(randomUUID())
    .setIssuedAt(now)
    .setExpirationTime(now + 120)
    .sign(new TextEncoder().encode('a-symmetric-secret-of-some-length-1234'));
  const r = await verifyToken('Bearer ' + tok);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, 'bad_token');
});
