require("dotenv").config();

const { masterPrisma } = require("../src/config/db");
const { seedStore } = require("../src/services/storeProvisioning.service");

async function main() {
  const storeArg = process.argv.find((arg) => arg.startsWith("--store="));
  const where = storeArg ? { id: storeArg.split("=")[1] } : { status: "ACTIVE" };
  const stores = await masterPrisma.store.findMany({ where, orderBy: { createdAt: "asc" } });
  let failed = false;

  for (const store of stores) {
    try {
      console.log(`[tenant:seed] ${store.id} ${store.name}`);
      await seedStore(null, store.id);
    } catch (error) {
      failed = true;
      console.error(`[tenant:seed] failed for ${store.id} ${store.name}: ${error.message}`);
      break;
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
