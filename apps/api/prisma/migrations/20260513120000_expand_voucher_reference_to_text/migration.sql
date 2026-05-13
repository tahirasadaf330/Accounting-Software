-- AlterTable
-- Widens the reference column from VARCHAR(255) to TEXT so that payment
-- vouchers with many allocated invoices can store the full auto-generated
-- reference string. This is a non-destructive change in PostgreSQL — no
-- existing data is modified or truncated.
ALTER TABLE "vouchers" ALTER COLUMN "reference" TYPE TEXT;
