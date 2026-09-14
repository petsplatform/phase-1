const { PrismaClient } = require("@prisma/client");
const { decryptSecret } = require("../utils/tenantCrypto");

const tenantClients = new Map();
const pendingClients = new Map();
const MAX_TENANT_CLIENTS = Number(process.env.TENANT_CLIENT_CACHE_SIZE || 25);
const TENANT_CONNECTION_LIMIT = process.env.TENANT_DB_CONNECTION_LIMIT || "2";
const TENANT_POOL_TIMEOUT = process.env.TENANT_DB_POOL_TIMEOUT || "10";

function withPoolParams(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", TENANT_CONNECTION_LIMIT);
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", TENANT_POOL_TIMEOUT);
    }
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

function buildTenantDatabaseUrl(store) {
  const password = decryptSecret(store.encryptedDatabasePass);
  const user = encodeURIComponent(store.databaseUser);
  const pass = encodeURIComponent(password);
  const database = encodeURIComponent(store.databaseName);
  const schema = encodeURIComponent(store.databaseSchema || "public");
  return withPoolParams(
    `postgresql://${user}:${pass}@${store.databaseHost}:${store.databasePort || 5432}/${database}?schema=${schema}`,
  );
}

function assertUsableStore(store) {
  if (!store) throw new Error("Store is required");
  if (store.status !== "ACTIVE") {
    const error = new Error("Store is not active");
    error.statusCode = 403;
    throw error;
  }
}

async function evictOldestClient() {
  if (tenantClients.size < MAX_TENANT_CLIENTS) return;
  const [storeId, entry] = tenantClients.entries().next().value || [];
  if (!storeId || !entry) return;
  tenantClients.delete(storeId);
  await entry.client.$disconnect().catch(() => undefined);
}

async function createTenantClient(store) {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: buildTenantDatabaseUrl(store),
      },
    },
  });
  await client.$connect();
  return client;
}

async function getTenantClient(store) {
  assertUsableStore(store);
  const cached = tenantClients.get(store.id);
  if (cached) {
    cached.lastUsedAt = Date.now();
    return cached.client;
  }

  const pending = pendingClients.get(store.id);
  if (pending) return pending;

  const promise = (async () => {
    await evictOldestClient();
    const client = await createTenantClient(store);
    tenantClients.set(store.id, { client, lastUsedAt: Date.now() });
    pendingClients.delete(store.id);
    return client;
  })().catch((error) => {
    pendingClients.delete(store.id);
    error.statusCode = error.statusCode || 503;
    throw error;
  });

  pendingClients.set(store.id, promise);
  return promise;
}

async function disconnectTenantClients() {
  const clients = [...tenantClients.values()].map((entry) => entry.client);
  tenantClients.clear();
  pendingClients.clear();
  await Promise.all(clients.map((client) => client.$disconnect().catch(() => undefined)));
}

module.exports = {
  buildTenantDatabaseUrl,
  disconnectTenantClients,
  getTenantClient,
};
