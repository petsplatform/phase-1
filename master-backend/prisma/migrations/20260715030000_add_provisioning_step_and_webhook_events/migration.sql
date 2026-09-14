ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "provisioningStep" TEXT;

CREATE TABLE IF NOT EXISTS "MasterWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "storeId" TEXT,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MasterWebhookEvent_eventId_key" ON "MasterWebhookEvent"("eventId");
CREATE INDEX IF NOT EXISTS "MasterWebhookEvent_storeId_idx" ON "MasterWebhookEvent"("storeId");
