/**
 * Migration: Add blockedReason column to Customer table in all 7 store DBs
 * Run: node scripts/addBlockedReasonToCustomers.js
 */
const { PrismaClient } = require("@prisma/client");
const { buildTenantDatabaseUrl } = require("../src/utils/tenantCredentials");
const { masterPrisma } = require("../src/config/db");

async function run() {
  const stores = await masterPrisma.store.findMany({ where: { status: "ACTIVE" } });
  console.log(`Found ${stores.length} active stores`);

  for (const store of stores) {
    const url = buildTenantDatabaseUrl(store);
    const client = new PrismaClient({ datasources: { db: { url } } });
    try {
      await client.$executeRawUnsafe(
        `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "blockedReason" TEXT`
      );
      console.log(`✓ ${store.name}: blockedReason column added`);
    } catch (err) {
      console.error(`✗ ${store.name}: ${err.message}`);
    } finally {
      await client.$disconnect();
    }
  }

  await masterPrisma.$disconnect();
  console.log("Done.");
}

run().catch((err) => { console.error(err); process.exit(1); });
