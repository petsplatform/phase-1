DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InquiryStatus') THEN
    CREATE TYPE "InquiryStatus" AS ENUM ('New', 'InProgress', 'Resolved');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DiscountType') THEN
    CREATE TYPE "DiscountType" AS ENUM ('percentage', 'flat');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Inquiry" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "InquiryStatus" NOT NULL DEFAULT 'New',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "DiscountType" NOT NULL DEFAULT 'percentage',
  "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "minOrder" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxUses" INTEGER NOT NULL DEFAULT 100,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "expiry" TIMESTAMP(3),
  "status" "RecordStatus" NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
