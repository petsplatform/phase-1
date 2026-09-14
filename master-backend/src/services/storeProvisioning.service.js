const { PrismaClient } = require("@prisma/client");
const { execFileSync } = require("child_process");
const bcrypt = require("bcryptjs");
const { decryptSecret } = require("../utils/tenantCrypto");
const { masterPrisma } = require("../config/db");
const { buildTenantDatabaseUrl } = require("../config/tenantDatabaseManager");
const { sanitizeProvisioningError } = require("../utils/sanitizeError");
const ApiError = require("../utils/apiError");

function quoteIdentifier(identifier) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function adminDatabaseUrl() {
  const host = process.env.TENANT_DB_HOST || "localhost";
  const port = process.env.TENANT_DB_PORT || "5432";
  const user = encodeURIComponent(process.env.TENANT_DB_ADMIN_USER || "postgres");
  const password = encodeURIComponent(process.env.TENANT_DB_ADMIN_PASSWORD || "");
  return `postgresql://${user}:${password}@${host}:${port}/postgres?schema=public`;
}

function adminClient() {
  return new PrismaClient({ datasources: { db: { url: adminDatabaseUrl() } } });
}

async function databaseExists(db, databaseName) {
  const rows = await db.$queryRaw`SELECT 1 FROM pg_database WHERE datname = ${databaseName} LIMIT 1`;
  return rows.length > 0;
}

async function roleExists(db, roleName) {
  const rows = await db.$queryRaw`SELECT 1 FROM pg_roles WHERE rolname = ${roleName} LIMIT 1`;
  return rows.length > 0;
}

async function ensureDatabaseExists(store) {
  const db = adminClient();
  try {
    if (!(await databaseExists(db, store.databaseName))) {
      await db.$executeRawUnsafe(`CREATE DATABASE ${quoteIdentifier(store.databaseName)}`);
    }
  } finally {
    await db.$disconnect();
  }
}

async function ensureRoleExists(store) {
  const db = adminClient();
  try {
    const password = decryptSecret(store.encryptedDatabasePass);
    if (!(await roleExists(db, store.databaseUser))) {
      await db.$executeRawUnsafe(
        `CREATE ROLE ${quoteIdentifier(store.databaseUser)} LOGIN PASSWORD '${password.replace(/'/g, "''")}'`,
      );
    }
    await db.$executeRawUnsafe(
      `GRANT ALL PRIVILEGES ON DATABASE ${quoteIdentifier(store.databaseName)} TO ${quoteIdentifier(store.databaseUser)}`,
    );
  } finally {
    await db.$disconnect();
  }
}

function runTenantMigration(store) {
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: buildTenantDatabaseUrl(store) },
    shell: process.platform === "win32",
  });
}

function runTenantSeed(store) {
  execFileSync("node", ["prisma/seed.js"], {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: buildTenantDatabaseUrl(store),
      TENANT_STORE_NAME: store.name,
      TENANT_SUPPORT_EMAIL: `support+${store.storeKey.toLowerCase()}@store.local`,
    },
  });
}

async function ensureFirstAdmin(store, { adminEmail, adminPassword, adminName } = {}) {
  if (!adminEmail || !adminPassword) {
    throw new ApiError(400, "adminEmail and adminPassword are required to finish provisioning");
  }

  const admin = await masterPrisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: adminName || `${store.name} Admin`,
      email: adminEmail,
      role: "STORE_ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  await masterPrisma.userStoreAssignment.upsert({
    where: { userId_storeId: { userId: admin.id, storeId: store.id } },
    update: { role: "STORE_ADMIN", isActive: true },
    create: { userId: admin.id, storeId: store.id, role: "STORE_ADMIN", isActive: true },
  });
}

const STEP_ORDER = ["DB_CREATED", "ROLE_CREATED", "MIGRATED", "SEEDED", "ADMIN_CREATED", "DONE"];

function stepIndex(step) {
  return step ? STEP_ORDER.indexOf(step) : -1;
}

