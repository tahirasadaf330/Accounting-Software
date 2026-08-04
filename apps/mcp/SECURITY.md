# Security & conformance map — `accounting` MCP connector

Maps the **Hayo MCP Integration Specification** to where each item is enforced in
this codebase and how it is tested. (The connector also follows the Atlas MCP
Builder's Guide for tool/guard design; where the two differ on identity, audit or
transport, this Integration Spec governs.)

## §2 Transport — TLS

| Requirement | Status | Notes |
|---|---|---|
| HTTPS only; no reachable `http://` listener | ⚙️ infra | Server binds `127.0.0.1` (internal). TLS is terminated at **Nginx** in front of the port in staging/prod (allowlist Atlas IPs). Local dev uses loopback http only. |
| Timeouts, body-size limit, per-caller rate limit | ✅ | `http/server.ts` (64 KB body cap), `runner.ts` (statement timeout), `rateLimit.ts` (per-oid). |

## §3 Identity — the Atlas-signed JWT

| Requirement | Enforced in | Test |
|---|---|---|
| Identity ONLY in the verified token — never a header/param/arg | `runner.ts` reads `Authorization: Bearer`; no user header exists | `auth.test.ts`, `integration.test.ts` (no token → bad_token) |
| Verify signature, **RS256 only** (reject `none`/HS256) | `auth/jwt.ts` (`algorithms:['RS256']`) | `auth.test.ts` (HS256 rejected) |
| `iss === "atlas"`, `aud ===` our id | `auth/jwt.ts` | `auth.test.ts` (wrong iss/aud → bad_token) |
| `exp`/`nbf` with ~60s leeway | `auth/jwt.ts` (`clockTolerance`) | `auth.test.ts` (expired → token_expired) |
| `jti` replay rejected | `auth/jwt.ts` (in-memory cache, TTL≈token life) | `auth.test.ts`, smoke `--replay` |
| `oid` present | `auth/jwt.ts` | `auth.test.ts` (missing oid → bad_token) |
| Public key via **JWKS**, cached, re-fetch on unknown `kid` | `auth/jwt.ts` (`createRemoteJWKSet`; local JWKS file for dev) | — |

## §3.4 Matching — oid → email → write-once backfill

| Requirement | Enforced in | Test |
|---|---|---|
| `oid` column on users: nullable, UNIQUE | migration `20260804000000_add_user_oid` | — |
| Match by `oid`, else email (case-insensitive, trimmed) | `auth/roleResolver.ts` | db:setup + integration |
| Backfill `oid` only when empty, after active check, on exact email match; never overwrite | `roleResolver.ts` via **narrow** `atlas_mcp_oid` (UPDATE(oid) only) | live-verified (backfill writes once) |
| No auto-create; no email-domain filter; ambiguous/inactive → deny | `roleResolver.ts` (deny `no_account`/`ambiguous_account`) | — |

## §3.5–3.6 Authorization & errors

| Requirement | Enforced in |
|---|---|
| Permissions from OUR DB every request; scope enforced IN the query | `roleResolver.ts` + `permissions/mapping.ts` + tenant-predicate injection (`sqlGuard.ts`) |
| Never accept a role/permission/admin claim from the caller | Only `oid`/`email` are read from the token; role comes from the DB |
| Mask sensitive columns unconditionally | `mapping.ts` (curated tools omit; escape hatch rejects) |
| Statement timeout, row cap, date-filter on large tables | `runner.ts`, `envelope.ts`, `sqlGuard.ts` |
| One generic denial; never reveal which check failed | `responses.ts` |

## §4 Audit block — returned on EVERY response

| Requirement | Enforced in | Test |
|---|---|---|
| `{ result \| error, audit }` on ok, denied AND error | `runner.ts` (`finalize`) | `integration.test.ts` |
| Fixed schema + outcome values (`ok`/`denied`/`error`) | `audit/block.ts` | live-verified full block |
| `subject.oid/email/matched_by/local_user_id`, `correlation_id` echoed | `runner.ts` | integration |
| `operation.statement` = what ACTUALLY ran (after rewrite/scoping), secrets scrubbed, ≤4000 chars | `runner.ts` captures executed SQL; `block.ts` scrubs/caps | integration (statement shows injected `tenantId`) |
| `relations_touched` (≤50), `row_count`, `columns_masked`, `duration_ms`, UTC `server_time` | `runner.ts` + `block.ts` | live-verified |
| Atlas is the single logger (we don't write an Atlas DB) | We RETURN the block; a local `mcp_audit_log` copy is optional/best-effort | — |

## §5 What the MCP must NOT do

No charts/images; no pre-formatted numbers (raw numbers + `currency` field, `envelope.ts`/`curated.ts`); identity only from the token; no Atlas-DB credentials; no auto-create/guest fallback; no trusting caller permissions; no raw internal errors (`responses.ts`); no plain HTTP in prod.

## §6 Data quality

Stable column names + order; numbers as numbers, dates ISO-8601, booleans as booleans; unit/currency as their own field; freshness via `describe.last_refresh` + `accounting_data_freshness`; bounded results with `truncated`; tool descriptions for the model.

## Physical read-only + the narrow identity writer

- `atlas_mcp`: `SELECT` only on allow-listed tables + **column-scoped** grant on
  `users` (identity columns incl. `oid`; never `passwordHash`/`mfaSecret`),
  `default_transaction_read_only`, no writes anywhere. (`db-hardening.sql`)
- `atlas_mcp_oid`: the ONLY write account — `UPDATE(oid) ON users` and nothing
  else (verified: cannot read secrets, cannot update other columns, cannot read
  data tables). Data path stays 100% read-only.
- `atlas_mcp_audit`: `INSERT`-only on the optional local `mcp_audit_log`.

`scripts/setup-local-db.ts` self-tests all of the above (14 checks).

## §7 Go-live checklist (what still needs the Atlas team)

- HTTPS with a valid cert; firewall to Atlas IPs; no reachable http.
- `ATLAS_JWKS_URL` (Atlas keys endpoint) and `ATLAS_JWT_AUD` (your id) provided by Atlas.
- Server clock on NTP.
- Then: valid user gets their data; no-entitlement denied; unknown denied;
  expired/tampered/other-MCP tokens rejected (all covered by the test suite).
