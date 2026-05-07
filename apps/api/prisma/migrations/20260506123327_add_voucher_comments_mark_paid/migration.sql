-- AlterTable
ALTER TABLE "voucher_attachments" ADD COLUMN     "category" VARCHAR(50);

-- AlterTable
ALTER TABLE "vouchers" ADD COLUMN     "markedPaidAt" TIMESTAMP(3),
ADD COLUMN     "markedPaidById" TEXT;

-- CreateTable
CREATE TABLE "voucher_comments" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_comment_attachments" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileName" VARCHAR(500) NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_comment_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voucher_comments_voucherId_idx" ON "voucher_comments"("voucherId");

-- CreateIndex
CREATE INDEX "voucher_comments_tenantId_idx" ON "voucher_comments"("tenantId");

-- CreateIndex
CREATE INDEX "voucher_comment_attachments_commentId_idx" ON "voucher_comment_attachments"("commentId");

-- CreateIndex
CREATE INDEX "voucher_comment_attachments_tenantId_idx" ON "voucher_comment_attachments"("tenantId");

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_markedPaidById_fkey" FOREIGN KEY ("markedPaidById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_comments" ADD CONSTRAINT "voucher_comments_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_comments" ADD CONSTRAINT "voucher_comments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_comments" ADD CONSTRAINT "voucher_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_comment_attachments" ADD CONSTRAINT "voucher_comment_attachments_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "voucher_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_comment_attachments" ADD CONSTRAINT "voucher_comment_attachments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
