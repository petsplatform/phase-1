const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const migrationName = "20260710000000_add_product_options";
  const migrationPath = path.join(__dirname, "..", "prisma", "migrations", migrationName, "migration.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf8");
  const checksum = crypto.createHash("sha256").update(migrationSql).digest("hex");

  await prisma.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "optionType" TEXT NOT NULL DEFAULT \'size\'');
  await prisma.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "optionLabel" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "capacities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]');
  await prisma.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "colorVariants" JSONB');

  await prisma.$executeRawUnsafe(`
    INSERT INTO "_prisma_migrations" (
      "id",
      "checksum",
      "finished_at",
      "migration_name",
      "logs",
      "rolled_back_at",
      "started_at",
      "applied_steps_count"
    )
    SELECT
      $3,
      $1,
      NOW(),
      $2,
      NULL,
      NULL,
      NOW(),
      4
    WHERE NOT EXISTS (
      SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = $2
    )
  `, checksum, migrationName, crypto.randomUUID());

  console.log("Product option columns are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
