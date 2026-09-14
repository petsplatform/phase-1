ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'cod';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");
