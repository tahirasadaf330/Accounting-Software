/**
 * Generate a DEV RSA keypair that stands in for Atlas locally.
 *
 * Atlas holds a private key and signs tokens; the MCP holds only the public key
 * and verifies. For local testing WE play Atlas: this writes a private JWK (used
 * by the smoke client to MINT tokens) and a public JWKS (used by the MCP to
 * VERIFY them). NEVER use these in staging/prod — there you use Atlas's JWKS.
 *
 *   pnpm --filter mcp gen:keys
 *
 * Then in apps/mcp/.env:
 *   ATLAS_JWT_PUBLIC_KEY_FILE=dev-keys/public.jwks.json
 *   ATLAS_JWT_AUD=accounting-mcp-dev
 */
import { generateKeyPair, exportJWK } from 'jose';
import { mkdirSync, writeFileSync } from 'node:fs';

const KID = 'dev-1';

async function main(): Promise<void> {
  const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });

  const pub = await exportJWK(publicKey);
  pub.kid = KID;
  pub.alg = 'RS256';
  pub.use = 'sig';

  const priv = await exportJWK(privateKey);
  priv.kid = KID;
  priv.alg = 'RS256';

  mkdirSync('dev-keys', { recursive: true });
  writeFileSync('dev-keys/public.jwks.json', JSON.stringify({ keys: [pub] }, null, 2));
  writeFileSync('dev-keys/private.jwk.json', JSON.stringify(priv, null, 2));

  console.log('Wrote dev-keys/public.jwks.json (MCP verifies with this) and dev-keys/private.jwk.json (smoke client signs with this).');
  console.log('Set in apps/mcp/.env:  ATLAS_JWT_PUBLIC_KEY_FILE=dev-keys/public.jwks.json  and  ATLAS_JWT_AUD=accounting-mcp-dev');
}

main().catch((e) => {
  console.error('gen-dev-keys failed:', (e as Error).message);
  process.exit(1);
});
