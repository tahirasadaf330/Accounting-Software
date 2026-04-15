-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "accountManagerId" TEXT;

-- CreateTable
CREATE TABLE "account_managers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_managers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_managers_tenantId_idx" ON "account_managers"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "account_managers_tenantId_email_key" ON "account_managers"("tenantId", "email");

-- CreateIndex
CREATE INDEX "contacts_tenantId_accountManagerId_idx" ON "contacts"("tenantId", "accountManagerId");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "account_managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_managers" ADD CONSTRAINT "account_managers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
