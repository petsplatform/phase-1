ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "rewardPoints" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "rewardSignupGranted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "StoreSettings"
  ADD COLUMN IF NOT EXISTS "rewardsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "rewardSignupPoints" INTEGER NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS "rewardPointsPerCurrencyUnit" DOUBLE PRECISION NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "rewardPointValue" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  ADD COLUMN IF NOT EXISTS "rewardMaxRedeemPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS "rewardMinRedeemPoints" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "RewardTransaction" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "orderId" TEXT,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RewardTransaction_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RewardTransaction_customerId_fkey'
  ) THEN
    ALTER TABLE "RewardTransaction"
      ADD CONSTRAINT "RewardTransaction_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Customer_rewardPoints_idx" ON "Customer"("rewardPoints");
CREATE INDEX IF NOT EXISTS "RewardTransaction_customerId_idx" ON "RewardTransaction"("customerId");
CREATE INDEX IF NOT EXISTS "RewardTransaction_type_idx" ON "RewardTransaction"("type");
CREATE INDEX IF NOT EXISTS "RewardTransaction_orderId_idx" ON "RewardTransaction"("orderId");
CREATE INDEX IF NOT EXISTS "RewardTransaction_createdAt_idx" ON "RewardTransaction"("createdAt");
