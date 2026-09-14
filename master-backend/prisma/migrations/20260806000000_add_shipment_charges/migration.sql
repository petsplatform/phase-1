CREATE TABLE IF NOT EXISTS "ShipmentCharge" (
  "id"             TEXT NOT NULL,
  "label"          TEXT NOT NULL,
  "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxOrderAmount" DOUBLE PRECISION,
  "charge"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status"         "RecordStatus" NOT NULL DEFAULT 'Active',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShipmentCharge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShipmentCharge_status_idx" ON "ShipmentCharge"("status");
CREATE INDEX IF NOT EXISTS "ShipmentCharge_minOrderAmount_idx" ON "ShipmentCharge"("minOrderAmount");
