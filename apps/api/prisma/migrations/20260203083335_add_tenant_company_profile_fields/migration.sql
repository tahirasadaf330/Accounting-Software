-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "country" VARCHAR(100),
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "phone" VARCHAR(50),
ADD COLUMN     "postalCode" VARCHAR(20),
ADD COLUMN     "registrationNumber" VARCHAR(100),
ADD COLUMN     "state" VARCHAR(100),
ADD COLUMN     "taxId" VARCHAR(100),
ADD COLUMN     "website" VARCHAR(255);
