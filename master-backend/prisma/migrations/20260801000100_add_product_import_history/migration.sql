DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ImportStatus') THEN
    CREATE TYPE "ImportStatus" AS ENUM ('Processing', 'Completed', 'Failed', 'PartialSuccess');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ImportMode') THEN
    CREATE TYPE "ImportMode" AS ENUM ('AddNew', 'UpdateExisting', 'AddOrUpdate');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "ProductImportHistory" (
  "id" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "importedBy" TEXT NOT NULL,
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "successRows" INTEGER NOT NULL DEFAULT 0,
  "failedRows" INTEGER NOT NULL DEFAULT 0,
  "status" "ImportStatus" NOT NULL DEFAULT 'Processing',
  "importMode" "ImportMode" NOT NULL DEFAULT 'AddNew',
  "durationMs" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductImportHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductImportError" (
  "id" TEXT NOT NULL,
  "importId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "sku" TEXT,
  "name" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductImportError_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductImportHistory_createdAt_idx" ON "ProductImportHistory"("createdAt");
CREATE INDEX IF NOT EXISTS "ProductImportHistory_status_idx" ON "ProductImportHistory"("status");
CREATE INDEX IF NOT EXISTS "ProductImportError_importId_idx" ON "ProductImportError"("importId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductImportError_importId_fkey'
  ) THEN
    ALTER TABLE "ProductImportError"
      ADD CONSTRAINT "ProductImportError_importId_fkey"
      FOREIGN KEY ("importId") REFERENCES "ProductImportHistory"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
