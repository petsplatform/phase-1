require("dotenv").config({ override: true });

const { masterPrisma } = require("../src/config/db");
const { ensureDatabaseExists } = require("../src/services/storeProvisioning.service");

async function main() {
  const storeArg = process.argv.find((arg) => arg.startsWith("--store="));
  const where = storeArg ? { id: storeArg.split("=")[1] } : {};
  const stores = await masterPrisma.store.findMany({ where, orderBy: { createdAt: "asc" } });

  for (const store of stores) {
    try {
      await ensureDatabaseExists(store);
      console.log(`[tenant:db:create] ready ${store.databaseName}`);
    } catch (error) {
      console.error(`[tenant:db:create] failed ${store.databaseName}: ${error.message}`);
      process.exitCode = 1;
    }
  }

  await masterPrisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  await masterPrisma.$disconnect();
  process.exit(1);
});
