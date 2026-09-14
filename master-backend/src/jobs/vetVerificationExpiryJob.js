const vetVerificationService = require("../services/vetVerificationService");
const { masterPrisma } = require("../config/db");
const { getTenantClient } = require("../config/tenantDatabaseManager");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function startVetVerificationExpiryJob() {
  if (process.env.DISABLE_SCHEDULED_JOBS === "true") return null;

  const run = () => {
    runExpiryForStores().catch((error) => {
      console.error("Vet verification expiry job failed", error);
    });
  };

  run();
  return setInterval(run, ONE_DAY_MS);
}

async function runExpiryForStores() {
  if (process.env.MULTI_TENANT_ENABLED !== "true") {
    return vetVerificationService.expireLicenses();
  }

  const stores = await masterPrisma.store.findMany({
    where: { status: "ACTIVE" },
  });

  for (const store of stores) {
    const tenantDb = await getTenantClient(store);
    await vetVerificationService.expireLicenses(tenantDb, { store });
  }
}

module.exports = { startVetVerificationExpiryJob };
