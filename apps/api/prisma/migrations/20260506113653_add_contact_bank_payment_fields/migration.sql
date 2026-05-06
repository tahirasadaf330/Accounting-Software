-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WIRE', 'ACH');

-- CreateEnum
CREATE TYPE "AccountClassification" AS ENUM ('PREPAYMENT', 'POSTPAYMENT');

-- DropForeignKey
ALTER TABLE "business_units" DROP CONSTRAINT "business_units_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_businessUnitId_fkey";

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "accountClassification" "AccountClassification",
ADD COLUMN     "bankAccountNumber" VARCHAR(100),
ADD COLUMN     "bankAddress" TEXT,
ADD COLUMN     "bankIban" VARCHAR(50),
ADD COLUMN     "bankName" VARCHAR(255),
ADD COLUMN     "bankRoutingNumber" VARCHAR(50),
ADD COLUMN     "bankSwiftCode" VARCHAR(50),
ADD COLUMN     "paymentMethod" "PaymentMethod";

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_units" ADD CONSTRAINT "business_units_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
