-- CreateTable: ProductReview
-- This table was defined in schema.prisma but never migrated to the database.
-- Adding all fields needed by the customer panel and admin panel.

CREATE TABLE IF NOT EXISTS "ProductReview" (
    "id"           TEXT        NOT NULL,
    "productId"    TEXT        NOT NULL,
    "orderId"      TEXT        NOT NULL,
    "customerId"   TEXT        NOT NULL,
    "customerName" TEXT        NOT NULL,
    "rating"       INTEGER     NOT NULL,
    "title"        TEXT,
    "comment"      TEXT        NOT NULL,
    "isVerified"   BOOLEAN     NOT NULL DEFAULT true,
    "helpfulCount" INTEGER     NOT NULL DEFAULT 0,
    "status"       TEXT        NOT NULL DEFAULT 'Active',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- UniqueIndex: one review per order+product combination
CREATE UNIQUE INDEX IF NOT EXISTS "ProductReview_orderId_productId_key"
    ON "ProductReview"("orderId", "productId");

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS "ProductReview_productId_idx"  ON "ProductReview"("productId");
CREATE INDEX IF NOT EXISTS "ProductReview_customerId_idx" ON "ProductReview"("customerId");
CREATE INDEX IF NOT EXISTS "ProductReview_status_idx"     ON "ProductReview"("status");
CREATE INDEX IF NOT EXISTS "ProductReview_createdAt_idx"  ON "ProductReview"("createdAt");
