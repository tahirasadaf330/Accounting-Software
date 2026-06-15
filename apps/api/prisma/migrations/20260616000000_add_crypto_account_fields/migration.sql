ALTER TABLE "bank_accounts" ADD COLUMN "accountType" VARCHAR(10) NOT NULL DEFAULT 'BANK';
ALTER TABLE "bank_accounts" ADD COLUMN "walletAddress" VARCHAR(255);
