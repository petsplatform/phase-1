CREATE TYPE "ShipmentStatus" AS ENUM ('Pending', 'Packed', 'ReadyToShip', 'Shipped', 'InTransit', 'OutForDelivery', 'Delivered', 'Cancelled', 'Returned', 'FailedDelivery');

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "courierName" TEXT,
  ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "awbNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "trackingUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "shipmentStatus" "ShipmentStatus" NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS "shipmentCreatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "outForDeliveryAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "estimatedDeliveryDate" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "ShipmentHistory" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "ShipmentStatus" NOT NULL,
  "location" TEXT,
  "description" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShipmentHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Courier" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "trackingUrlPattern" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Courier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ShipmentSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "defaultCourierId" TEXT,
  "defaultEstimatedDeliveryDays" INTEGER NOT NULL DEFAULT 5,
  "enableEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
  "enableSmsNotifications" BOOLEAN NOT NULL DEFAULT false,
  "enablePushNotifications" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShipmentSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Order_trackingNumber_key" ON "Order"("trackingNumber");
CREATE INDEX IF NOT EXISTS "Order_shipmentStatus_idx" ON "Order"("shipmentStatus");
CREATE INDEX IF NOT EXISTS "Order_courierName_idx" ON "Order"("courierName");
CREATE INDEX IF NOT EXISTS "ShipmentHistory_orderId_idx" ON "ShipmentHistory"("orderId");
CREATE INDEX IF NOT EXISTS "ShipmentHistory_status_idx" ON "ShipmentHistory"("status");
CREATE INDEX IF NOT EXISTS "ShipmentHistory_createdAt_idx" ON "ShipmentHistory"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Courier_name_key" ON "Courier"("name");
CREATE INDEX IF NOT EXISTS "Courier_status_idx" ON "Courier"("status");
CREATE INDEX IF NOT EXISTS "Courier_name_idx" ON "Courier"("name");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ShipmentHistory_orderId_fkey'
  ) THEN
    ALTER TABLE "ShipmentHistory"
      ADD CONSTRAINT "ShipmentHistory_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "Courier" ("id", "name", "trackingUrlPattern", "status", "updatedAt")
VALUES
  ('courier-blue-dart', 'Blue Dart', 'https://www.bluedart.com/tracking/{trackingNumber}', 'Active', CURRENT_TIMESTAMP),
  ('courier-dtdc', 'DTDC', 'https://www.dtdc.in/tracking/{trackingNumber}', 'Active', CURRENT_TIMESTAMP),
  ('courier-fedex', 'FedEx', 'https://www.fedex.com/apps/fedextrack/?tracknumbers={trackingNumber}', 'Active', CURRENT_TIMESTAMP),
  ('courier-dhl', 'DHL', 'https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id={trackingNumber}', 'Active', CURRENT_TIMESTAMP),
  ('courier-ups', 'UPS', 'https://www.ups.com/track?tracknum={trackingNumber}', 'Active', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "ShipmentSettings" ("id", "defaultEstimatedDeliveryDays", "enableEmailNotifications", "enableSmsNotifications", "enablePushNotifications", "updatedAt")
VALUES ('default', 5, true, false, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
