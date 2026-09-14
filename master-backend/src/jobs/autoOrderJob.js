const { masterPrisma } = require("../config/db");
const { getTenantClient } = require("../config/tenantDatabaseManager");
const { runWithTenant } = require("../config/tenantContext");
const autoOrderService = require("../services/autoOrderService");

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

function startAutoOrderJob() {
  if (process.env.DISABLE_SCHEDULED_JOBS === "true") return null;
  if (process.env.DISABLE_AUTO_ORDER_JOB === "true") return null;

  const intervalMs = Number(
    process.env.AUTO_ORDER_JOB_INTERVAL_MS || DEFAULT_INTERVAL_MS,
  );
  const run = () => {
    runAutoOrdersForStores().catch((error) => {
      console.error("[AutoOrderJob] Failed", error);
    });
  };

  run();
  return setInterval(run, intervalMs);
}

async function runAutoOrdersForStores() {
  if (process.env.MULTI_TENANT_ENABLED !== "true") {
    return autoOrderService.processDueAutoOrders();
  }

  const stores = await masterPrisma.store.findMany({
    where: { status: "ACTIVE" },
  });
  const results = [];
  for (const store of stores) {
    try {
      const tenantDb = await getTenantClient(store);
      const storeResults = await runWithTenant({ db: tenantDb, store }, () =>
        autoOrderService.processDueAutoOrders(tenantDb),
      );
      results.push({ storeId: store.id, storeKey: store.storeKey, success: true, results: storeResults });
    } catch (error) {
      console.error("[AutoOrderJob] Store failed", {
        storeId: store.id,
        storeKey: store.storeKey,
        message: error.message,
      });
      results.push({ storeId: store.id, storeKey: store.storeKey, success: false, error: error.message });
    }
  }
  return results;
}

module.exports = { runAutoOrdersForStores, startAutoOrderJob };
