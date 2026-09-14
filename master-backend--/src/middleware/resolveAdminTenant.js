const { masterPrisma } = require("../config/db");
const { getTenantClient } = require("../config/tenantDatabaseManager");
const { runWithTenant } = require("../config/tenantContext");
const ApiError = require("../utils/apiError");

const tenantEnabled = () => String(process.env.MULTI_TENANT_ENABLED).trim().toLowerCase() === "true";

async function resolveAdminTenant(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) throw new ApiError(401, "Invalid admin token");

    if (req.user?.role === "SUPER_ADMIN") {
      const requestedStoreKey = String(req.headers["x-store-key"] || "").trim();
      if (requestedStoreKey) {
        const store = await masterPrisma.store.findFirst({
          where: { storeKey: requestedStoreKey, status: "ACTIVE" },
        });
        if (!store) throw new ApiError(404, "Store not found");

        if (!tenantEnabled()) {
          req.tenantDb = masterPrisma;
          req.store = store;
          req.storeRole = "SUPER_ADMIN";
          return runWithTenant(
            { db: masterPrisma, store, role: "SUPER_ADMIN", userId },
            () => next(),
          );
        }

        const tenantDb = await getTenantClient(store);
        req.tenantDb = tenantDb;
        req.store = store;
        req.storeRole = "SUPER_ADMIN";
        return runWithTenant(
          { db: tenantDb, store, role: "SUPER_ADMIN", userId },
          () => next(),
        );
      }

      return runWithTenant({ db: masterPrisma, store: null, role: "SUPER_ADMIN" }, () => next());
    }

    const assignment = await masterPrisma.userStoreAssignment.findFirst({
      where: {
        userId,
        isActive: true,
        ...(req.user?.storeId ? { storeId: req.user.storeId } : {}),
      },
      include: { store: true },
      orderBy: { createdAt: "asc" },
    });

    if (!assignment) {
      if (!tenantEnabled()) {
        req.tenantDb = masterPrisma;
        return runWithTenant({ db: masterPrisma, store: null, role: req.user.role }, () => next());
      }
      throw new ApiError(403, "No active store assignment found");
    }

    if (assignment.store.status !== "ACTIVE") {
      throw new ApiError(403, "Store is inactive or suspended");
    }

    if (!tenantEnabled()) {
      req.tenantDb = masterPrisma;
      req.store = assignment.store;
      req.storeRole = assignment.role;
      return runWithTenant(
        { db: masterPrisma, store: assignment.store, role: assignment.role, userId },
        () => next(),
      );
    }

    const tenantDb = await getTenantClient(assignment.store);
    req.tenantDb = tenantDb;
    req.store = assignment.store;
    req.storeRole = assignment.role;
    return runWithTenant(
      { db: tenantDb, store: assignment.store, role: assignment.role, userId },
      () => next(),
    );
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(error.statusCode || 503, "Tenant database is unavailable"));
  }
}

module.exports = resolveAdminTenant;
