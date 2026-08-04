# `accounting` — Atlas MCP connector (read-only)

A small, **separate, read-only** MCP server that exposes this accounting
platform's data to Atlas's AI agent, enforcing the app's per-role, per-tenant
permissions. Built to the **Hayo MCP Integration Specification** (identity via
Atlas-signed JWT, returned audit block, TLS) plus the Atlas MCP Builder's Guide
(tool/SQL-guard design).

- **Identity = Atlas-signed JWT.** Callers present `Authorization: Bearer <token>`;
  we verify it with Atlas's **public key** (RS256, `iss`/`aud`/`exp`/`nbf`,
  `jti`-replay, `oid`). No shared secret, no identity header.
- **Match by `oid`** (Microsoft object ID) → email → write-once backfill.
- **Read-only, physically.** `atlas_mcp` is `SELECT`-only; the only write account,
  `atlas_mcp_oid`, can `UPDATE(oid) ON users` and nothing else.
- **Audit block on every response.** `{ result | error, audit }` — Atlas stores it.
- **Deny by default / fail closed.** One generic denial; the precise reason is in
  the audit block.

## Architecture

```
Atlas agent ──HTTPS /mcp──▶ apps/mcp
  Authorization: Bearer JWT   ├─ auth/jwt.ts ........ verify RS256 token (JWKS)
                              ├─ auth/roleResolver ... oid → email → backfill; role/tenant
                              ├─ runner.ts .......... the guarded pipeline; returns {result,audit}
                              ├─ audit/block.ts ..... the returned audit block (Spec §4)
                              ├─ permissions/ ....... role → dataset → table allow-list + masking
                              ├─ tools/ ............. describe + 9 curated tools + guarded query
                              └─ db/pools.ts ........ atlas_mcp (RO) + atlas_mcp_oid (UPDATE oid) + audit
```

## Local setup

Prereqs: the repo's Docker Postgres with a seeded `accounting_dev`.

```bash
docker compose up -d postgres redis            # DB first (from repo root)

cd apps/mcp
cp .env.example .env
pnpm --filter mcp gen:keys                     # dev RSA keypair (local Atlas stand-in) → dev-keys/
pnpm --filter mcp db:setup                     # atlas_mcp / atlas_mcp_oid / audit + self-test (14 checks)
pnpm --filter mcp dev                          # http://127.0.0.1:7801/mcp  (health: /health, ready: /ready)
```

`.env` for dev already points at the local JWKS file (`ATLAS_JWT_PUBLIC_KEY_FILE`)
and `ATLAS_JWT_AUD=accounting-mcp-dev`. For staging/prod you instead set
`ATLAS_JWKS_URL` (Atlas's keys endpoint) and the real `ATLAS_JWT_AUD`.

## Testing

```bash
pnpm --filter mcp test:unit    # SQL-guard attack corpus + JWT verification (needs gen:keys; no server/DB)
pnpm --filter mcp test         # + end-to-end integration (needs db:setup + a running server)
pnpm --filter mcp typecheck
```

**Drive it locally** with the smoke client, which **mints a fresh RS256 token per
call** (Claude Code / MCP Inspector send a *static* header, which the JWT +
`jti`-replay model rejects on reuse — so the smoke client is the local driver;
Atlas is the real one):

```bash
pnpm --filter mcp smoke tahira.sadaf@kingrevolution.com       # OWNER → describe
pnpm --filter mcp smoke imran.abbas@kingrevolution.com        # PAYMENT_OFFICER → 3 datasets
pnpm --filter mcp smoke <email> --tool accounting_ar_aging --args {}
pnpm --filter mcp smoke <email> --tool accounting_query --args '{"sql":"SELECT count(*) FROM vouchers"}'
pnpm --filter mcp smoke --no-user        # bad_token
pnpm --filter mcp smoke --expired        # token_expired
pnpm --filter mcp smoke --wrong-aud      # bad_token
pnpm --filter mcp smoke --replay         # first ok, second token_replayed
```

## Tools

`accounting_describe` (call first) · `accounting_ar_aging` / `accounting_ap_aging`
· `accounting_top_contacts` · `accounting_contact_statement` ·
`accounting_voucher_summary` · `accounting_credit_limit_status` ·
`accounting_netting_status` · `accounting_trial_balance` ·
`accounting_data_freshness` · `accounting_query` (guarded escape hatch).

Each response is `{ "result": <data>, "audit": <block> }` (or `{ "error", "audit" }`).
Tabular results carry raw numbers + a `currency` field.

## Configuration

See `.env.example`. Key vars: `ATLAS_JWT_AUD`, `ATLAS_JWKS_URL` (prod) /
`ATLAS_JWT_PUBLIC_KEY_FILE` (dev), `ATLAS_JWT_ISS`, `MCP_DATABASE_URL` (read-only),
`MCP_OID_WRITER_DATABASE_URL` (narrow oid writer), `MCP_AUDIT_DATABASE_URL`
(optional local copy), `MCP_HOST`/`MCP_PORT`, and the caps.

## Deployment

- `accounting-mcp-staging` / `-prod`, own ports + env files, staging/prod DBs.
- **TLS is mandatory** at the endpoint — terminate at Nginx; bind this port to
  loopback and firewall it to Atlas's IPs. Sync the clock with NTP.
- Atlas provides `ATLAS_JWKS_URL` + `ATLAS_JWT_AUD`; you provide the URL + slug.

See [SECURITY.md](./SECURITY.md) for the full conformance map.
