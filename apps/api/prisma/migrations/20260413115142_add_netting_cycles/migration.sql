-- CreateEnum
CREATE TYPE "NettingCycleStatus" AS ENUM ('OPEN', 'PENDING_AM', 'PENDING_CEO', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "billingCycleDays" SMALLINT,
ADD COLUMN     "billingStartDate" DATE;

-- CreateTable
CREATE TABLE "netting_cycles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" "NettingCycleStatus" NOT NULL DEFAULT 'OPEN',
    "amApprovedById" TEXT,
    "amApprovedAt" TIMESTAMP(3),
    "ceoApprovedById" TEXT,
    "ceoApprovedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "netting_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "netting_cycle_comments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "netting_cycle_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "netting_cycles_tenantId_idx" ON "netting_cycles"("tenantId");

-- CreateIndex
CREATE INDEX "netting_cycles_tenantId_contactId_idx" ON "netting_cycles"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "netting_cycles_tenantId_status_idx" ON "netting_cycles"("tenantId", "status");

-- CreateIndex
CREATE INDEX "netting_cycle_comments_cycleId_idx" ON "netting_cycle_comments"("cycleId");

-- AddForeignKey
ALTER TABLE "netting_cycles" ADD CONSTRAINT "netting_cycles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netting_cycles" ADD CONSTRAINT "netting_cycles_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netting_cycles" ADD CONSTRAINT "netting_cycles_amApprovedById_fkey" FOREIGN KEY ("amApprovedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netting_cycles" ADD CONSTRAINT "netting_cycles_ceoApprovedById_fkey" FOREIGN KEY ("ceoApprovedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netting_cycles" ADD CONSTRAINT "netting_cycles_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netting_cycle_comments" ADD CONSTRAINT "netting_cycle_comments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netting_cycle_comments" ADD CONSTRAINT "netting_cycle_comments_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "netting_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netting_cycle_comments" ADD CONSTRAINT "netting_cycle_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
