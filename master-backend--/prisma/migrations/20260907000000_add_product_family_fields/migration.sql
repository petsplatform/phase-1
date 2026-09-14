ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "parentContent" TEXT,
  ADD COLUMN IF NOT EXISTS "productType" TEXT NOT NULL DEFAULT 'SIMPLE',
  ADD COLUMN IF NOT EXISTS "familyVariants" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;

UPDATE "Product"
SET "slug" = lower(regexp_replace(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) || '-' || lower(substr("id", 1, 8))
WHERE "slug" IS NULL OR trim("slug") = '';

CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");
CREATE INDEX IF NOT EXISTS "Product_productType_idx" ON "Product"("productType");
