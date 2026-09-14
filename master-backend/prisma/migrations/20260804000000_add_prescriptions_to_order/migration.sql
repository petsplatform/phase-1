-- AlterTable: add prescriptions JSON column to Order (idempotent)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "prescriptions" JSONB;
