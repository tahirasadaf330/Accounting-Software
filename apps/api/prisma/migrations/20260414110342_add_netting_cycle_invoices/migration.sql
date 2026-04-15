/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,contactId,startDate,endDate]` on the table `netting_cycles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "netting_cycle_invoices" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "netting_cycle_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "netting_cycle_invoices_cycleId_idx" ON "netting_cycle_invoices"("cycleId");

-- CreateIndex
CREATE INDEX "netting_cycle_invoices_voucherId_idx" ON "netting_cycle_invoices"("voucherId");

-- CreateIndex
CREATE UNIQUE INDEX "netting_cycle_invoices_cycleId_voucherId_key" ON "netting_cycle_invoices"("cycleId", "voucherId");

-- CreateIndex
CREATE UNIQUE INDEX "netting_cycles_tenantId_contactId_startDate_endDate_key" ON "netting_cycles"("tenantId", "contactId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "netting_cycle_invoices" ADD CONSTRAINT "netting_cycle_invoices_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "netting_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netting_cycle_invoices" ADD CONSTRAINT "netting_cycle_invoices_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
