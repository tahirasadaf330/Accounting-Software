/*
  Warnings:

  - You are about to drop the column `accountManagerId` on the `contacts` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ManagerType" AS ENUM ('IN_HOUSE', 'PARTNER');

-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_accountManagerId_fkey";

-- DropIndex
DROP INDEX "contacts_tenantId_accountManagerId_idx";

-- AlterTable
ALTER TABLE "account_managers" ADD COLUMN     "managerType" "ManagerType" NOT NULL DEFAULT 'IN_HOUSE';

-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "accountManagerId";

-- CreateTable
CREATE TABLE "contact_account_managers" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "accountManagerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_account_managers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_account_managers_contactId_idx" ON "contact_account_managers"("contactId");

-- CreateIndex
CREATE INDEX "contact_account_managers_accountManagerId_idx" ON "contact_account_managers"("accountManagerId");

-- CreateIndex
CREATE UNIQUE INDEX "contact_account_managers_contactId_accountManagerId_key" ON "contact_account_managers"("contactId", "accountManagerId");

-- CreateIndex
CREATE INDEX "account_managers_tenantId_managerType_idx" ON "account_managers"("tenantId", "managerType");

-- AddForeignKey
ALTER TABLE "contact_account_managers" ADD CONSTRAINT "contact_account_managers_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_account_managers" ADD CONSTRAINT "contact_account_managers_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "account_managers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
