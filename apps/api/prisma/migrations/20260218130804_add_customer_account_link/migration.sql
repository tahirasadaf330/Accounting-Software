-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "accountId" TEXT;

-- AlterTable
ALTER TABLE "vouchers" ADD COLUMN     "contactId" TEXT;

-- CreateIndex
CREATE INDEX "contacts_tenantId_accountId_idx" ON "contacts"("tenantId", "accountId");

-- CreateIndex
CREATE INDEX "vouchers_tenantId_contactId_idx" ON "vouchers"("tenantId", "contactId");

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
