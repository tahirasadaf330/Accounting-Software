/**
 * Tiny MCP client that MINTS an Atlas-style RS256 token per call (Spec §3) using
 * the dev private key, then drives the connector. Reads { data, audit } from
 * structuredContent (Spec §2.1). Stands in for Atlas locally.
 *
 *   pnpm --filter mcp gen:keys                      # once — creates dev-keys/
 *   pnpm --filter mcp smoke                          # OWNER (default), describe
 *   pnpm --filter mcp smoke ali@hayo.net --tool accounting_ar_aging --args {}
 *   pnpm --filter mcp smoke --no-user | --bad-sig | --expired | --wrong-aud | --replay
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

interface MintOpts {
  badSig?: boolean;
  expired?: boolean;
  wrongAud?: boolean;
}

function oidFor(email: string): string {
  const h = createHash('sha256').update(email.toLowerCase()).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

async function mintToken(email: string, opts: MintOpts = {}): Promise<string> {
  const jose = await import('jose');
  const privJwk = JSON.parse(readFileSync('dev-keys/private.jwk.json', 'utf8'));
  let key = await jose.importJWK(privJwk, 'RS256');
  const kid = privJwk.kid ?? 'dev-1';
  if (opts.badSig) key = (await jose.generateKeyPair('RS256', { extractable: true })).privateKey;
  const now = Math.floor(Date.now() / 1000);
  const aud = opts.wrongAud ? 'some-other-mcp' : process.env.MCP_AUD || 'accounting-mcp-local';
  return new jose.SignJWT({ oid: oidFor(email), email, name: 'Smoke Tester', correlation_id: 'smoke-' + randomUUID().slice(0, 8) })
    .setProtectedHeader({ alg: 'RS256', kid })
    .setIssuer(process.env.ATLAS_ISS || 'atlas')
    .setAudience(aud)
    .setJti(randomUUID())
    .setIssuedAt(opts.expired ? now - 600 : now)
    .setNotBefore(opts.expired ? now - 600 : now)
    .setExpirationTime(opts.expired ? now - 300 : now + 120)
    .sign(key);
}

function flagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callOnce(target: string, token: string | null, tool: string, toolArgs: unknown): Promise<any> {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  const transport = new StreamableHTTPClientTransport(new URL(target), { requestInit: { headers } });
  const client = new Client({ name: 'acct-smoke', version: '0.0.0' });
  await client.connect(transport);
  try {
    return await client.callTool({ name: tool, arguments: toolArgs as Record<string, unknown> });
  } finally {
    await client.close();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function printResponse(tool: string, res: any): void {
  const sc = res?.structuredContent;
  const audit = sc?.audit;
  const text = (res?.content ?? []).map((c: { text?: string }) => c.text ?? '').join(' ');
  console.log(`${tool} -> outcome=${audit?.outcome ?? '?'} deny_reason=${audit?.deny_reason ?? '-'} | ${text}`);
  if (sc?.data != null) console.log('  data:', JSON.stringify(sc.data).slice(0, 500));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const target = process.env.MCP_URL || 'http://127.0.0.1:7801/mcp';
  const user = args.find((a) => a.includes('@')) || 'tahira.sadaf@kingrevolution.com';
  const tool = flagValue(args, '--tool') || 'accounting_describe';
  const toolArgs = JSON.parse(flagValue(args, '--args') || '{}');
  const noUser = args.includes('--no-user');
  const opts: MintOpts = { badSig: args.includes('--bad-sig'), expired: args.includes('--expired'), wrongAud: args.includes('--wrong-aud') };
  const replay = args.includes('--replay');

  console.log('── scenario:', JSON.stringify({ user: noUser ? '(no token)' : user, tool, ...opts, replay }));

  const token = noUser ? null : await mintToken(user, opts);
  printResponse(tool, await callOnce(target, token, tool, toolArgs));

  if (replay && token) {
    console.log('\n── replaying the SAME token …');
    printResponse(tool, await callOnce(target, token, tool, toolArgs));
  }
}

main().catch((e) => {
  console.error('smoke error:', (e as Error).message);
  process.exit(1);
});
