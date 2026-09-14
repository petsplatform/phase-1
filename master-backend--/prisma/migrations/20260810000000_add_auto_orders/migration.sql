CREATE TYPE "AutoOrderStatus" AS ENUM (
  'ACTIVE',
  'PAUSED',
  'PAYMENT_FAILED',
  'OUT_OF_STOCK',
  'PRESCRIPTION_REQUIRED',
  'CANCELLED',
  'COMPLETED'
);

CREATE TYPE "AutoOrderFrequencyType" AS ENUM ('DAYS');

CREATE TYPE "AutoOrderExecutionStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SUCCESS',
  'PAYMENT_FAILED',
  'OUT_OF_STOCK',
  'PRESCRIPTION_REQUIRED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "AutoOrderPaymentStatus" AS ENUM (
  'NOT_ATTEMPTED',
  'REQUIRES_PAYMENT_METHOD',
  'PROCESSING',
  'PAID',
  'FAILED'
);

CREATE TABLE "AutoOrder" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT,
  "variantLabel" TEXT,
  "quantity" INTEGER NOT NULL,
  "frequencyType" "AutoOrderFrequencyType" NOT NULL DEFAULT 'DAYS',
  "frequencyValue" INTEGER NOT NULL,
  "firstOrderDate" TIMESTAMP(3) NOT NULL,
  "nextOrderDate" TIMESTAMP(3) NOT NULL,
  "lastOrderDate" TIMESTAMP(3),
  "shippingAddressIndex" INTEGER NOT NULL,
  "shippingAddressSnapshot" JSONB,
  "paymentMethod" TEXT NOT NULL DEFAULT 'stripe',
  "paymentMethodReference" TEXT,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "status" "AutoOrderStatus" NOT NULL DEFAULT 'ACTIVE',
  "autoRenew" BOOLEAN NOT NULL DEFAULT true,
  "failureReason" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AutoOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutoOrderExecution" (
  "id" TEXT NOT NULL,
  "autoOrderId" TEXT NOT NULL,
  "orderId" TEXT,
  "scheduledDate" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),
  "status" "AutoOrderExecutionStatus" NOT NULL DEFAULT 'PENDING',
  "paymentStatus" "AutoOrderPaymentStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED',
  "orderStatus" "OrderStatus",
  "stripePaymentIntentId" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AutoOrderExecution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AutoOrder_customerId_idx" ON "AutoOrder"("customerId");
CREATE INDEX "AutoOrder_productId_idx" ON "AutoOrder"("productId");
CREATE INDEX "AutoOrder_status_idx" ON "AutoOrder"("status");
CREATE INDEX "AutoOrder_nextOrderDate_idx" ON "AutoOrder"("nextOrderDate");
CREATE INDEX "AutoOrder_status_nextOrderDate_idx" ON "AutoOrder"("status", "nextOrderDate");

CREATE UNIQUE INDEX "AutoOrderExecution_autoOrderId_scheduledDate_key" ON "AutoOrderExecution"("autoOrderId", "scheduledDate");
CREATE UNIQUE INDEX "AutoOrderExecution_stripePaymentIntentId_key" ON "AutoOrderExecution"("stripePaymentIntentId");
CREATE INDEX "AutoOrderExecution_autoOrderId_idx" ON "AutoOrderExecution"("autoOrderId");
CREATE INDEX "AutoOrderExecution_orderId_idx" ON "AutoOrderExecution"("orderId");
CREATE INDEX "AutoOrderExecution_scheduledDate_idx" ON "AutoOrderExecution"("scheduledDate");
CREATE INDEX "AutoOrderExecution_status_idx" ON "AutoOrderExecution"("status");

ALTER TABLE "AutoOrder"
  ADD CONSTRAINT "AutoOrder_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutoOrder"
  ADD CONSTRAINT "AutoOrder_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AutoOrderExecution"
  ADD CONSTRAINT "AutoOrderExecution_autoOrderId_fkey"
  FOREIGN KEY ("autoOrderId") REFERENCES "AutoOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutoOrderExecution"
  ADD CONSTRAINT "AutoOrderExecution_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
