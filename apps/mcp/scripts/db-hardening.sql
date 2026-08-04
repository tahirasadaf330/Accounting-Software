-- ============================================================================
-- Atlas MCP connector (slug: accounting) — database hardening (Guide Appendix B)
--
-- This is what makes "read-only" PHYSICAL. Run once per environment as a DB
-- superuser/owner. Two dedicated roles are created:
--
--   atlas_mcp        SELECT-only on the allow-listed tables + identity columns
--                    of `users`. default_transaction_read_only = on. Even a bug
--                    in the connector cannot write, and cannot read secrets.
--   atlas_mcp_audit  INSERT-only on mcp_audit_log (no UPDATE/DELETE/SELECT).
--
-- Passwords are injected by scripts/setup-local-db.ts (placeholders below); this
-- file never contains a real secret and is safe to commit / review as code.
--
-- The GRANT list MUST equal the UNION of tables in src/permissions/mapping.ts.
-- setup-local-db.ts fails if any mapping table is missing a grant here.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Roles (idempotent). No SUPERUSER / CREATEDB / CREATEROLE / BYPASSRLS.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'atlas_mcp') THEN
    ALTER ROLE atlas_mcp WITH LOGIN PASSWORD '__MCP_PASSWORD__' CONNECTION LIMIT 8;
  ELSE
    CREATE ROLE atlas_mcp LOGIN PASSWORD '__MCP_PASSWORD__' CONNECTION LIMIT 8;
  END IF;

  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'atlas_mcp_audit') THEN
    ALTER ROLE atlas_mcp_audit WITH LOGIN PASSWORD '__AUDIT_PASSWORD__' CONNECTION LIMIT 4;
  ELSE
    CREATE ROLE atlas_mcp_audit LOGIN PASSWORD '__AUDIT_PASSWORD__' CONNECTION LIMIT 4;
  END IF;

  -- Narrow identity writer (Spec §3.4): its ONLY write is UPDATE(azureOid) ON users.
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'atlas_mcp_oid') THEN
    ALTER ROLE atlas_mcp_oid WITH LOGIN PASSWORD '__OID_WRITER_PASSWORD__' CONNECTION LIMIT 4;
  ELSE
    CREATE ROLE atlas_mcp_oid LOGIN PASSWORD '__OID_WRITER_PASSWORD__' CONNECTION LIMIT 4;
  END IF;
END
$$;

ALTER ROLE atlas_mcp       NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
ALTER ROLE atlas_mcp_audit NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
ALTER ROLE atlas_mcp_oid   NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

-- Pin behaviour on the read-only account (belt-and-braces with the runner).
ALTER ROLE atlas_mcp SET search_path = public;
ALTER ROLE atlas_mcp SET default_transaction_read_only = on;
ALTER ROLE atlas_mcp SET statement_timeout = '30s';
ALTER ROLE atlas_mcp SET idle_in_transaction_session_timeout = '30s';

ALTER ROLE atlas_mcp_oid SET search_path = public;
ALTER ROLE atlas_mcp_oid SET statement_timeout = '10s';

-- ---------------------------------------------------------------------------
-- 2. Deny by default, then GRANT the exact allow-list.
-- ---------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM atlas_mcp;
REVOKE ALL ON SCHEMA public FROM atlas_mcp;
GRANT USAGE ON SCHEMA public TO atlas_mcp;

