CREATE TYPE "StoreStatus" AS ENUM ('PENDING', 'PROVISIONING', 'ACTIVE', 'FAILED', 'SUSPENDED');
CREATE TYPE "StoreRole" AS ENUM ('SUPER_ADMIN', 'STORE_ADMIN', 'STORE_MANAGER', 'STORE_STAFF');
CREATE TYPE "ProvisioningStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

CREATE TABLE "Store" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "storeKey" TEXT NOT NULL,
  "primaryDomain" TEXT NOT NULL,
  "databaseName" TEXT NOT NULL,
  "databaseHost" TEXT NOT NULL,
  "databasePort" INTEGER NOT NULL DEFAULT 5432,
  "databaseUser" TEXT NOT NULL,
  "encryptedDatabasePass" TEXT NOT NULL,
  "databaseSchema" TEXT NOT NULL DEFAULT 'public',
  "status" "StoreStatus" NOT NULL DEFAULT 'PENDING',
  "provisioningStatus" "ProvisioningStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "provisioningError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoreDomain" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoreDomain_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserStoreAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "role" "StoreRole" NOT NULL DEFAULT 'STORE_ADMIN',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserStoreAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MasterAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "storeId" TEXT,
  "action" TEXT NOT NULL,
  "message" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MasterAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");
CREATE UNIQUE INDEX "Store_storeKey_key" ON "Store"("storeKey");
CREATE UNIQUE INDEX "Store_primaryDomain_key" ON "Store"("primaryDomain");
CREATE INDEX "Store_status_idx" ON "Store"("status");
CREATE INDEX "Store_storeKey_idx" ON "Store"("storeKey");
CREATE UNIQUE INDEX "StoreDomain_domain_key" ON "StoreDomain"("domain");
CREATE INDEX "StoreDomain_storeId_idx" ON "StoreDomain"("storeId");
CREATE INDEX "StoreDomain_domain_idx" ON "StoreDomain"("domain");
CREATE UNIQUE INDEX "UserStoreAssignment_userId_storeId_key" ON "UserStoreAssignment"("userId", "storeId");
CREATE INDEX "UserStoreAssignment_userId_idx" ON "UserStoreAssignment"("userId");
CREATE INDEX "UserStoreAssignment_storeId_idx" ON "UserStoreAssignment"("storeId");
CREATE INDEX "MasterAuditLog_actorId_idx" ON "MasterAuditLog"("actorId");
CREATE INDEX "MasterAuditLog_storeId_idx" ON "MasterAuditLog"("storeId");
CREATE INDEX "MasterAuditLog_action_idx" ON "MasterAuditLog"("action");
CREATE INDEX "MasterAuditLog_createdAt_idx" ON "MasterAuditLog"("createdAt");

ALTER TABLE "StoreDomain" ADD CONSTRAINT "StoreDomain_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserStoreAssignment" ADD CONSTRAINT "UserStoreAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserStoreAssignment" ADD CONSTRAINT "UserStoreAssignment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MasterAuditLog" ADD CONSTRAINT "MasterAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MasterAuditLog" ADD CONSTRAINT "MasterAuditLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
