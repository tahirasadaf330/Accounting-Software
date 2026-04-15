-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentVoucherId" TEXT NOT NULL,
    "invoiceVoucherId" TEXT NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_allocations_tenantId_idx" ON "payment_allocations"("tenantId");

-- CreateIndex
CREATE INDEX "payment_allocations_tenantId_paymentVoucherId_idx" ON "payment_allocations"("tenantId", "paymentVoucherId");

-- CreateIndex
CREATE INDEX "payment_allocations_tenantId_invoiceVoucherId_idx" ON "payment_allocations"("tenantId", "invoiceVoucherId");

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_paymentVoucherId_fkey" FOREIGN KEY ("paymentVoucherId") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoiceVoucherId_fkey" FOREIGN KEY ("invoiceVoucherId") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
