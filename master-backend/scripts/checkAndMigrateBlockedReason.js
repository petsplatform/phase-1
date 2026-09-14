require("dotenv").config({ override: true });
require("../src/config/env");

const { getTenantClient } = require("../src/config/tenantDatabaseManager");
const { masterPrisma } = require("../src/config/db");

async function run() {
  const stores = await masterPrisma.store.findMany({ where: { status: "ACTIVE" } });
  console.log(`Found ${stores.length} active stores\n`);

  for (const store of stores) {
    const db = await getTenantClient(store);
    try {
      // Check existing columns
      const cols = await db.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_name='Customer' ORDER BY ordinal_position`
      );
      const colNames = cols.map((c) => c.column_name);
      console.log(`${store.name} (${store.databaseName}) columns: ${colNames.join(", ")}`);

      // Add blockedReason if missing
      if (!colNames.includes("blockedReason")) {
        await db.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "blockedReason" TEXT`);
        console.log(`  ✓ Added blockedReason column`);
      } else {
        console.log(`  ✓ blockedReason already exists`);
      }
    } catch (err) {
      console.error(`  ✗ ${store.name}: ${err.message}`);
    }
  }

  await masterPrisma.$disconnect();
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
