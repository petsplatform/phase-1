const { PrismaClient } = require("@prisma/client");
const { getCurrentDb } = require("./tenantContext");
const { disconnectTenantClients } = require("./tenantDatabaseManager");

const masterDatabaseUrl = process.env.MASTER_DATABASE_URL || process.env.DATABASE_URL;
const MASTER_CONNECTION_LIMIT = process.env.MASTER_DB_CONNECTION_LIMIT || "3";
const MASTER_POOL_TIMEOUT = process.env.MASTER_DB_POOL_TIMEOUT || "10";

function withPoolParams(databaseUrl) {
  if (!databaseUrl) return databaseUrl;
  try {
    const url = new URL(databaseUrl);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", MASTER_CONNECTION_LIMIT);
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", MASTER_POOL_TIMEOUT);
    }
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

const masterPrisma = new PrismaClient(
  masterDatabaseUrl
    ? {
        datasources: {
          db: {
            url: withPoolParams(masterDatabaseUrl),
          },
        },
      }
    : undefined,
);

const prisma = new Proxy(masterPrisma, {
  get(target, prop) {
    if (prop === "$disconnect") {
      return async () => {
        await disconnectTenantClients();
        return target.$disconnect();
      };
    }
    const db = getCurrentDb() || target;
    const value = db[prop];
    return typeof value === "function" ? value.bind(db) : value;
  },
});

module.exports = { masterPrisma, prisma };
