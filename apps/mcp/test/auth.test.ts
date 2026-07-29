/**
 * Identity header parsing (Guide 3.2): duplicate-header smuggling, e-mail
 * validation/normalisation. Pure unit tests — no DB, no server.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIdentity, normalizeEmail } from '../src/http/headers.js';

test('normalizeEmail: lower-cases, trims, validates', () => {
  assert.equal(normalizeEmail('User@Example.COM'), 'user@example.com');
  assert.equal(normalizeEmail('  a@b.co '), 'a@b.co');
  assert.equal(normalizeEmail('notanemail'), undefined);
  assert.equal(normalizeEmail('a@b'), undefined);
  assert.equal(normalizeEmail('a,b@c.com'), undefined); // comma → smuggled
  assert.equal(normalizeEmail('a@b.co\nx'), undefined); // control char
  assert.equal(normalizeEmail(undefined), undefined);
});

test('parseIdentity: single-valued headers', () => {
  const id = parseIdentity({
    'x-atlas-agent-key': 'k',
    'x-atlas-user-id': 'A@B.co',
    'x-atlas-request-id': 'r1',
  });
  assert.equal(id.agentKey, 'k');
  assert.equal(id.userId, 'a@b.co');
  assert.equal(id.requestId, 'r1');
  assert.equal(id.duplicated, false);
});

test('parseIdentity: duplicate header (array) → duplicated', () => {
  const id = parseIdentity({ 'x-atlas-agent-key': ['k1', 'k2'], 'x-atlas-user-id': 'a@b.co' });
  assert.equal(id.duplicated, true);
  assert.equal(id.agentKey, undefined);
});

test('parseIdentity: comma-smuggled agent key → duplicated', () => {
  const id = parseIdentity({ 'x-atlas-agent-key': 'k1,k2', 'x-atlas-user-id': 'a@b.co' });
  assert.equal(id.duplicated, true);
});

test('parseIdentity: invalid e-mail → userId undefined', () => {
  const id = parseIdentity({ 'x-atlas-agent-key': 'k', 'x-atlas-user-id': 'bad' });
  assert.equal(id.userId, undefined);
});
