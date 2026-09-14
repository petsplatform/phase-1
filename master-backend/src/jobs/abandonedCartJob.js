const { masterPrisma } = require("../config/db");
const { getTenantClient } = require("../config/tenantDatabaseManager");
const { runWithTenant } = require("../config/tenantContext");
const abandonedCartService = require("../services/abandonedCartService");

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

function startAbandonedCartJob() {
  if (process.env.DISABLE_SCHEDULED_JOBS === "true") return null;
  if (process.env.DISABLE_ABANDONED_CART_JOB === "true") return null;

  const intervalMs = Number(
    process.env.ABANDONED_CART_JOB_INTERVAL_MS || DEFAULT_INTERVAL_MS,
  );
  const run = () => {
    runAbandonedCartEmailsForStores()
      .then((results) => {
        console.info("[AbandonedCartJob] Completed", results);
      })
      .catch((error) => {
        console.error("[AbandonedCartJob] Failed", error);
      });
  };

  run();
  return setInterval(run, intervalMs);
}

async function runAbandonedCartEmailsForStores() {
  if (process.env.MULTI_TENANT_ENABLED !== "true") {
    return abandonedCartService.processAbandonedCarts();
  }

  const stores = await masterPrisma.store.findMany({
    where: { status: "ACTIVE" },
  });
  const results = [];

  for (const store of stores) {
    try {
      const tenantDb = await getTenantClient(store);
      const storeResults = await runWithTenant({ db: tenantDb, store }, () =>
        abandonedCartService.processAbandonedCarts(tenantDb),
      );
      results.push({
        storeId: store.id,
        storeKey: store.storeKey,
        success: true,
        results: storeResults,
      });
    } catch (error) {
      console.error("[AbandonedCartJob] Store failed", {
        storeId: store.id,
        storeKey: store.storeKey,
        message: error.message,
      });
      results.push({
        storeId: store.id,
        storeKey: store.storeKey,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

module.exports = { runAbandonedCartEmailsForStores, startAbandonedCartJob };