-- Allow-listed tables = UNION of datasets in src/permissions/mapping.ts.
-- gl
GRANT SELECT ON public.accounts               TO atlas_mcp;
GRANT SELECT ON public.journal_entries        TO atlas_mcp;
GRANT SELECT ON public.journal_entry_lines    TO atlas_mcp;
GRANT SELECT ON public.voucher_line_items     TO atlas_mcp;
GRANT SELECT ON public.account_balances       TO atlas_mcp;
-- ap_ar
GRANT SELECT ON public.vouchers               TO atlas_mcp;
GRANT SELECT ON public.payment_allocations    TO atlas_mcp;
-- contacts
GRANT SELECT ON public.contacts               TO atlas_mcp;
GRANT SELECT ON public.business_units         TO atlas_mcp;
GRANT SELECT ON public.account_managers       TO atlas_mcp;
GRANT SELECT ON public.contact_account_managers TO atlas_mcp;
-- banking
GRANT SELECT ON public.bank_accounts          TO atlas_mcp;
GRANT SELECT ON public.bank_statements        TO atlas_mcp;
GRANT SELECT ON public.bank_statement_lines   TO atlas_mcp;
GRANT SELECT ON public.reconciliations        TO atlas_mcp;
GRANT SELECT ON public.reconciliation_matches TO atlas_mcp;
-- netting
GRANT SELECT ON public.netting_cycles          TO atlas_mcp;
GRANT SELECT ON public.netting_cycle_invoices  TO atlas_mcp;
GRANT SELECT ON public.netting_cycle_comments  TO atlas_mcp;
-- reference
GRANT SELECT ON public.currencies             TO atlas_mcp;
GRANT SELECT ON public.exchange_rates         TO atlas_mcp;
GRANT SELECT ON public.fiscal_years           TO atlas_mcp;
GRANT SELECT ON public.fiscal_periods         TO atlas_mcp;

-- ---------------------------------------------------------------------------
-- 3. Identity resolution: COLUMN-scoped grant on users.
--    Only the columns needed to resolve role/tenant — NEVER passwordHash /
--    mfaSecret. A guard bypass still cannot read secrets. azureOid is the
--    Entra Object ID populated by SSO; the MCP matches the token oid against it.
-- ---------------------------------------------------------------------------
GRANT SELECT (id, email, role, "tenantId", status, "azureOid") ON public.users TO atlas_mcp;

-- Narrow identity writer (Spec §3.4 write-once backfill): can read only
-- id/email/azureOid (for the WHERE) and write ONLY the azureOid column — nothing else.
GRANT USAGE ON SCHEMA public TO atlas_mcp_oid;
GRANT SELECT (id, email, "azureOid") ON public.users TO atlas_mcp_oid;
GRANT UPDATE ("azureOid")           ON public.users TO atlas_mcp_oid;

-- Tables deliberately NOT granted (deny-by-default): users(full), refresh_tokens,
-- password_reset_tokens, invitations, notifications, audit_logs, account_templates,
-- tenants, voucher_attachments, voucher_comments*, and anything else unlisted.

-- ---------------------------------------------------------------------------
-- 4. Append-only audit log + INSERT-only writer (Guide 3.6 / A.3).
--    Retain >= 12 months. Alert on write failures.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mcp_audit_log (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),   -- DB clock, not app clock
  request_id  text,
  user_email  text,
  role        text,
  tool        text NOT NULL,
  query_text  text,                                 -- scrubbed of secret-shaped values
  relations   text[],
  row_count   integer,
  outcome     text NOT NULL CHECK (outcome IN ('ok', 'denied', 'error')),
  deny_reason text
);

CREATE INDEX IF NOT EXISTS mcp_audit_log_at_idx   ON public.mcp_audit_log (at);
CREATE INDEX IF NOT EXISTS mcp_audit_log_user_idx ON public.mcp_audit_log (user_email);

-- The read-only account has NO grants on the audit table.
REVOKE ALL ON public.mcp_audit_log FROM PUBLIC;
REVOKE ALL ON public.mcp_audit_log FROM atlas_mcp;
REVOKE ALL ON public.mcp_audit_log FROM atlas_mcp_audit;

-- The writer can only INSERT (append-only: no UPDATE/DELETE/SELECT).
GRANT USAGE ON SCHEMA public TO atlas_mcp_audit;
GRANT INSERT ON public.mcp_audit_log TO atlas_mcp_audit;
GRANT USAGE ON SEQUENCE public.mcp_audit_log_id_seq TO atlas_mcp_audit;
