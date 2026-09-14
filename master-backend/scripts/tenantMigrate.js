require("dotenv").config();

const { masterPrisma } = require("../src/config/db");
const { migrateStore } = require("../src/services/storeProvisioning.service");

async function main() {
  const storeArg = process.argv.find((arg) => arg.startsWith("--store="));
  const storeKeyArg = process.argv.find((arg) => arg.startsWith("--store-key="));
  const stopOnError = !process.argv.includes("--continue-on-error");
  const where = storeKeyArg
    ? { storeKey: storeKeyArg.split("=")[1] }
    : storeArg
      ? { id: storeArg.split("=")[1] }
      : { status: { in: ["ACTIVE", "PENDING", "FAILED"] } };
  const stores = await masterPrisma.store.findMany({ where, orderBy: { createdAt: "asc" } });
  let failed = false;

  for (const store of stores) {
    try {
      console.log(`[tenant:migrate] ${store.id} ${store.name}`);
      await migrateStore(null, store.id);
    } catch (error) {
      failed = true;
      console.error(`[tenant:migrate] failed for ${store.id} ${store.name}: ${error.message}`);
      if (stopOnError) break;
    }
  }

  await masterPrisma.$disconnect();
  if (failed) process.exit(1);
}

main().catch(async (error) => {
  console.error(error.message);
  await masterPrisma.$disconnect();
  process.exit(1);
});
