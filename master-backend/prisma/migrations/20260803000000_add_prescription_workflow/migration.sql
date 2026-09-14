-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "prescriptionRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "prescriptionUrl" TEXT;
