# `accounting` — Atlas MCP connector (read-only)

A small, **separate, strictly READ-ONLY** MCP server that exposes this accounting
platform's data to Atlas's AI agent, enforcing the app's role-based permissions.
Built to the *Atlas MCP Builder's Guide v2.0* (Parts I–XI + Appendices A–B).

- **No AI inside.** Deterministic code; same input → same output.
- **Read-only, physically.** A dedicated `SELECT`-only Postgres role (`atlas_mcp`)
  with `default_transaction_read_only`; even a bug cannot write.
- **Identity out-of-band.** `x-atlas-agent-key` (shared secret, constant-time) +
  `x-atlas-user-id` (company e-mail) headers — never tool arguments.
- **Deny by default.** Unknown/inactive/role-less/multi-role/no-tenant → one
  generic denial. Every call is authorized by role, per request.
- **Audit before return.** One append-only row per call (incl. probes), written
  before any data is returned.

## Architecture

```
Atlas agent ──HTTP /mcp──▶  apps/mcp (this service)
                              ├─ runner.ts .......... the ONE guarded pipeline (Part V)
                              ├─ auth/ .............. secret (constant-time) + headers + role resolver
                              ├─ permissions/ ....... role → dataset → table allow-list + masking
                              ├─ tools/ ............. describe + 9 curated tools + guarded query
                              ├─ db/pools.ts ........ atlas_mcp (read-only) + atlas_mcp_audit (insert-only)
                              └─ audit/ ............. mcp_audit_log (append-only)
```

Tenant isolation: each caller resolves to exactly one tenant; every curated query
filters by `tenantId`, and the escape hatch **injects a tenant predicate** into the
parsed SQL for every tenant-scoped base table.

## Local setup

Prereqs: the repo's Docker Postgres (or any local Postgres) with a **seeded**
`accounting_dev` database.

```bash
# 1. From the repo root — start Postgres and seed (if not already)
docker compose up -d postgres
pnpm prisma:migrate && pnpm prisma:seed        # + seed:nawc / seed:hotnet as needed

# 2. Configure this service
cd apps/mcp
cp .env.example .env
# generate a >=32-byte secret and paste it into ATLAS_MCP_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# 3. Create the read-only DB role + audit table, and self-verify the lockdown
pnpm --filter mcp db:setup

# 4. Run it
pnpm --filter mcp dev            # http://127.0.0.1:7801/mcp   (health: /health, ready: /ready)
```

## Testing

```bash
pnpm --filter mcp test:unit      # SQL-guard attack corpus + header/auth parsing (no DB/server needed)
pnpm --filter mcp test           # the above + end-to-end integration (needs db:setup + a running server)
pnpm --filter mcp typecheck
```

Drive it by hand without Atlas:

```bash
pnpm --filter mcp smoke tahira.sadaf@kingrevolution.com          # OWNER → all datasets
pnpm --filter mcp smoke imran.abbas@kingrevolution.com           # PAYMENT_OFFICER → 3 datasets
pnpm --filter mcp smoke --bad-secret                             # → denial
pnpm --filter mcp smoke <email> --tool accounting_ar_aging --args '{}'
pnpm --filter mcp smoke <email> --tool accounting_query --args '{"sql":"SELECT count(*) FROM vouchers"}'
```

Or the official **MCP Inspector**: `pnpm --filter mcp inspect`, transport
*Streamable HTTP*, URL `http://127.0.0.1:7801/mcp`, headers `x-atlas-agent-key`
(your `ATLAS_MCP_SECRET`) and `x-atlas-user-id` (a seeded e-mail).

### Connect to Claude Code

```bash
claude mcp add -t http accounting http://127.0.0.1:7801/mcp \
  -H "x-atlas-agent-key: <ATLAS_MCP_SECRET>" \
  -H "x-atlas-user-id: tahira.sadaf@kingrevolution.com" -s user
```
Then `/mcp` shows `accounting ✓ connected`; ask e.g. *"What's our AR aging?"*.

## Tools

| Tool | Purpose |
|---|---|
| `accounting_describe` | Caller-scoped catalog + primer (call first) |
| `accounting_ar_aging` / `accounting_ap_aging` | Receivable / payable aging buckets |
| `accounting_top_contacts` | Top-N contacts by net receivable/payable |
| `accounting_contact_statement` | Statement of account for one contact |
| `accounting_voucher_summary` | Voucher counts/totals by type & status |
| `accounting_credit_limit_status` | Customers near/over credit limit |
| `accounting_netting_status` | AR/AP netting cycles by status |
| `accounting_trial_balance` | Trial balance as of a date |
| `accounting_data_freshness` | Latest data timestamp per dataset |
| `accounting_query` | **Escape hatch** — one guarded read-only SELECT |

## Configuration

See `.env.example`. Key vars: `ATLAS_MCP_SECRET` (+ `_OLD` for rotation),
`MCP_DATABASE_URL` (read-only DSN), `MCP_AUDIT_DATABASE_URL` (insert-only DSN),
`MCP_HOST`/`MCP_PORT`, and the caps (`MCP_ROW_CAP`, `MCP_BYTE_CAP`,
`MCP_STATEMENT_TIMEOUT_MS`, `MCP_HTTP_BODY_LIMIT`, `MCP_RATE_LIMIT_PER_MIN`).

## Deployment notes

- Two instances: `accounting-mcp-staging` / `accounting-mcp-prod`, own ports + env files,
  pointing at staging/prod data.
- Bind to the internal interface only; firewall the port to Atlas host IP(s); TLS
  on the endpoint. The secret must never cross links in cleartext.
- Restart policy so the service comes back automatically; alert on audit-write
  failures, deny-rate spikes, and readiness failures.

See [SECURITY.md](./SECURITY.md) for the conformance map.
