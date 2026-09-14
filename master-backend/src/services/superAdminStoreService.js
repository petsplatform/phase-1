const bcrypt = require("bcryptjs");
const { masterPrisma } = require("../config/db");
const { encryptSecret } = require("../utils/tenantCrypto");
const { normalizeDomain } = require("../utils/domain");
const { generateDatabaseName, generateRoleName, generateStorePassword } = require("../utils/tenantCredentials");
const ApiError = require("../utils/apiError");

function publicStore(store) {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    storeKey: store.storeKey,
    primaryDomain: store.primaryDomain,
    status: store.status,
    provisioningStatus: store.provisioningStatus,
    provisioningError: store.provisioningError,
    databaseName: store.databaseName,
    databaseHost: store.databaseHost,
    databasePort: store.databasePort,
    databaseSchema: store.databaseSchema,
    domains: store.domains || [],
    users: store.users || [],
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
}

async function listStores() {
  const stores = await masterPrisma.store.findMany({
    include: {
      domains: { orderBy: { createdAt: "asc" } },
      users: { select: { id: true, userId: true, role: true, isActive: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return stores.map(publicStore);
}

async function getStore(storeId) {
  const store = await masterPrisma.store.findUnique({
    where: { id: storeId },
    include: {
      domains: { orderBy: { createdAt: "asc" } },
      users: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });
  if (!store) throw new ApiError(404, "Store not found");
  return publicStore(store);
}

async function createStore(actorId, payload) {
  const primaryDomain = normalizeDomain(payload.primaryDomain || payload.domain);
  if (!primaryDomain) throw new ApiError(400, "Primary domain is required");
  if (!payload.slug) throw new ApiError(400, "Slug is required");

  const databaseName = payload.databaseName || generateDatabaseName(payload.slug);
  const databaseUser = generateRoleName(payload.slug);
  const databasePassword = generateStorePassword();

  const store = await masterPrisma.$transaction(async (tx) => {
    const created = await tx.store.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        storeKey: payload.storeKey,
        primaryDomain,
        databaseName,
        databaseHost: payload.databaseHost || process.env.TENANT_DB_HOST || "localhost",
        databasePort: Number(payload.databasePort || process.env.TENANT_DB_PORT || 5432),
        databaseUser,
        encryptedDatabasePass: encryptSecret(databasePassword),
        databaseSchema: payload.databaseSchema || "public",
        status: "PENDING",
        domains: { create: [{ domain: primaryDomain, isPrimary: true }] },
      },
      include: { domains: true, users: true },
    });

    await tx.masterAuditLog.create({
      data: {
        actorId,
        storeId: created.id,
        action: "STORE_CREATED",
        message: "Store record created",
      },
    });

    return created;
  });

  return publicStore(store);
}

async function updateStore(actorId, storeId, payload) {
  await getStore(storeId);
  const data = {};
  [
    "name",
    "slug",
    "storeKey",
    "databaseName",
    "databaseHost",
    "databasePort",
    "databaseUser",
    "databaseSchema",
  ].forEach((field) => {
    if (payload[field] !== undefined) data[field] = payload[field];
  });
  if (payload.primaryDomain) data.primaryDomain = normalizeDomain(payload.primaryDomain);
  if (payload.databasePassword) data.encryptedDatabasePass = encryptSecret(payload.databasePassword);

  const store = await masterPrisma.store.update({
    where: { id: storeId },
    data,
    include: { domains: true, users: true },
  });
  await masterPrisma.masterAuditLog.create({
    data: { actorId, storeId, action: "STORE_UPDATED", message: "Store record updated" },
  });
  return publicStore(store);
}

async function addDomain(actorId, storeId, payload) {
  await getStore(storeId);
  const domain = normalizeDomain(payload.domain);
  if (!domain) throw new ApiError(400, "Domain is required");

  const created = await masterPrisma.storeDomain.create({
    data: { storeId, domain, isPrimary: Boolean(payload.isPrimary) },
  });
  await masterPrisma.masterAuditLog.create({
    data: { actorId, storeId, action: "STORE_DOMAIN_ADDED", message: domain },
  });
  return created;
}

async function removeDomain(actorId, storeId, domainId) {
  await masterPrisma.storeDomain.delete({ where: { id: domainId } });
  await masterPrisma.masterAuditLog.create({
    data: { actorId, storeId, action: "STORE_DOMAIN_REMOVED", message: domainId },
  });
}

async function updateStatus(actorId, storeId, status) {
  const store = await masterPrisma.store.update({
    where: { id: storeId },
    data: { status },
    include: { domains: true, users: true },
  });
  await masterPrisma.masterAuditLog.create({
    data: { actorId, storeId, action: "STORE_STATUS_UPDATED", message: status },
  });
  return publicStore(store);
}

async function assignUser(actorId, storeId, payload) {
  let user = await masterPrisma.adminUser.findUnique({ where: { email: payload.email } });
  if (!user) {
    if (!payload.password) throw new ApiError(400, "Password is required for a new store admin");
    user = await masterPrisma.adminUser.create({
      data: {
        name: payload.name || payload.email,
        email: payload.email,
        role: payload.role || "STORE_ADMIN",
        passwordHash: await bcrypt.hash(payload.password, 10),
      },
    });
  }

  const assignment = await masterPrisma.userStoreAssignment.upsert({
    where: { userId_storeId: { userId: user.id, storeId } },
    update: { role: payload.role || "STORE_ADMIN", isActive: payload.isActive ?? true },
    create: { userId: user.id, storeId, role: payload.role || "STORE_ADMIN" },
  });

  await masterPrisma.masterAuditLog.create({
    data: { actorId, storeId, action: "STORE_USER_ASSIGNED", message: user.email },
  });
  return assignment;
}

async function storeHealth(storeId, getTenantClient) {
  const store = await masterPrisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new ApiError(404, "Store not found");
  try {
    const tenantDb = await getTenantClient(store);
    await tenantDb.$queryRaw`SELECT 1`;
    return { storeId, status: "healthy" };
  } catch (error) {
    return { storeId, status: "unavailable" };
  }
}

module.exports = {
  addDomain,
  assignUser,
  createStore,
  getStore,
  listStores,
  removeDomain,
  storeHealth,
  updateStatus,
  updateStore,
};
