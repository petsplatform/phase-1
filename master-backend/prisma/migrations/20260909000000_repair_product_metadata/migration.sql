UPDATE "Product"
SET "productDetails" = '{}'::jsonb
WHERE "productDetails" IS NULL;

UPDATE "Product"
SET "familyVariants" = '[]'::jsonb
WHERE "familyVariants" IS NULL;

UPDATE "Product"
SET "productType" = 'SIMPLE'
WHERE "productType" IS NULL OR trim("productType") = '';

ALTER TABLE "Product"
  ALTER COLUMN "productDetails" SET DEFAULT '{}',
  ALTER COLUMN "productDetails" SET NOT NULL,
  ALTER COLUMN "familyVariants" SET DEFAULT '[]',
  ALTER COLUMN "familyVariants" SET NOT NULL,
  ALTER COLUMN "productType" SET DEFAULT 'SIMPLE',
  ALTER COLUMN "productType" SET NOT NULL;
