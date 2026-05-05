-- CreateTable
CREATE TABLE "business_units" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_units_tenantId_idx" ON "business_units"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "business_units_tenantId_name_key" ON "business_units"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "business_units" ADD CONSTRAINT "business_units_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "creditLimitMinThreshold" DECIMAL(20,4),
ADD COLUMN     "businessUnitId" TEXT,
ADD COLUMN     "amApprovalRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "contacts_tenantId_businessUnitId_idx" ON "contacts"("tenantId", "businessUnitId");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Seed: each existing tenant gets the default Voice and SMS business units
INSERT INTO "business_units" ("id", "tenantId", "name", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), t.id, 'Voice', true, NOW(), NOW() FROM "tenants" t;

INSERT INTO "business_units" ("id", "tenantId", "name", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), t.id, 'SMS', true, NOW(), NOW() FROM "tenants" t;
