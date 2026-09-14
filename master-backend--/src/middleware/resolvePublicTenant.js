const { masterPrisma } = require("../config/db");
const { getTenantClient } = require("../config/tenantDatabaseManager");
const { runWithTenant } = require("../config/tenantContext");
const ApiError = require("../utils/apiError");
const { encryptSecret } = require("../utils/tenantCrypto");
const { normalizeDomain } = require("../utils/domain");

const tenantEnabled = () => String(process.env.MULTI_TENANT_ENABLED).trim().toLowerCase() === "true";

const STATIC_PUBLIC_STORE_DOMAINS = {
  "best-vet-care.vercel.app": "STORE_1",
  "localhost": "STORE_1",
  "127.0.0.1": "STORE_1",
};

const allowEnvStoreResolution = () =>
  String(process.env.ALLOW_STORE_KEY_RESOLUTION).trim().toLowerCase() === "true";

function envValue(index, suffix) {
  return process.env[`STORE_${index}_${suffix}`];
}

function envDomainCandidates(domain) {
  const normalized = normalizeDomain(domain);
  if (!normalized) return [];

  const candidates = new Set([normalized]);
  const ipWithHyphenPort = normalized.match(/^(\d{1,3}(?:\.\d{1,3}){3})-\d+$/);
  if (ipWithHyphenPort) candidates.add(ipWithHyphenPort[1]);

  return [...candidates];
}

function envStoreFromIndex(index) {
  const storeKey = envValue(index, "KEY") || `STORE_${index}`;
  const databaseName = envValue(index, "DATABASE");
  const databaseUser = envValue(index, "DB_USER");
  const databasePassword = envValue(index, "DB_PASSWORD");

  if (!databaseName || !databaseUser || !databasePassword) return null;

  const primaryDomain = envDomainCandidates(envValue(index, "DOMAIN"))[0] || "localhost";
  return {
    id: `env-${storeKey}`,
    name: envValue(index, "NAME") || storeKey,
    slug: storeKey.toLowerCase().replace(/_/g, "-"),
    storeKey,
    primaryDomain,
    databaseName,
    databaseHost: process.env.TENANT_DB_HOST || "localhost",
    databasePort: Number(process.env.TENANT_DB_PORT || 5432),
    databaseUser,
    encryptedDatabasePass: encryptSecret(databasePassword),
    databaseSchema: "public",
    status: "ACTIVE",
  };
}

function findEnvStoreByKey(storeKey) {
  if (!allowEnvStoreResolution() || !storeKey) return null;

  const requestedKey = String(storeKey).toUpperCase();
  for (let index = 1; index <= 7; index += 1) {
    const envStoreKey = envValue(index, "KEY") || `STORE_${index}`;
    if (String(envStoreKey).toUpperCase() === requestedKey) {
      return envStoreFromIndex(index);
    }
  }

  return null;
}

function findEnvStoreByDomain(domain) {
  if (!allowEnvStoreResolution() || !domain) return null;

  for (let index = 1; index <= 7; index += 1) {
    if (envDomainCandidates(envValue(index, "DOMAIN")).includes(domain)) {
      return envStoreFromIndex(index);
    }
  }

  return null;
}

function decodeOAuthState(value) {
  if (!value) return {};
  try {
    return JSON.parse(Buffer.from(String(value), "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

function isStoreOnePublicMasterFallback(store, req) {
  if (String(store?.storeKey || "").toUpperCase() !== "STORE_1") return false;
  return String(process.env.PUBLIC_STORE_1_USE_MASTER || "").trim().toLowerCase() === "true";
}

function useMasterTenant(req, store, next) {
  req.tenantDb = masterPrisma;
  req.store = store;
  return runWithTenant({ db: masterPrisma, store, public: true }, () => next());
}

async function findStoreByKey(storeKey) {
  if (!storeKey) return null;
  const store = await masterPrisma.store.findFirst({
    where: { storeKey: String(storeKey).toUpperCase(), status: "ACTIVE" },
  });
  return store || findEnvStoreByKey(storeKey);
}

async function findStoreForRequest(req) {
  const stateData = decodeOAuthState(req.query?.state);
  const originDomain = normalizeDomain(req.headers.origin);
  const headerDomain = normalizeDomain(req.headers["x-store-domain"]);
  const queryDomain = normalizeDomain(req.query?.storeDomain);
  const stateDomain = normalizeDomain(stateData.storeDomain);
  const storeKey = req.headers["x-store-key"] || req.query?.storeKey || stateData.storeKey;

  if (storeKey) {
    const store = await findStoreByKey(storeKey);
    if (store) return store;
  }

  if (originDomain || headerDomain || queryDomain || stateDomain) {
    const domains = [headerDomain, originDomain, queryDomain, stateDomain].filter(Boolean);
    for (const domain of domains) {
      const staticStore = await findStoreByKey(STATIC_PUBLIC_STORE_DOMAINS[domain]);
      if (staticStore) return staticStore;

      const storeDomain = await masterPrisma.storeDomain.findFirst({
        where: {
          domain,
          isActive: true,
          store: { status: "ACTIVE" },
        },
        include: { store: true },
      });
      if (storeDomain) return storeDomain.store;

      const envStore = findEnvStoreByDomain(domain);
      if (envStore) return envStore;
    }
  }

  return null;
}

async function resolvePublicTenant(req, res, next) {
  try {
    const store = await findStoreForRequest(req);
    if (!store) {
      if (!tenantEnabled()) {
        req.tenantDb = masterPrisma;
        return runWithTenant({ db: masterPrisma, store: null, public: true }, () => next());
      }
      throw new ApiError(403, "Unknown or inactive store domain");
    }

    if (!tenantEnabled()) {
      return useMasterTenant(req, store, next);
    }

    if (isStoreOnePublicMasterFallback(store, req)) {
      return useMasterTenant(req, store, next);
    }

    try {
      const tenantDb = await getTenantClient(store);
      req.tenantDb = tenantDb;
      req.store = store;
      return runWithTenant({ db: tenantDb, store, public: true }, () => next());
    } catch (error) {
      if (String(store.storeKey).toUpperCase() === "STORE_1") {
        req.tenantDb = masterPrisma;
        req.store = store;
        return runWithTenant({ db: masterPrisma, store, public: true }, () => next());
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(error.statusCode || 503, "Tenant database is unavailable"));
  }
}

module.exports = resolvePublicTenant;
