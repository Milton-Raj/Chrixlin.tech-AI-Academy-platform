-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "method" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "signature" TEXT;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'WEBSITE';

-- CreateTable
CREATE TABLE "PendingEnrollment" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "profession" TEXT NOT NULL DEFAULT '',
    "experience" TEXT NOT NULL DEFAULT '',
    "amount" INTEGER NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingEnrollment_orderId_key" ON "PendingEnrollment"("orderId");

-- CreateIndex
CREATE INDEX "PendingEnrollment_email_idx" ON "PendingEnrollment"("email");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
