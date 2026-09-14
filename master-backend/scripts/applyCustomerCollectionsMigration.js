require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "cartItems" JSONB NOT NULL DEFAULT \'[]\'::jsonb',
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "wishlistItems" JSONB NOT NULL DEFAULT \'[]\'::jsonb',
  );

  console.log("Customer cart and wishlist columns are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
