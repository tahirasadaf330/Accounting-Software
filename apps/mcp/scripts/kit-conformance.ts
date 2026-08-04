/**
 * Run our JWT verifier against the Atlas Dev Kit's sample tokens (minted by
 * Atlas's REAL code). Proves compatibility offline: the 2 valid tokens pass, all
 * 10 bad ones are refused — including the two auth-bypass cases (alg:none, HS256
 * confusion) and the two app-level ones (missing oid, replayed jti).
 *
 *   pnpm --filter mcp kit -- "<path to the ams-devkit folder>"
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

async function main(): Promise<void> {
  const kitDir = process.argv[2] || process.env.KIT_DIR;
  if (!kitDir) {
    console.error('Usage: pnpm --filter mcp kit -- <path-to-ams-devkit-folder>');
    process.exit(1);
  }

  // Configure the verifier for the kit BEFORE importing it (config reads env at load).
  process.env.ATLAS_JWKS_URL = '';
  process.env.ATLAS_JWT_PUBLIC_KEY_FILE = join(kitDir, 'dev-jwks.json');
  process.env.ATLAS_ISS = 'https://atlas.hayo.net';
  process.env.MCP_AUD = 'ams-mcp-dev';
  process.env.ATLAS_TOKEN_LEEWAY_S = '60';

  const { verifyToken, _clearJtiCache } = await import('../src/auth/jwt.js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kit: any = JSON.parse(readFileSync(join(kitDir, 'sample-tokens.json'), 'utf8'));

  let pass = 0;
  let fail = 0;
  const check = (ok: boolean, label: string, detail = ''): void => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
    if (ok) pass++;
    else fail++;
  };

  _clearJtiCache();

  const v1 = await verifyToken('Bearer ' + kit.valid.valid_1.token);
  const exp = kit.expected_claims_of_valid_1;
  check(
    v1.ok && v1.claims.oid === exp.oid && v1.claims.email === exp.email && v1.claims.correlationId === exp.correlation_id,
    'valid_1 verifies + claims match',
    v1.ok ? '' : `reason=${v1.reason}`,
  );

  const v2 = await verifyToken('Bearer ' + kit.valid.valid_2.token);
  check(v2.ok, 'valid_2 verifies after valid_1 (replay cache keys on jti, not user)', v2.ok ? '' : `reason=${v2.reason}`);

  for (const [name, obj] of Object.entries<{ token: string; rejected_by: string }>(kit.must_be_rejected)) {
    const r = await verifyToken('Bearer ' + obj.token);
    check(r.ok === false, `reject ${name} (${obj.rejected_by})`, r.ok ? 'WRONGLY ACCEPTED — BYPASS!' : `reason=${r.reason}`);
  }

  console.log(`\n${pass}/${pass + fail} conformance checks passed against Atlas's real sample tokens.`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error('kit-conformance error:', (e as Error).message);
  process.exit(1);
});
