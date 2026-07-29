# Security & conformance map — `accounting` MCP connector

Maps each *Atlas MCP Builder's Guide* conformance item (Part XI) to where it is
enforced in this codebase and how it is tested.

## Conformance checklist (Part XI.1)

| # | Guide requirement | Enforced in | Test |
|---|---|---|---|
| 1 | No/wrong/duplicated secret & missing user id → generic denial | `auth/secret.ts` (constant-time), `http/headers.ts` (dup detection), `runner.ts` steps 1–2 | `auth.test.ts`, `integration.test.ts` (wrong secret, missing user) |
| 2 | Unknown / inactive / role-less / **multi-role** / no-tenant → ONE generic denial | `auth/roleResolver.ts`, `runner.ts` steps 3–4 | `integration.test.ts` (unknown user); resolver denies inactive/ambiguous/no-tenant |
| 3 | `describe` shows ONLY the caller's datasets | `tools/describe.ts` + `permissions/mapping.ts` | `integration.test.ts` (OWNER=6, PAYMENT_OFFICER=3) |
| 4 | Escape hatch rejects the full attack corpus (catalogs, write-CTEs, masked cols, out-of-role joins…) | `tools/sqlGuard.ts` | `sqlGuard.test.ts` (20+ cases), `integration.test.ts` |
| 5 | Masked columns never appear for a restricted role | `permissions/mapping.ts` (`ROLE_MASKED`), curated tools omit; `sqlGuard.ts` rejects | `sqlGuard.test.ts` (masked col + `SELECT *`), curated `requireUnmasked` |
| 6 | Every call → exactly one audit row, written **before** the response; probes included | `runner.ts` (`auditAndReturn`), `audit/audit.ts` | `integration.test.ts` (row count + bad-secret probe) |
| 7 | Role change/revocation effective within 60 s | `auth/roleResolver.ts` cache TTL `ROLE_CACHE_TTL_MS` (≤ 60 s), denials cached too | config `roleCacheTtlMs` |
| 8 | The MCP DB account cannot write (verified at the DB) | `scripts/db-hardening.sql` (SELECT-only role, `default_transaction_read_only`) | `scripts/setup-local-db.ts` self-test (9 checks) |
| 9 | `describe` freshness/content matches reality | `tools/describe.ts` (columns from `information_schema`, live `last_refresh`) | manual / `accounting_data_freshness` |
| 10 | Caps + timeouts fire; overload → fast friendly error | `envelope.ts` (row+byte caps), `runner.ts` (`SET LOCAL statement_timeout`), `rateLimit.ts`, `http/server.ts` (body cap) | row cap in `sqlGuard` + envelope |

## Ground rules (Part III)

- **Read-only, physically.** Dedicated `atlas_mcp` role: per-table `GRANT SELECT`
  only (union of allow-listed tables), **column-scoped** grant on `users`
  (identity columns only — never `passwordHash`/`mfaSecret`), no grants on the
  audit table, `default_transaction_read_only = on`, `statement_timeout`,
  no SUPERUSER/CREATE*. See `scripts/db-hardening.sql`.
- **Identity out-of-band.** Headers only; never a tool argument. Secret compared
  with `timingSafeEqual`; OLD+NEW accepted during rotation; duplicated identity
  headers rejected.
- **Deny by default / fail-closed.** Unknown user, no/❯1 role, inactive, no
  tenant, resolver error, parse doubt → the one generic denial. Resolver errors
  are never cached.
- **Audit every call before returning.** Append-only `mcp_audit_log`, written by a
  separate `INSERT`-only account. If the audit write fails, the caller returns
  "unavailable" (not data) and the failure is logged at ALERT level.
- **Only the three approved strings** ever reach the agent (`responses.ts`); full
  detail (driver/SQL/parser messages, stack traces) stays server-side, keyed by
  request id (`logging.ts`).

## Tenant isolation

The app is multi-tenant. Each caller resolves to exactly one `tenantId`
(`auth/roleResolver.ts`). Curated tools filter every query by `tenantId`. The
escape hatch parses the SQL and **injects `<alias>."tenantId" = '<caller tenant>'`
onto every tenant-scoped base table** (`sqlGuard.ts`), so an ad-hoc SELECT — even
across joins, subqueries and CTEs — cannot cross tenants. Global tables without a
`tenantId` (e.g. `currencies`) are exempted.

## SQL guard (escape hatch) — reject list

Parsed with `pgsql-ast-parser` (Postgres grammar); the full tree is walked,
fail-closed. Rejected: multiple statements; any non-SELECT top level; INSERT/
UPDATE/DELETE/DDL anywhere (incl. data-modifying CTEs); `SELECT … INTO`;
`FOR UPDATE/SHARE`; `EXPLAIN ANALYZE`; system catalogs (`pg_catalog`,
`information_schema`); denied functions (`pg_sleep`, `dblink*`, file/large-object
access, `set_config`, `setval`/`nextval`, admin/signal, `*_to_xml`); caller bind
parameters; masked-column references; any relation outside the caller's
allow-list; and any parse error or unrecognised construct.

## Prompt-injection-via-data (Part 7.4)

Results are returned as structured JSON (never blended into narration). Free-text
cells are sanitised in `envelope.ts` (control characters stripped, length capped)
before reaching the agent. `describe`/primer text is treated as code — changes get
code review.

## Known scoping decisions

- Tenant isolation uses **explicit `WHERE tenantId` + parse-tree injection**
  (per project choice), not Postgres RLS. RLS remains available as a future
  defense-in-depth backstop.
- Curated AR/AP aging are **invoice-based (gross of netting)**; statements and
  top-contacts are **ledger-based** (true net). Netting-adjusted/hierarchical
  views remain in the app UI. Documented in `describe.reading_notes`.
