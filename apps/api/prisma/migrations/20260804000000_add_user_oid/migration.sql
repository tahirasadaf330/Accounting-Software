-- Microsoft Entra object ID (oid) for Atlas MCP identity matching
-- (Hayo MCP Integration Spec §3.4): nullable, UNIQUE, write-once backfill.
ALTER TABLE "users" ADD COLUMN "oid" TEXT;
CREATE UNIQUE INDEX "users_oid_key" ON "users"("oid");
