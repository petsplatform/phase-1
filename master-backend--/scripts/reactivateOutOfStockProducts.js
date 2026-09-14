require("dotenv").config();

const { masterPrisma } = require("../src/config/db");
const { buildTenantDatabaseUrl } = require("../src/config/tenantDatabaseManager");
const { PrismaClient } = require("@prisma/client");

async function reactivateStore(store) {
  const client = new PrismaClient({
    datasources: { db: { url: buildTenantDatabaseUrl(store) } },
  });

  try {
    await client.$connect();

    // Find products that were incorrectly deactivated when stock hit 0
    const affected = await client.product.findMany({
      where: { status: "Inactive", stock: { lte: 0 } },
      select: { id: true, name: true, stock: true },
    });

    if (affected.length === 0) {
      console.log(`  [${store.name}] No affected products found.`);
      return 0;
    }

    const result = await client.product.updateMany({
      where: { id: { in: affected.map((p) => p.id) } },
      data: { status: "Active" },
    });

    for (const p of affected) {
      console.log(`  [${store.name}] Reactivated: "${p.name}" (stock=${p.stock})`);
    }
    console.log(`  [${store.name}] Total reactivated: ${result.count}`);
    return result.count;
  } finally {
    await client.$disconnect();
  }
}

async function main() {
  const stores = await masterPrisma.store.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${stores.length} active stores.\n`);

  let total = 0;
  for (const store of stores) {
    console.log(`Processing: ${store.name} (${store.id})`);
    try {
      total += await reactivateStore(store);
    } catch (err) {
      console.error(`  [${store.name}] ERROR: ${err.message}`);
    }
  }

  console.log(`\nDone. Total products reactivated across all stores: ${total}`);
  await masterPrisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err.message);
  await masterPrisma.$disconnect();
  process.exit(1);
});
