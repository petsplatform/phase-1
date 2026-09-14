CREATE TYPE "VetVerificationStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Expired');

ALTER TABLE "Customer"
  ADD COLUMN "isVetVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "vetVerifiedAt" TIMESTAMP(3);

ALTER TABLE "Product"
  ADD COLUMN "vetOnly" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "VetVerification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "clinicName" TEXT NOT NULL,
  "licenseNumber" TEXT NOT NULL,
  "licenseState" TEXT NOT NULL,
  "licenseExpiry" TIMESTAMP(3) NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "documentUrl" TEXT NOT NULL,
  "status" "VetVerificationStatus" NOT NULL DEFAULT 'Pending',
  "remarks" TEXT,
  "verifiedBy" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VetVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "userId" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VetVerification_userId_key" ON "VetVerification"("userId");
CREATE UNIQUE INDEX "VetVerification_licenseNumber_key" ON "VetVerification"("licenseNumber");
CREATE INDEX "VetVerification_status_idx" ON "VetVerification"("status");
CREATE INDEX "VetVerification_licenseExpiry_idx" ON "VetVerification"("licenseExpiry");
CREATE INDEX "VetVerification_createdAt_idx" ON "VetVerification"("createdAt");
CREATE INDEX "Customer_isVetVerified_idx" ON "Customer"("isVetVerified");
CREATE INDEX "Notification_recipient_idx" ON "Notification"("recipient");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

ALTER TABLE "VetVerification"
  ADD CONSTRAINT "VetVerification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