async function advanceStep(storeId, step) {
  await masterPrisma.store.update({ where: { id: storeId }, data: { provisioningStep: step } });
}

async function provisionStore(actorId, storeId, adminPayload) {
  const store = await masterPrisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new ApiError(404, "Store not found");

  await masterPrisma.store.update({ where: { id: storeId }, data: { provisioningStatus: "IN_PROGRESS" } });
  await masterPrisma.masterAuditLog.create({ data: { actorId, storeId, action: "STORE_PROVISION_STARTED" } });

  const currentIndex = stepIndex(store.provisioningStep);

  try {
    if (currentIndex < STEP_ORDER.indexOf("DB_CREATED")) {
      await service.ensureDatabaseExists(store);
      await advanceStep(storeId, "DB_CREATED");
    }
    if (currentIndex < STEP_ORDER.indexOf("ROLE_CREATED")) {
      await service.ensureRoleExists(store);
      await advanceStep(storeId, "ROLE_CREATED");
    }
    if (currentIndex < STEP_ORDER.indexOf("MIGRATED")) {
      service.runTenantMigration(store);
      await advanceStep(storeId, "MIGRATED");
    }
    if (currentIndex < STEP_ORDER.indexOf("SEEDED")) {
      service.runTenantSeed(store);
      await advanceStep(storeId, "SEEDED");
    }
    if (currentIndex < STEP_ORDER.indexOf("ADMIN_CREATED")) {
      await service.ensureFirstAdmin(store, adminPayload || {});
      await advanceStep(storeId, "ADMIN_CREATED");
    }

    const finalStore = await masterPrisma.store.update({
      where: { id: storeId },
      data: {
        status: "ACTIVE",
        provisioningStatus: "COMPLETED",
        provisioningStep: "DONE",
        provisioningError: null,
      },
    });
    await masterPrisma.masterAuditLog.create({ data: { actorId, storeId, action: "STORE_PROVISION_COMPLETED" } });
    return finalStore;
  } catch (error) {
    const message = sanitizeProvisioningError(error);
    await masterPrisma.store.update({
      where: { id: storeId },
      data: { provisioningStatus: "FAILED", provisioningError: message },
    });
    await masterPrisma.masterAuditLog.create({
      data: { actorId, storeId, action: "STORE_PROVISION_STEP_FAILED", message },
    });
    throw new ApiError(502, `Store provisioning failed: ${message}`);
  }
}

async function migrateStore(actorId, storeId) {
  const store = await masterPrisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new ApiError(404, "Store not found");
  try {
    service.runTenantMigration(store);
    await masterPrisma.masterAuditLog.create({ data: { actorId, storeId, action: "STORE_MIGRATED" } });
    return { storeId, status: "migrated" };
  } catch (error) {
    const message = sanitizeProvisioningError(error);
    await masterPrisma.masterAuditLog.create({
      data: { actorId, storeId, action: "STORE_MIGRATE_FAILED", message },
    });
    throw new ApiError(502, `Tenant migration failed: ${message}`);
  }
}

async function seedStore(actorId, storeId) {
  const store = await masterPrisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new ApiError(404, "Store not found");
  try {
    service.runTenantSeed(store);
    await masterPrisma.masterAuditLog.create({ data: { actorId, storeId, action: "STORE_SEEDED" } });
    return { storeId, status: "seeded" };
  } catch (error) {
    const message = sanitizeProvisioningError(error);
    await masterPrisma.masterAuditLog.create({
      data: { actorId, storeId, action: "STORE_SEED_FAILED", message },
    });
    throw new ApiError(502, `Tenant seed failed: ${message}`);
  }
}

const service = {
  quoteIdentifier,
  adminDatabaseUrl,
  ensureDatabaseExists,
  ensureRoleExists,
  runTenantMigration,
  runTenantSeed,
  ensureFirstAdmin,
  provisionStore,
  migrateStore,
  seedStore,
};

module.exports = service;
