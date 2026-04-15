/*
  Warnings:

  - A unique constraint covering the columns `[reviewToken]` on the table `netting_cycles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "netting_cycles" ADD COLUMN     "reviewToken" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "netting_cycles_reviewToken_key" ON "netting_cycles"("reviewToken");
