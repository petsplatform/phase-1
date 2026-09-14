/**
 * Run this on the live server to add missing columns to all tenant DBs.
 * Usage:
 *   NODE_ENV=production node scripts/migrateLiveDb.js
 */

const path = require("path");
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
require("dotenv").config({ path: path.resolve(__dirname, "../", envFile), override: true });
require("../src/config/env");

const { getTenantClient } = require("../src/config/tenantDatabaseManager");
const { masterPrisma } = require("../src/config/db");

// Add every column that may be missing on the live tenant DBs here
const MIGRATIONS = [
  {
    column: "blockedReason",
    sql: `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "blockedReason" TEXT`,
  },
];

async function run() {
  const stores = await masterPrisma.store.findMany({ where: { status: "ACTIVE" } });
  console.log(`Found ${stores.length} active stores\n`);

  for (const store of stores) {
    console.log(`--- ${store.name} (${store.databaseName}) ---`);
    let db;
    try {
      db = await getTenantClient(store);
    } catch (err) {
      console.error(`  ✗ Could not connect: ${err.message}`);
      continue;
    }

    for (const migration of MIGRATIONS) {
      try {
        const cols = await db.$queryRawUnsafe(
          `SELECT column_name FROM information_schema.columns WHERE table_name='Customer'`
        );
        const colNames = cols.map((c) => c.column_name);

        if (!colNames.includes(migration.column)) {
          await db.$executeRawUnsafe(migration.sql);
          console.log(`  ✓ Added column: ${migration.column}`);
        } else {
          console.log(`  ✓ Already exists: ${migration.column}`);
        }
      } catch (err) {
        console.error(`  ✗ Failed [${migration.column}]: ${err.message}`);
      }
    }
  }

  await masterPrisma.$disconnect();
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
