# Webhook Tenant Fix + Real Store Provisioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Stripe webhook so it resolves and updates the correct tenant database, and replace the stubbed Super Admin provisioning endpoints with a real, retryable, idempotent provisioning pipeline (create DB → create dedicated Postgres role → migrate → seed → create first admin).

**Architecture:** A new `src/services/storeProvisioning.service.js` owns every provisioning step as an individually idempotent, individually testable function; a `provisionStore` orchestrator persists `Store.provisioningStep` after each success so a retry resumes instead of restarting. The Super Admin API and the existing CLI scripts both call into this same service so they can't drift apart. The webhook controller gains tenant resolution (via `metadata.storeId` on the Stripe PaymentIntent, set at creation time) and event-id based idempotency via a new `MasterWebhookEvent` table.

**Tech Stack:** Node.js (CommonJS), Express 5, Prisma 6.19 (`@prisma/client`), Jest 30, zod, bcryptjs, Stripe SDK. All existing conventions in `Admin-pannel-backend`.

## Global Constraints

- No new runtime dependencies (no Redis, no job queue) — provisioning is synchronous and step-tracked, per the approved design.
- Every tenant database gets a dedicated Postgres role, scoped to only that database — per the approved design.
- Never return `encryptedDatabasePass` or a raw database password in any API response.
- `TENANT_DB_ADMIN_USER` must have `CREATEDB` and `CREATEROLE` on the Postgres server (a manual DBA prerequisite, documented in Task 10 — not automated).
- Follow existing test convention exactly: Jest with fully mocked Prisma clients (`jest.mock("../../src/config/db", ...)` etc.) — no tests hit a real database.
- Follow existing migration convention: hand-written `migration.sql` with `IF NOT EXISTS` guards under `prisma/migrations/<timestamp>_<name>/`, not `prisma migrate dev`'s interactive generation.
- CommonJS (`require`/`module.exports`) throughout — this codebase does not use ESM.

---

### Task 1: Prisma schema — `provisioningStep` field and `MasterWebhookEvent` model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260715030000_add_provisioning_step_and_webhook_events/migration.sql`

**Interfaces:**
- Produces: `Store.provisioningStep` (`String?`), `MasterWebhookEvent` model (`id`, `provider`, `eventId` unique, `storeId?`, `type`, `processedAt`) — both used by Task 5 (`storeProvisioning.service.js`) and Task 9 (`webhookController.js`).

- [ ] **Step 1: Add `provisioningStep` to `Store` and add the `MasterWebhookEvent` model**

In `prisma/schema.prisma`, find the `Store` model and add the field right after `provisioningError`:

```prisma
model Store {
  id                    String             @id @default(uuid())
  name                  String
  slug                  String             @unique
  storeKey              String             @unique
  primaryDomain         String             @unique
  databaseName          String
  databaseHost          String
  databasePort          Int                @default(5432)
  databaseUser          String
  encryptedDatabasePass String
  databaseSchema        String             @default("public")
  status                StoreStatus        @default(PENDING)
  provisioningStatus    ProvisioningStatus @default(NOT_STARTED)
  provisioningError     String?
  provisioningStep      String?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  users     UserStoreAssignment[]
  domains   StoreDomain[]
  auditLogs MasterAuditLog[]

  @@index([status])
  @@index([storeKey])
}
```

Then add a new model anywhere after `MasterAuditLog`:

```prisma
model MasterWebhookEvent {
  id          String   @id @default(uuid())
  provider    String
  eventId     String   @unique
  storeId     String?
  type        String
  processedAt DateTime @default(now())

  @@index([storeId])
}
```

- [ ] **Step 2: Write the migration SQL**

Create `prisma/migrations/20260715030000_add_provisioning_step_and_webhook_events/migration.sql`:

```sql
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "provisioningStep" TEXT;

CREATE TABLE IF NOT EXISTS "MasterWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "storeId" TEXT,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MasterWebhookEvent_eventId_key" ON "MasterWebhookEvent"("eventId");
CREATE INDEX IF NOT EXISTS "MasterWebhookEvent_storeId_idx" ON "MasterWebhookEvent"("storeId");
```

- [ ] **Step 3: Generate the Prisma client and apply the migration to the master database**

Run:
```bash
npx prisma generate
npx prisma migrate deploy
```
Expected: both commands exit 0; the generated client now has `prisma.masterWebhookEvent` and `store.provisioningStep` in its types.

- [ ] **Step 4: Apply the same migration to every existing tenant database**

Run:
```bash
npm run tenant:migrate:all
```
Expected: `[tenant:migrate] <id> <name>` logged once per existing store, exit code 0. (This applies the new columns/table to tenant DBs too — harmless, matching the existing shared-schema design noted in the spec.)

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260715030000_add_provisioning_step_and_webhook_events
git commit -m "feat: add Store.provisioningStep and MasterWebhookEvent model"
```
(If this project is not a git repository, skip this step — confirmed during audit that neither `Admin-pannel-backend` nor `E-Commerce-Admin-Panel` currently has git history.)

---

### Task 2: `tenantCredentials` and `sanitizeError` utils

**Files:**
- Create: `src/utils/tenantCredentials.js`
- Create: `src/utils/sanitizeError.js`
- Test: `tests/utils/tenantCredentials.test.js`
- Test: `tests/utils/sanitizeError.test.js`

**Interfaces:**
- Produces: `generateDatabaseName(slug): string`, `generateRoleName(slug): string`, `generateStorePassword(): string`, `slugToIdentifier(slug): string` from `tenantCredentials.js`; `sanitizeProvisioningError(error): string` from `sanitizeError.js`. Used by Task 3 (`ensureRoleExists`), Task 5 (`provisionStore`/`migrateStore`/`seedStore`), Task 6 (`superAdminStoreService.createStore`), Task 7 (`provisionSevenStores.js`).

- [ ] **Step 1: Write the failing tests**

Create `tests/utils/tenantCredentials.test.js`:

```js
const {
  slugToIdentifier,
  generateDatabaseName,
  generateRoleName,
  generateStorePassword,
} = require("../../src/utils/tenantCredentials");

describe("slugToIdentifier", () => {
  it("lowercases and replaces hyphens with underscores", () => {
    expect(slugToIdentifier("store-1")).toBe("store_1");
  });

  it("strips characters that are not letters, digits, or underscores", () => {
    expect(slugToIdentifier("Best Vet Care!")).toBe("best_vet_care");
  });
});

describe("generateDatabaseName", () => {
  it("prefixes the identifier with store_", () => {
    expect(generateDatabaseName("store-1")).toBe("store_store_1");
  });
});

describe("generateRoleName", () => {
  it("prefixes the identifier with store_ and suffixes _app", () => {
    expect(generateRoleName("store-1")).toBe("store_store_1_app");
  });
});

describe("generateStorePassword", () => {
  it("generates a sufficiently long random password each time", () => {
    const first = generateStorePassword();
    const second = generateStorePassword();
    expect(first).not.toEqual(second);
    expect(first.length).toBeGreaterThanOrEqual(24);
  });
});
```

Create `tests/utils/sanitizeError.test.js`:

```js
const { sanitizeProvisioningError } = require("../../src/utils/sanitizeError");

describe("sanitizeProvisioningError", () => {
  it("redacts a postgres connection string embedded in an Error message", () => {
    const error = new Error(
      "connection to postgresql://admin:S3cret@db-host:5432/postgres failed: timeout",
    );
    const result = sanitizeProvisioningError(error);
    expect(result).not.toContain("S3cret");
    expect(result).not.toContain("db-host");
    expect(result).toContain("postgresql://[redacted]");
  });

  it("accepts a plain string in addition to an Error object", () => {
    expect(sanitizeProvisioningError("plain failure")).toBe("plain failure");
  });

  it("truncates very long messages", () => {
    const result = sanitizeProvisioningError("x".repeat(1000));
    expect(result.length).toBeLessThanOrEqual(500);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/utils/tenantCredentials.test.js tests/utils/sanitizeError.test.js`
Expected: FAIL with `Cannot find module '../../src/utils/tenantCredentials'` (and the same for `sanitizeError`).

- [ ] **Step 3: Implement `src/utils/tenantCredentials.js`**

```js
const crypto = require("crypto");

function slugToIdentifier(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function generateDatabaseName(slug) {
  return `store_${slugToIdentifier(slug)}`;
}

function generateRoleName(slug) {
  return `store_${slugToIdentifier(slug)}_app`;
}

function generateStorePassword() {
  return crypto.randomBytes(24).toString("base64url");
}

module.exports = {
  slugToIdentifier,
  generateDatabaseName,
  generateRoleName,
  generateStorePassword,
};
```

- [ ] **Step 4: Implement `src/utils/sanitizeError.js`**

```js
function sanitizeProvisioningError(error) {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "postgresql://[redacted]")
    .replace(/password[=:]\s*\S+/gi, "password=[redacted]")
    .slice(0, 500);
}

module.exports = { sanitizeProvisioningError };
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest tests/utils/tenantCredentials.test.js tests/utils/sanitizeError.test.js`
Expected: PASS, 7 tests total.

- [ ] **Step 6: Commit**

```bash
git add src/utils/tenantCredentials.js src/utils/sanitizeError.js tests/utils/tenantCredentials.test.js tests/utils/sanitizeError.test.js
git commit -m "feat: add tenant credential generation and error sanitization utils"
```

---

### Task 3: `storeProvisioning.service.js` — database and role creation steps

**Files:**
- Create: `src/services/storeProvisioning.service.js`
- Test: `tests/services/storeProvisioning.service.test.js`

**Interfaces:**
- Consumes: `decryptSecret` from `src/utils/tenantCrypto.js` (existing).
- Produces: `service.ensureDatabaseExists(store): Promise<void>`, `service.ensureRoleExists(store): Promise<void>`, `service.quoteIdentifier(identifier): string`, `service.adminDatabaseUrl(): string` — where `store` has at least `{ databaseName, databaseUser, encryptedDatabasePass }`. Exported as a single `service` object (not individual `module.exports` destructuring) so later tasks can `jest.spyOn(service, "ensureDatabaseExists")` to mock steps when testing the orchestrator in Task 5.

- [ ] **Step 1: Write the failing tests**

Create `tests/services/storeProvisioning.service.test.js`:

```js
const mockAdminClient = {
  $queryRaw: jest.fn(),
  $executeRawUnsafe: jest.fn(),
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockAdminClient),
}));

jest.mock("../../src/utils/tenantCrypto", () => ({
  decryptSecret: jest.fn(() => "generated-password"),
}));

const storeProvisioningService = require("../../src/services/storeProvisioning.service");

describe("storeProvisioningService.ensureDatabaseExists", () => {
  beforeEach(() => {
    mockAdminClient.$queryRaw.mockReset();
    mockAdminClient.$executeRawUnsafe.mockReset();
    mockAdminClient.$disconnect.mockClear();
  });

  const store = { databaseName: "store_test", databaseUser: "store_test_app", encryptedDatabasePass: "enc" };

  it("creates the database when it does not exist", async () => {
    mockAdminClient.$queryRaw.mockResolvedValue([]);

    await storeProvisioningService.ensureDatabaseExists(store);

    expect(mockAdminClient.$executeRawUnsafe).toHaveBeenCalledWith('CREATE DATABASE "store_test"');
    expect(mockAdminClient.$disconnect).toHaveBeenCalled();
  });

  it("skips creation when the database already exists", async () => {
    mockAdminClient.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    await storeProvisioningService.ensureDatabaseExists(store);

    expect(mockAdminClient.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it("rejects an unsafe database name before issuing any SQL", async () => {
    await expect(
      storeProvisioningService.ensureDatabaseExists({ ...store, databaseName: "bad; DROP TABLE x;" }),
    ).rejects.toThrow("Unsafe identifier");
  });
});

describe("storeProvisioningService.ensureRoleExists", () => {
  beforeEach(() => {
    mockAdminClient.$queryRaw.mockReset();
    mockAdminClient.$executeRawUnsafe.mockReset();
  });

  const store = { databaseName: "store_test", databaseUser: "store_test_app", encryptedDatabasePass: "enc" };

  it("creates the role and grants access when the role does not exist", async () => {
    mockAdminClient.$queryRaw.mockResolvedValue([]);

    await storeProvisioningService.ensureRoleExists(store);

    expect(mockAdminClient.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('CREATE ROLE "store_test_app" LOGIN PASSWORD'),
    );
    expect(mockAdminClient.$executeRawUnsafe).toHaveBeenCalledWith(
      'GRANT ALL PRIVILEGES ON DATABASE "store_test" TO "store_test_app"',
    );
  });

  it("only grants access, without re-creating, when the role already exists", async () => {
    mockAdminClient.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    await storeProvisioningService.ensureRoleExists(store);

    expect(mockAdminClient.$executeRawUnsafe).toHaveBeenCalledTimes(1);
    expect(mockAdminClient.$executeRawUnsafe).toHaveBeenCalledWith(
      'GRANT ALL PRIVILEGES ON DATABASE "store_test" TO "store_test_app"',
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/services/storeProvisioning.service.test.js`
Expected: FAIL with `Cannot find module '../../src/services/storeProvisioning.service'`.

- [ ] **Step 3: Implement `src/services/storeProvisioning.service.js`**

```js
const { PrismaClient } = require("@prisma/client");
const { decryptSecret } = require("../utils/tenantCrypto");

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

const service = {
  quoteIdentifier,
  adminDatabaseUrl,
  ensureDatabaseExists,
  ensureRoleExists,
};

module.exports = service;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/services/storeProvisioning.service.test.js`
Expected: PASS, 5 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/services/storeProvisioning.service.js tests/services/storeProvisioning.service.test.js
git commit -m "feat: add tenant database and role creation steps"
```

---

### Task 4: `storeProvisioning.service.js` — migrate, seed, and first-admin steps

**Files:**
- Modify: `src/services/storeProvisioning.service.js`
- Modify: `tests/services/storeProvisioning.service.test.js`

**Interfaces:**
- Consumes: `buildTenantDatabaseUrl(store)` from `src/config/tenantDatabaseManager.js` (existing, exported already), `masterPrisma` from `src/config/db.js` (existing).
- Produces (added to the `service` object from Task 3): `service.runTenantMigration(store): void`, `service.runTenantSeed(store): void`, `service.ensureFirstAdmin(store, { adminEmail, adminPassword, adminName }): Promise<void>` (throws `ApiError(400, ...)` if `adminEmail`/`adminPassword` missing). Used by Task 5's orchestrator and Task 7's CLI scripts.

- [ ] **Step 1: Write the failing tests**

Add to the top of `tests/services/storeProvisioning.service.test.js` (after the existing `jest.mock` calls, before the first `describe`):

```js
jest.mock("child_process", () => ({ execFileSync: jest.fn() }));
jest.mock("../../src/config/tenantDatabaseManager", () => ({
  buildTenantDatabaseUrl: jest.fn(() => "postgresql://tenant"),
}));
jest.mock("../../src/config/db", () => ({
  masterPrisma: {
    adminUser: { upsert: jest.fn() },
    userStoreAssignment: { upsert: jest.fn() },
    store: { findUnique: jest.fn(), update: jest.fn() },
    masterAuditLog: { create: jest.fn() },
  },
}));

const { execFileSync } = require("child_process");
const { masterPrisma } = require("../../src/config/db");
```

Append these `describe` blocks at the end of the file:

```js
describe("storeProvisioningService.runTenantMigration", () => {
  beforeEach(() => execFileSync.mockReset());

  it("runs prisma migrate deploy against the tenant database URL", () => {
    storeProvisioningService.runTenantMigration({ id: "store-1" });

    expect(execFileSync).toHaveBeenCalledWith(
      "npx",
      ["prisma", "migrate", "deploy"],
      expect.objectContaining({ env: expect.objectContaining({ DATABASE_URL: "postgresql://tenant" }) }),
    );
  });
});

describe("storeProvisioningService.runTenantSeed", () => {
  beforeEach(() => execFileSync.mockReset());

  it("runs the seed script against the tenant database URL with store metadata", () => {
    storeProvisioningService.runTenantSeed({ id: "store-1", name: "Acme", storeKey: "STORE_1" });

    expect(execFileSync).toHaveBeenCalledWith(
      "node",
      ["prisma/seed.js"],
      expect.objectContaining({
        env: expect.objectContaining({
          DATABASE_URL: "postgresql://tenant",
          TENANT_STORE_NAME: "Acme",
          TENANT_SUPPORT_EMAIL: "support+store_1@store.local",
        }),
      }),
    );
  });
});

describe("storeProvisioningService.ensureFirstAdmin", () => {
  beforeEach(() => {
    masterPrisma.adminUser.upsert.mockReset();
    masterPrisma.userStoreAssignment.upsert.mockReset();
  });

  const store = { id: "store-1", name: "Acme" };

  it("rejects when adminEmail or adminPassword is missing", async () => {
    await expect(storeProvisioningService.ensureFirstAdmin(store, {})).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(masterPrisma.adminUser.upsert).not.toHaveBeenCalled();
  });

  it("creates the admin user and an active STORE_ADMIN assignment", async () => {
    masterPrisma.adminUser.upsert.mockResolvedValue({ id: "admin-1" });
    masterPrisma.userStoreAssignment.upsert.mockResolvedValue({});

    await storeProvisioningService.ensureFirstAdmin(store, {
      adminEmail: "owner@acme.test",
      adminPassword: "S3curePass!",
      adminName: "Acme Owner",
    });

    expect(masterPrisma.adminUser.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "owner@acme.test" } }),
    );
    expect(masterPrisma.userStoreAssignment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_storeId: { userId: "admin-1", storeId: "store-1" } },
        create: expect.objectContaining({ role: "STORE_ADMIN", isActive: true }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx jest tests/services/storeProvisioning.service.test.js`
Expected: the two new `describe` blocks FAIL with `storeProvisioningService.runTenantMigration is not a function` (etc); the Task 3 tests still PASS.

- [ ] **Step 3: Add the three functions to `src/services/storeProvisioning.service.js`**

Add these `require`s at the top of the file (after the existing two):

```js
const { execFileSync } = require("child_process");
const bcrypt = require("bcryptjs");
const { masterPrisma } = require("../config/db");
const { buildTenantDatabaseUrl } = require("../config/tenantDatabaseManager");
const ApiError = require("../utils/apiError");
```

Add these functions after `ensureRoleExists`:

```js
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
```

Update the `service` object at the bottom of the file to include the three new functions:

```js
const service = {
  quoteIdentifier,
  adminDatabaseUrl,
  ensureDatabaseExists,
  ensureRoleExists,
  runTenantMigration,
  runTenantSeed,
  ensureFirstAdmin,
};

module.exports = service;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/services/storeProvisioning.service.test.js`
Expected: PASS, 9 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/services/storeProvisioning.service.js tests/services/storeProvisioning.service.test.js
git commit -m "feat: add tenant migrate, seed, and first-admin provisioning steps"
```

---

### Task 5: `storeProvisioning.service.js` — the retryable orchestrator

**Files:**
- Modify: `src/services/storeProvisioning.service.js`
- Modify: `tests/services/storeProvisioning.service.test.js`

**Interfaces:**
- Consumes: `sanitizeProvisioningError` from `src/utils/sanitizeError.js` (Task 2), `masterPrisma.masterAuditLog.create` (existing model).
- Produces (added to the `service` object): `service.provisionStore(actorId, storeId, adminPayload): Promise<Store>` (throws `ApiError(404)` if store not found, `ApiError(502)` wrapping a sanitized message on step failure), `service.migrateStore(actorId, storeId): Promise<{storeId, status}>`, `service.seedStore(actorId, storeId): Promise<{storeId, status}>`. Used by Task 6's controller and Task 7's CLI scripts. **Note:** internal step calls inside `provisionStore`/`migrateStore`/`seedStore` must go through `service.ensureDatabaseExists(...)` etc. (the exported object), not the bare function names — this is what lets tests mock individual steps with `jest.spyOn(service, "ensureDatabaseExists")`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/services/storeProvisioning.service.test.js`:

```js
describe("storeProvisioningService.provisionStore", () => {
  beforeEach(() => {
    masterPrisma.store.findUnique.mockReset();
    masterPrisma.store.update.mockReset();
    masterPrisma.masterAuditLog.create.mockReset();
    jest.spyOn(storeProvisioningService, "ensureDatabaseExists").mockResolvedValue();
    jest.spyOn(storeProvisioningService, "ensureRoleExists").mockResolvedValue();
    jest.spyOn(storeProvisioningService, "runTenantMigration").mockReturnValue();
    jest.spyOn(storeProvisioningService, "runTenantSeed").mockReturnValue();
    jest.spyOn(storeProvisioningService, "ensureFirstAdmin").mockResolvedValue();
  });

  afterEach(() => jest.restoreAllMocks());

  it("runs every step in order for a brand-new store and marks it ACTIVE", async () => {
    masterPrisma.store.findUnique.mockResolvedValue({ id: "store-1", provisioningStep: null });
    masterPrisma.store.update.mockResolvedValue({ id: "store-1", status: "ACTIVE" });

    await storeProvisioningService.provisionStore("actor-1", "store-1", {
      adminEmail: "a@a.com",
      adminPassword: "pass1234",
    });

    expect(storeProvisioningService.ensureDatabaseExists).toHaveBeenCalledTimes(1);
    expect(storeProvisioningService.ensureRoleExists).toHaveBeenCalledTimes(1);
    expect(storeProvisioningService.runTenantMigration).toHaveBeenCalledTimes(1);
    expect(storeProvisioningService.runTenantSeed).toHaveBeenCalledTimes(1);
    expect(storeProvisioningService.ensureFirstAdmin).toHaveBeenCalledTimes(1);
    expect(masterPrisma.store.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ACTIVE", provisioningStatus: "COMPLETED" }),
      }),
    );
  });

  it("resumes from the last completed step and skips earlier steps", async () => {
    masterPrisma.store.findUnique.mockResolvedValue({ id: "store-1", provisioningStep: "ROLE_CREATED" });
    masterPrisma.store.update.mockResolvedValue({ id: "store-1", status: "ACTIVE" });

    await storeProvisioningService.provisionStore("actor-1", "store-1", {
      adminEmail: "a@a.com",
      adminPassword: "pass1234",
    });

    expect(storeProvisioningService.ensureDatabaseExists).not.toHaveBeenCalled();
    expect(storeProvisioningService.ensureRoleExists).not.toHaveBeenCalled();
    expect(storeProvisioningService.runTenantMigration).toHaveBeenCalledTimes(1);
    expect(storeProvisioningService.runTenantSeed).toHaveBeenCalledTimes(1);
    expect(storeProvisioningService.ensureFirstAdmin).toHaveBeenCalledTimes(1);
  });

  it("marks the store FAILED with a sanitized error and stops before later steps", async () => {
    masterPrisma.store.findUnique.mockResolvedValue({ id: "store-1", provisioningStep: null });
    storeProvisioningService.runTenantMigration.mockImplementation(() => {
      throw new Error("connection to postgresql://admin:S3cret@db-host:5432/postgres failed");
    });

    await expect(
      storeProvisioningService.provisionStore("actor-1", "store-1", {
        adminEmail: "a@a.com",
        adminPassword: "pass1234",
      }),
    ).rejects.toMatchObject({ statusCode: 502 });

    const failureUpdateCall = masterPrisma.store.update.mock.calls.find(
      (call) => call[0].data.provisioningStatus === "FAILED",
    );
    expect(failureUpdateCall[0].data.provisioningError).not.toContain("S3cret");
    expect(storeProvisioningService.ensureFirstAdmin).not.toHaveBeenCalled();
  });

  it("throws 404 when the store does not exist", async () => {
    masterPrisma.store.findUnique.mockResolvedValue(null);

    await expect(
      storeProvisioningService.provisionStore("actor-1", "missing-store", {}),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("storeProvisioningService.migrateStore / seedStore", () => {
  beforeEach(() => {
    masterPrisma.store.findUnique.mockReset();
    masterPrisma.masterAuditLog.create.mockReset();
    jest.spyOn(storeProvisioningService, "runTenantMigration").mockReturnValue();
    jest.spyOn(storeProvisioningService, "runTenantSeed").mockReturnValue();
  });

  afterEach(() => jest.restoreAllMocks());

  it("migrateStore runs the migration step for an already-provisioned store", async () => {
    masterPrisma.store.findUnique.mockResolvedValue({ id: "store-1", name: "Acme" });

    const result = await storeProvisioningService.migrateStore("actor-1", "store-1");

    expect(storeProvisioningService.runTenantMigration).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ storeId: "store-1", status: "migrated" });
  });

  it("seedStore runs the seed step for an already-provisioned store", async () => {
    masterPrisma.store.findUnique.mockResolvedValue({ id: "store-1", name: "Acme" });

    const result = await storeProvisioningService.seedStore("actor-1", "store-1");

    expect(storeProvisioningService.runTenantSeed).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ storeId: "store-1", status: "seeded" });
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx jest tests/services/storeProvisioning.service.test.js`
Expected: the new `describe` blocks FAIL with `storeProvisioningService.provisionStore is not a function` (etc).

- [ ] **Step 3: Add the orchestrator to `src/services/storeProvisioning.service.js`**

Add this `require` at the top:

```js
const { sanitizeProvisioningError } = require("../utils/sanitizeError");
```

Add these functions and constants after `ensureFirstAdmin`, **before** the `const service = {...}` block:

```js
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
```

Update the `service` object to add the three new functions:

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/services/storeProvisioning.service.test.js`
Expected: PASS, 15 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/services/storeProvisioning.service.js tests/services/storeProvisioning.service.test.js
git commit -m "feat: add retryable provisionStore orchestrator with resume support"
```

---

### Task 6: Wire real provisioning into the Super Admin API; auto-generate store credentials

**Files:**
- Create: `src/validations/superAdminSchemas.js`
- Modify: `src/services/superAdminStoreService.js` (`createStore` function)
- Modify: `src/controllers/superAdminController.js`
- Modify: `src/routes/superAdminRoutes.js`
- Test: `tests/validations/superAdminSchemas.test.js`
- Test: `tests/services/superAdminStoreService.test.js`
- Test: `tests/controllers/superAdminController.test.js`

**Interfaces:**
- Consumes: `generateDatabaseName`, `generateRoleName`, `generateStorePassword` from `src/utils/tenantCredentials.js` (Task 2); `provisionStore`, `migrateStore`, `seedStore` from `src/services/storeProvisioning.service.js` (Task 5).
- Produces: `POST /api/super-admin/stores` no longer requires `databasePassword`/`databaseUser` in the body; `POST /api/super-admin/stores/:id/provision|migrate|seed` become real (previously stubs).

- [ ] **Step 1: Write the failing test for `createStore`**

Create `tests/services/superAdminStoreService.test.js`:

```js
jest.mock("../../src/config/db", () => ({
  masterPrisma: {
    $transaction: jest.fn(async (callback) => callback({
      store: { create: jest.fn().mockResolvedValue({
        id: "store-1",
        name: "Acme",
        slug: "acme",
        storeKey: "ACME",
        primaryDomain: "acme.test",
        databaseName: "store_acme",
        databaseHost: "localhost",
        databasePort: 5432,
        databaseUser: "store_acme_app",
        databaseSchema: "public",
        status: "PENDING",
        provisioningStatus: "NOT_STARTED",
        provisioningError: null,
        domains: [],
        users: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }) },
      masterAuditLog: { create: jest.fn() },
    })),
  },
}));

const superAdminStoreService = require("../../src/services/superAdminStoreService");

describe("superAdminStoreService.createStore", () => {
  it("generates a database name, dedicated role name, and password without requiring them in the payload", async () => {
    const result = await superAdminStoreService.createStore("actor-1", {
      name: "Acme",
      slug: "acme",
      storeKey: "ACME",
      primaryDomain: "acme.test",
    });

    expect(result.status).toBe("PENDING");
    expect(result).not.toHaveProperty("encryptedDatabasePass");
  });

  it("rejects when slug is missing", async () => {
    await expect(
      superAdminStoreService.createStore("actor-1", { name: "Acme", primaryDomain: "acme.test" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/services/superAdminStoreService.test.js`
Expected: FAIL — the current `createStore` throws `ApiError(400, "Tenant database password is required")` because no `databasePassword` was supplied.

- [ ] **Step 3: Update `createStore` in `src/services/superAdminStoreService.js`**

Add this import near the top of the file (after the existing `require`s):

```js
const { generateDatabaseName, generateRoleName, generateStorePassword } = require("../utils/tenantCredentials");
```

Replace the existing `createStore` function body with:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/services/superAdminStoreService.test.js`
Expected: PASS, 2 tests.

- [ ] **Step 5: Add validation schemas**

Create `src/validations/superAdminSchemas.js`:

```js
const { z } = require("zod");

const createStoreSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Store name is required"),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    storeKey: z.string().trim().min(1, "Store key is required"),
    primaryDomain: z.string().trim().min(1, "Primary domain is required"),
    databaseName: z.string().trim().optional(),
    databaseHost: z.string().trim().optional(),
    databasePort: z.coerce.number().int().positive().optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const provisionStoreSchema = z.object({
  body: z.object({
    adminEmail: z.string().trim().email("A valid admin email is required"),
    adminPassword: z.string().min(8, "Admin password must be at least 8 characters"),
    adminName: z.string().trim().optional(),
  }),
  params: z.object({ storeId: z.string().trim().min(1) }),
  query: z.any().optional(),
});

module.exports = { createStoreSchema, provisionStoreSchema };
```

- [ ] **Step 6: Write the failing test for the validation schemas**

Create `tests/validations/superAdminSchemas.test.js`:

```js
const { createStoreSchema, provisionStoreSchema } = require("../../src/validations/superAdminSchemas");

describe("createStoreSchema", () => {
  it("accepts a payload without database credentials", () => {
    const result = createStoreSchema.safeParse({
      body: { name: "Acme", slug: "acme", storeKey: "ACME", primaryDomain: "acme.test" },
      params: {},
      query: {},
    });
    expect(result.success).toBe(true);
  });

  it("rejects an uppercase slug", () => {
    const result = createStoreSchema.safeParse({
      body: { name: "Acme", slug: "ACME", storeKey: "ACME", primaryDomain: "acme.test" },
      params: {},
      query: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("provisionStoreSchema", () => {
  it("requires a valid admin email and an 8+ character password", () => {
    const result = provisionStoreSchema.safeParse({
      body: { adminEmail: "not-an-email", adminPassword: "short" },
      params: { storeId: "store-1" },
      query: {},
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid provisioning payload", () => {
    const result = provisionStoreSchema.safeParse({
      body: { adminEmail: "owner@acme.test", adminPassword: "S3curePass!" },
      params: { storeId: "store-1" },
      query: {},
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx jest tests/validations/superAdminSchemas.test.js`
Expected: PASS, 4 tests. (No implementation step needed here since Step 5 already wrote the schemas — this confirms them.)

- [ ] **Step 8: Write the failing test for the controller wiring**

Create `tests/controllers/superAdminController.test.js`:

```js
jest.mock("../../src/services/superAdminStoreService", () => ({
  getStore: jest.fn(),
}));
jest.mock("../../src/services/storeProvisioning.service", () => ({
  provisionStore: jest.fn(),
  migrateStore: jest.fn(),
  seedStore: jest.fn(),
}));
jest.mock("../../src/config/tenantDatabaseManager", () => ({
  getTenantClient: jest.fn(),
}));

const service = require("../../src/services/superAdminStoreService");
const provisioningService = require("../../src/services/storeProvisioning.service");
const controller = require("../../src/controllers/superAdminController");

function mockRes() {
  return { json: jest.fn(), status: jest.fn().mockReturnThis() };
}

describe("superAdminController.provisionStore", () => {
  beforeEach(() => {
    provisioningService.provisionStore.mockReset();
    service.getStore.mockReset();
  });

  it("provisions the store then responds with the sanitized store record, never the raw provisioning result", async () => {
    provisioningService.provisionStore.mockResolvedValue({
      id: "store-1",
      encryptedDatabasePass: "should-never-appear",
    });
    service.getStore.mockResolvedValue({ id: "store-1", name: "Acme", status: "ACTIVE" });

    const req = {
      user: { userId: "admin-1" },
      params: { storeId: "store-1" },
      body: { adminEmail: "a@a.com", adminPassword: "pass1234" },
    };
    const res = mockRes();
    const next = jest.fn();

    await controller.provisionStore(req, res, next);

    expect(provisioningService.provisionStore).toHaveBeenCalledWith("admin-1", "store-1", req.body);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: "store-1", name: "Acme", status: "ACTIVE" },
    });
    const [[responseArg]] = res.json.mock.calls;
    expect(JSON.stringify(responseArg)).not.toContain("should-never-appear");
  });
});

describe("superAdminController.migrateStore / seedStore", () => {
  beforeEach(() => {
    provisioningService.migrateStore.mockReset();
    provisioningService.seedStore.mockReset();
  });

  it("migrateStore delegates to the provisioning service", async () => {
    provisioningService.migrateStore.mockResolvedValue({ storeId: "store-1", status: "migrated" });
    const req = { user: { userId: "admin-1" }, params: { storeId: "store-1" } };
    const res = mockRes();

    await controller.migrateStore(req, res, jest.fn());

    expect(provisioningService.migrateStore).toHaveBeenCalledWith("admin-1", "store-1");
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { storeId: "store-1", status: "migrated" } });
  });
});
```

- [ ] **Step 9: Run test to verify it fails**

Run: `npx jest tests/controllers/superAdminController.test.js`
Expected: FAIL — `provisionStore`/`migrateStore` currently call `notImplementedProvisioningStep`, which never touches `provisioningService` or `service.getStore`, so the mock assertions fail.

- [ ] **Step 10: Wire real provisioning into `src/controllers/superAdminController.js`**

Replace the entire file with:

```js
const { getTenantClient } = require("../config/tenantDatabaseManager");
const service = require("../services/superAdminStoreService");
const provisioningService = require("../services/storeProvisioning.service");
const asyncHandler = require("../utils/asyncHandler");

const actorId = (req) => req.user?.userId || req.user?.id || null;

const listStores = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listStores() });
});

const createStore = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.createStore(actorId(req), req.body) });
});

const getStore = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getStore(req.params.storeId) });
});

const updateStore = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateStore(actorId(req), req.params.storeId, req.body) });
});

const addDomain = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.addDomain(actorId(req), req.params.storeId, req.body) });
});

const removeDomain = asyncHandler(async (req, res) => {
  await service.removeDomain(actorId(req), req.params.storeId, req.params.domainId);
  res.json({ success: true, message: "Domain removed" });
});

const updateStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateStatus(actorId(req), req.params.storeId, req.body.status) });
});

const assignUser = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.assignUser(actorId(req), req.params.storeId, req.body) });
});

const health = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.storeHealth(req.params.storeId, getTenantClient) });
});

const provisionStore = asyncHandler(async (req, res) => {
  await provisioningService.provisionStore(actorId(req), req.params.storeId, req.body);
  res.json({ success: true, data: await service.getStore(req.params.storeId) });
});

const migrateStore = asyncHandler(async (req, res) => {
  const result = await provisioningService.migrateStore(actorId(req), req.params.storeId);
  res.json({ success: true, data: result });
});

const seedStore = asyncHandler(async (req, res) => {
  const result = await provisioningService.seedStore(actorId(req), req.params.storeId);
  res.json({ success: true, data: result });
});

module.exports = {
  addDomain,
  assignUser,
  createStore,
  getStore,
  health,
  listStores,
  migrateStore,
  provisionStore,
  removeDomain,
  seedStore,
  updateStatus,
  updateStore,
};
```

Note: `provisionStore`'s handler discards the raw return value of `provisioningService.provisionStore` (which includes `encryptedDatabasePass`) and re-fetches through `service.getStore`, which already strips sensitive fields via `publicStore()` — this is what the Step 8 test's "never the raw provisioning result" assertion checks.

- [ ] **Step 11: Run tests to verify they pass**

Run: `npx jest tests/controllers/superAdminController.test.js`
Expected: PASS, 2 tests.

- [ ] **Step 12: Wire validation into the routes**

Replace `src/routes/superAdminRoutes.js` with:

```js
const express = require("express");
const controller = require("../controllers/superAdminController");
const { requireAuth } = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const validate = require("../middleware/validate");
const { createStoreSchema, provisionStoreSchema } = require("../validations/superAdminSchemas");

const router = express.Router();

router.use(requireAuth, authorizeRole("SUPER_ADMIN"));

router.post("/stores", validate(createStoreSchema), controller.createStore);
router.get("/stores", controller.listStores);
router.get("/stores/:storeId", controller.getStore);
router.patch("/stores/:storeId", controller.updateStore);
router.post("/stores/:storeId/domains", controller.addDomain);
router.delete("/stores/:storeId/domains/:domainId", controller.removeDomain);
router.post("/stores/:storeId/provision", validate(provisionStoreSchema), controller.provisionStore);
router.post("/stores/:storeId/migrate", controller.migrateStore);
router.post("/stores/:storeId/seed", controller.seedStore);
router.post("/stores/:storeId/users", controller.assignUser);
router.patch("/stores/:storeId/status", controller.updateStatus);
router.get("/stores/:storeId/health", controller.health);

module.exports = router;
```

- [ ] **Step 13: Run the full test suite to check for regressions**

Run: `npm test`
Expected: all suites PASS (previous suites unaffected; no shared state between test files under Jest's default per-file module isolation).

- [ ] **Step 14: Commit**

```bash
git add src/validations/superAdminSchemas.js src/services/superAdminStoreService.js src/controllers/superAdminController.js src/routes/superAdminRoutes.js tests/validations/superAdminSchemas.test.js tests/services/superAdminStoreService.test.js tests/controllers/superAdminController.test.js
git commit -m "feat: wire real store provisioning into the Super Admin API"
```

---

### Task 7: Refactor CLI scripts to use the shared provisioning service

**Files:**
- Modify: `scripts/createTenantDatabases.js`
- Modify: `scripts/tenantMigrate.js`
- Modify: `scripts/tenantSeed.js`
- Modify: `scripts/provisionSevenStores.js`

**Interfaces:**
- Consumes: `ensureDatabaseExists`, `migrateStore`, `seedStore`, `provisionStore` from `src/services/storeProvisioning.service.js` (Tasks 3–5); `generateRoleName`, `generateStorePassword` from `src/utils/tenantCredentials.js` (Task 2).

These are CLI entrypoints (`main()` functions run via `node scripts/x.js`), consistent with the existing project convention of not unit-testing scripts (confirmed: no `tests/` coverage exists for the current versions either). Verification for this task is a manual dry run, not Jest.

- [ ] **Step 1: Rewrite `scripts/createTenantDatabases.js`**

```js
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
```

- [ ] **Step 2: Rewrite `scripts/tenantMigrate.js`**

```js
require("dotenv").config();

const { masterPrisma } = require("../src/config/db");
const { migrateStore } = require("../src/services/storeProvisioning.service");

async function main() {
  const storeArg = process.argv.find((arg) => arg.startsWith("--store="));
  const stopOnError = !process.argv.includes("--continue-on-error");
  const where = storeArg
    ? { id: storeArg.split("=")[1] }
    : { status: { in: ["ACTIVE", "PENDING", "FAILED"] } };
  const stores = await masterPrisma.store.findMany({ where, orderBy: { createdAt: "asc" } });
  let failed = false;

  for (const store of stores) {
    try {
      console.log(`[tenant:migrate] ${store.id} ${store.name}`);
      await migrateStore(null, store.id);
    } catch (error) {
      failed = true;
      console.error(`[tenant:migrate] failed for ${store.id} ${store.name}: ${error.message}`);
      if (stopOnError) break;
    }
  }

  await masterPrisma.$disconnect();
  if (failed) process.exit(1);
}

main().catch(async (error) => {
  console.error(error.message);
  await masterPrisma.$disconnect();
  process.exit(1);
});
```

- [ ] **Step 3: Rewrite `scripts/tenantSeed.js`**

```js
require("dotenv").config();

const { masterPrisma } = require("../src/config/db");
const { seedStore } = require("../src/services/storeProvisioning.service");

async function main() {
  const storeArg = process.argv.find((arg) => arg.startsWith("--store="));
  const where = storeArg ? { id: storeArg.split("=")[1] } : { status: "ACTIVE" };
  const stores = await masterPrisma.store.findMany({ where, orderBy: { createdAt: "asc" } });
  let failed = false;

  for (const store of stores) {
    try {
      console.log(`[tenant:seed] ${store.id} ${store.name}`);
      await seedStore(null, store.id);
    } catch (error) {
      failed = true;
      console.error(`[tenant:seed] failed for ${store.id} ${store.name}: ${error.message}`);
      break;
    }
  }

  await masterPrisma.$disconnect();
  if (failed) process.exit(1);
}

main().catch(async (error) => {
  console.error(error.message);
  await masterPrisma.$disconnect();
  process.exit(1);
});
```

- [ ] **Step 4: Rewrite `scripts/provisionSevenStores.js`**

```js
require("dotenv").config();

const { masterPrisma } = require("../src/config/db");
const { encryptSecret } = require("../src/utils/tenantCrypto");
const { normalizeDomain } = require("../src/utils/domain");
const { generateRoleName, generateStorePassword } = require("../src/utils/tenantCredentials");
const { provisionStore } = require("../src/services/storeProvisioning.service");

function value(name) {
  return process.env[name];
}

async function main() {
  const host = value("TENANT_DB_HOST") || "localhost";
  const port = Number(value("TENANT_DB_PORT") || 5432);
  let failed = false;

  for (let index = 1; index <= 7; index += 1) {
    const name = value(`STORE_${index}_NAME`);
    const storeKey = value(`STORE_${index}_KEY`) || `STORE_${index}`;
    const domain = normalizeDomain(value(`STORE_${index}_DOMAIN`));
    const databaseName = value(`STORE_${index}_DATABASE`);
    if (!name || !domain || !databaseName) {
      console.log(`[tenant:provision:seven] skipped STORE_${index}; missing name/domain/database`);
      continue;
    }

    const slug = storeKey.toLowerCase().replace(/_/g, "-");
    const store = await masterPrisma.store.upsert({
      where: { storeKey },
      update: { name, primaryDomain: domain, databaseName },
      create: {
        name,
        slug,
        storeKey,
        primaryDomain: domain,
        databaseName,
        databaseHost: host,
        databasePort: port,
        databaseUser: generateRoleName(slug),
        encryptedDatabasePass: encryptSecret(generateStorePassword()),
        status: "PENDING",
        domains: { create: [{ domain, isPrimary: true }] },
      },
    });

    await masterPrisma.storeDomain.upsert({
      where: { domain },
      update: { storeId: store.id, isPrimary: true, isActive: true },
      create: { storeId: store.id, domain, isPrimary: true },
    });

    const adminEmail = value(`STORE_${index}_ADMIN_EMAIL`) || `admin${index}@store.local`;
    const adminPassword = value(`STORE_${index}_ADMIN_PASSWORD`) || "Store@12345";

    try {
      await provisionStore(null, store.id, { adminEmail, adminPassword, adminName: `${name} Admin` });
      console.log(`[tenant:provision:seven] provisioned ${store.storeKey} -> ${store.databaseName}; admin ${adminEmail}`);
    } catch (error) {
      failed = true;
      console.error(`[tenant:provision:seven] failed ${store.storeKey}: ${error.message}`);
    }
  }

  await masterPrisma.$disconnect();
  if (failed) process.exit(1);
}

main().catch(async (error) => {
  console.error(error.message);
  await masterPrisma.$disconnect();
  process.exit(1);
});
```

Note the `upsert`'s `update` branch intentionally only touches `name`/`primaryDomain`/`databaseName` — it never overwrites `databaseUser`/`encryptedDatabasePass`/`status` on a store that already exists, so re-running this script against the 7 already-`ACTIVE` stores (provisioned by the old version of this script, which used a single shared `TENANT_DB_APP_USER`) is safe: their existing credentials are left untouched, and `provisionStore` will simply backfill `provisioningStep` up to `DONE` for them (every step it runs is idempotent, confirmed in Task 5's tests) without disrupting anything already working.

- [ ] **Step 5: Manual dry run against a scratch store**

If a reachable Postgres server with `TENANT_DB_ADMIN_USER`/`PASSWORD` (with `CREATEDB` + `CREATEROLE`) is available in the current environment, run:

```bash
node scripts/tenantMigrate.js --store=<an-existing-store-id>
```

Expected: `[tenant:migrate] <id> <name>` logged, exit code 0, no credentials printed to stdout.

If no such environment is available in this session, skip this manual step and note it as a remaining manual verification for whoever deploys this change (see Task 10).

- [ ] **Step 6: Commit**

```bash
git add scripts/createTenantDatabases.js scripts/tenantMigrate.js scripts/tenantSeed.js scripts/provisionSevenStores.js
git commit -m "refactor: CLI provisioning scripts now call the shared storeProvisioning service"
```

---

### Task 8: Add `storeId` to Stripe payment intent metadata

**Files:**
- Modify: `src/services/customerPanelService.js` (`createPaymentIntent` and `updatePaymentIntent` functions)
- Modify: `tests/services/customerPanelService.test.js`

**Interfaces:**
- Consumes: `getCurrentStore()` from `src/config/tenantContext.js` (already imported in this file at line 4).
- Produces: Stripe `PaymentIntent.metadata.storeId` is populated whenever a tenant is resolved — consumed by Task 9's webhook handler.

- [ ] **Step 1: Write the failing tests**

Add near the top of `tests/services/customerPanelService.test.js`, after the existing `jest.mock` calls:

```js
jest.mock("../../src/services/stripeService", () => ({
  createPaymentIntent: jest.fn(),
  updatePaymentIntentAmount: jest.fn(),
  retrievePaymentIntent: jest.fn(),
}));

jest.mock("../../src/config/tenantContext", () => ({
  getCurrentStore: jest.fn(),
}));
```

Add these `require`s after the existing ones:

```js
const stripeService = require("../../src/services/stripeService");
const { getCurrentStore } = require("../../src/config/tenantContext");
```

Append this `describe` block at the end of the file:

```js
describe("customerPanelService.createPaymentIntent", () => {
  beforeEach(() => {
    stripeService.createPaymentIntent.mockReset();
    getCurrentStore.mockReset();
  });

  it("includes the resolved store id in Stripe payment intent metadata", async () => {
    getCurrentStore.mockReturnValue({ id: "store-1" });
    stripeService.createPaymentIntent.mockResolvedValue({
      client_secret: "secret",
      id: "pi_1",
      amount: 5000,
      currency: "usd",
      status: "requires_payment_method",
    });

    await customerPanelService.createPaymentIntent({ id: "cust-1", email: "a@a.com" }, 50, "usd");

    expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
      50,
      expect.any(String),
      expect.objectContaining({ storeId: "store-1", customerId: "cust-1" }),
    );
  });

  it("omits storeId from metadata when no tenant is resolved", async () => {
    getCurrentStore.mockReturnValue(null);
    stripeService.createPaymentIntent.mockResolvedValue({
      client_secret: "secret",
      id: "pi_1",
      amount: 5000,
      currency: "usd",
      status: "requires_payment_method",
    });

    await customerPanelService.createPaymentIntent({ id: "cust-1", email: "a@a.com" }, 50, "usd");

    const metadata = stripeService.createPaymentIntent.mock.calls[0][2];
    expect(metadata).not.toHaveProperty("storeId");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/services/customerPanelService.test.js -t "createPaymentIntent"`
Expected: FAIL — current `createPaymentIntent` never calls `getCurrentStore()` and never puts `storeId` in metadata.

- [ ] **Step 3: Update `createPaymentIntent` and `updatePaymentIntent` in `src/services/customerPanelService.js`**

Find this block (around line 525):

```js
async function createPaymentIntent(customer, amount, currency) {
  const paymentCurrency = getStripeCurrency();
  const intent = await stripeService.createPaymentIntent(
    amount,
    paymentCurrency,
    {
      customerId: customer.id,
      customerEmail: customer.email,
      integration: "customer-panel-checkout",
    },
  );
```

Replace it with:

```js
async function createPaymentIntent(customer, amount, currency) {
  const paymentCurrency = getStripeCurrency();
  const store = getCurrentStore();
  const intent = await stripeService.createPaymentIntent(
    amount,
    paymentCurrency,
    {
      customerId: customer.id,
      customerEmail: customer.email,
      integration: "customer-panel-checkout",
      ...(store ? { storeId: store.id } : {}),
    },
  );
```

Find this block (around line 568, inside `updatePaymentIntent`):

```js
  const intent = await stripeService.updatePaymentIntentAmount(
    paymentIntentId,
    amount,
    paymentCurrency,
    {
      customerId: customer.id,
      customerEmail: customer.email,
      integration: "customer-panel-checkout",
    },
  );
```

Replace it with:

```js
  const store = getCurrentStore();
  const intent = await stripeService.updatePaymentIntentAmount(
    paymentIntentId,
    amount,
    paymentCurrency,
    {
      customerId: customer.id,
      customerEmail: customer.email,
      integration: "customer-panel-checkout",
      ...(store ? { storeId: store.id } : {}),
    },
  );
```

(`getCurrentStore` is already imported at the top of this file — no new import needed.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/services/customerPanelService.test.js`
Expected: PASS, all tests in the file including the 2 new ones.

- [ ] **Step 5: Commit**

```bash
git add src/services/customerPanelService.js tests/services/customerPanelService.test.js
git commit -m "feat: include resolved storeId in Stripe payment intent metadata"
```

---

### Task 9: Rewrite the Stripe webhook controller for tenant resolution and idempotency

**Files:**
- Modify: `src/controllers/webhookController.js`
- Create: `tests/controllers/webhookController.test.js`

**Interfaces:**
- Consumes: `masterPrisma` from `src/config/db.js`, `getTenantClient` from `src/config/tenantDatabaseManager.js`, `MasterWebhookEvent` model (Task 1), `stripeService.constructWebhookEvent` (existing).

- [ ] **Step 1: Write the failing tests**

Create `tests/controllers/webhookController.test.js`:

```js
jest.mock("../../src/config/db", () => ({
  masterPrisma: {
    masterWebhookEvent: { findUnique: jest.fn(), create: jest.fn() },
    store: { findUnique: jest.fn() },
    order: { findUnique: jest.fn(), update: jest.fn() },
  },
}));
jest.mock("../../src/config/tenantDatabaseManager", () => ({ getTenantClient: jest.fn() }));
jest.mock("../../src/services/stripeService", () => ({ constructWebhookEvent: jest.fn() }));

const { masterPrisma } = require("../../src/config/db");
const { getTenantClient } = require("../../src/config/tenantDatabaseManager");
const stripeService = require("../../src/services/stripeService");
const { handleStripeWebhook } = require("../../src/controllers/webhookController");

function mockRes() {
  return { json: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
}

function paymentIntentEvent(overrides = {}) {
  return {
    id: "evt_1",
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_1",
        metadata: { storeId: "store-1" },
        ...overrides,
      },
    },
  };
}

describe("handleStripeWebhook", () => {
  const originalEnv = process.env.MULTI_TENANT_ENABLED;

  beforeEach(() => {
    masterPrisma.masterWebhookEvent.findUnique.mockReset();
    masterPrisma.masterWebhookEvent.create.mockReset();
    masterPrisma.store.findUnique.mockReset();
    masterPrisma.order.findUnique.mockReset();
    masterPrisma.order.update.mockReset();
    getTenantClient.mockReset();
    stripeService.constructWebhookEvent.mockReset();
    masterPrisma.masterWebhookEvent.findUnique.mockResolvedValue(null);
  });

  afterEach(() => {
    process.env.MULTI_TENANT_ENABLED = originalEnv;
  });

  it("returns 400 without touching the database when signature verification fails", async () => {
    stripeService.constructWebhookEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });
    const req = { body: {}, headers: {} };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(masterPrisma.masterWebhookEvent.findUnique).not.toHaveBeenCalled();
  });

  it("short-circuits a duplicate event without re-processing it", async () => {
    stripeService.constructWebhookEvent.mockReturnValue(paymentIntentEvent());
    masterPrisma.masterWebhookEvent.findUnique.mockResolvedValue({ id: "seen-1" });
    const req = { body: {}, headers: {} };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(res.json).toHaveBeenCalledWith({ received: true, duplicate: true });
    expect(getTenantClient).not.toHaveBeenCalled();
  });

  it("routes to the correct tenant client when MULTI_TENANT_ENABLED=true and metadata.storeId is present", async () => {
    process.env.MULTI_TENANT_ENABLED = "true";
    stripeService.constructWebhookEvent.mockReturnValue(paymentIntentEvent());
    masterPrisma.store.findUnique.mockResolvedValue({ id: "store-1", status: "ACTIVE" });
    const tenantOrder = { findUnique: jest.fn().mockResolvedValue({ id: "order-1" }), update: jest.fn() };
    getTenantClient.mockResolvedValue({ order: tenantOrder });

    const req = { body: {}, headers: {} };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(getTenantClient).toHaveBeenCalledWith({ id: "store-1", status: "ACTIVE" });
    expect(tenantOrder.findUnique).toHaveBeenCalledWith({ where: { stripePaymentIntentId: "pi_1" } });
    expect(tenantOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "order-1" }, data: expect.objectContaining({ paymentStatus: "Paid" }) }),
    );
    expect(masterPrisma.order.findUnique).not.toHaveBeenCalled();
    expect(masterPrisma.masterWebhookEvent.create).toHaveBeenCalledWith({
      data: { provider: "stripe", eventId: "evt_1", storeId: "store-1", type: "payment_intent.succeeded" },
    });
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("skips the update and still marks the event processed when metadata.storeId is missing", async () => {
    process.env.MULTI_TENANT_ENABLED = "true";
    stripeService.constructWebhookEvent.mockReturnValue(paymentIntentEvent({ metadata: {} }));

    const req = { body: {}, headers: {} };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(getTenantClient).not.toHaveBeenCalled();
    expect(masterPrisma.masterWebhookEvent.create).toHaveBeenCalledWith({
      data: { provider: "stripe", eventId: "evt_1", storeId: null, type: "payment_intent.succeeded" },
    });
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("falls back to masterPrisma when MULTI_TENANT_ENABLED=false", async () => {
    process.env.MULTI_TENANT_ENABLED = "false";
    stripeService.constructWebhookEvent.mockReturnValue(paymentIntentEvent());
    masterPrisma.order.findUnique.mockResolvedValue({ id: "order-1" });

    const req = { body: {}, headers: {} };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(getTenantClient).not.toHaveBeenCalled();
    expect(masterPrisma.order.findUnique).toHaveBeenCalledWith({ where: { stripePaymentIntentId: "pi_1" } });
    expect(masterPrisma.order.update).toHaveBeenCalled();
  });

  it("returns 500 and does not mark the event processed when the tenant database is unavailable", async () => {
    process.env.MULTI_TENANT_ENABLED = "true";
    stripeService.constructWebhookEvent.mockReturnValue(paymentIntentEvent());
    masterPrisma.store.findUnique.mockResolvedValue({ id: "store-1", status: "ACTIVE" });
    getTenantClient.mockRejectedValue(new Error("tenant db unreachable"));

    const req = { body: {}, headers: {} };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(masterPrisma.masterWebhookEvent.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/controllers/webhookController.test.js`
Expected: FAIL — the current controller always uses the `prisma` proxy directly, never checks `MasterWebhookEvent`, and never calls `getTenantClient`.

- [ ] **Step 3: Rewrite `src/controllers/webhookController.js`**

```js
const { masterPrisma } = require("../config/db");
const { getTenantClient } = require("../config/tenantDatabaseManager");
const stripeService = require("../services/stripeService");

const tenantEnabled = () => String(process.env.MULTI_TENANT_ENABLED).trim().toLowerCase() === "true";

async function applyPaymentUpdate(db, intent, paymentStatus) {
  const order = await db.order.findUnique({ where: { stripePaymentIntentId: intent.id } });
  if (!order) return;
  await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus,
      timeline: { push: `Payment ${paymentStatus.toLowerCase()} (Stripe webhook)` },
    },
  });
}

const handleStripeWebhook = async (req, res) => {
  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, req.headers["stripe-signature"]);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const existing = await masterPrisma.masterWebhookEvent.findUnique({ where: { eventId: event.id } });
    if (existing) {
      return res.json({ received: true, duplicate: true });
    }

    let resolvedStoreId = null;

    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;
      const paymentStatus = event.type === "payment_intent.succeeded" ? "Paid" : "Failed";
      resolvedStoreId = intent.metadata?.storeId || null;

      if (!tenantEnabled()) {
        await applyPaymentUpdate(masterPrisma, intent, paymentStatus);
      } else if (resolvedStoreId) {
        const store = await masterPrisma.store.findUnique({ where: { id: resolvedStoreId } });
        if (!store || store.status !== "ACTIVE") {
          console.warn("[Stripe Webhook] Unknown or inactive store for metadata storeId", resolvedStoreId);
        } else {
          const tenantDb = await getTenantClient(store);
          await applyPaymentUpdate(tenantDb, intent, paymentStatus);
        }
      } else {
        console.warn("[Stripe Webhook] Missing storeId metadata on payment intent", intent.id);
      }
    }

    await masterPrisma.masterWebhookEvent.create({
      data: { provider: "stripe", eventId: event.id, storeId: resolvedStoreId, type: event.type },
    });

    return res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Failed to process event", event.id, error.message);
    return res.status(500).json({ received: false });
  }
};

module.exports = { handleStripeWebhook };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/controllers/webhookController.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `npm test`
Expected: all suites PASS.

- [ ] **Step 6: Commit**

```bash
git add src/controllers/webhookController.js tests/controllers/webhookController.test.js
git commit -m "fix: resolve Stripe webhook events to the correct tenant database with idempotency"
```

---

### Task 10: Documentation updates

**Files:**
- Modify: `docs/TENANT_PROVISIONING.md`
- Modify: `docs/MULTI_TENANT_ARCHITECTURE.md`

- [ ] **Step 1: Update `docs/TENANT_PROVISIONING.md`**

Replace the file contents with:

```markdown
# Tenant Provisioning

Use the Super Admin API to create a store and run its provisioning pipeline. Provisioning creates the tenant's PostgreSQL database, a dedicated Postgres role scoped to only that database, runs migrations, seeds default data, and creates the first store admin — all in one synchronous, resumable call.

## Prerequisite: PostgreSQL administrative privileges

`TENANT_DB_ADMIN_USER` (configured via `TENANT_DB_ADMIN_USER`/`TENANT_DB_ADMIN_PASSWORD`) must have both `CREATEDB` and `CREATEROLE` on the target Postgres server. `CREATEROLE` is required because provisioning now creates a dedicated login role per store instead of reusing a single shared app user. Grant it once, out of band:

```sql
ALTER ROLE tenant_admin_user CREATEDB CREATEROLE;
```

## Creating a store

```http
POST /api/super-admin/stores
```

Body (no database credentials — they're generated server-side):

```json
{
  "name": "Acme Pet Supplies",
  "slug": "acme-pet-supplies",
  "storeKey": "ACME",
  "primaryDomain": "acme-pet-supplies.com"
}
```

The store is created with `status: PENDING` and a generated, encrypted `databaseUser`/password. No Postgres objects exist yet.

## Running the provisioning pipeline

```http
POST /api/super-admin/stores/:storeId/provision
```

Body:

```json
{
  "adminEmail": "owner@acme-pet-supplies.com",
  "adminPassword": "change-me-now",
  "adminName": "Acme Owner"
}
```

This runs, in order: create database → create dedicated role and grant access → run tenant migrations → run tenant seed → create the first `STORE_ADMIN`. Progress is persisted after each step as `Store.provisioningStep`. If a step fails, `Store.provisioningStatus` becomes `FAILED` with a sanitized `provisioningError` (no credentials or connection strings), and `provisioningStep` stays at the last **successful** step. Calling `/provision` again resumes from there — already-completed steps are skipped, not repeated.

On success, `status` becomes `ACTIVE` and `provisioningStatus` becomes `COMPLETED`.

## Re-running an individual step

```http
POST /api/super-admin/stores/:storeId/migrate
POST /api/super-admin/stores/:storeId/seed
```

Use these on an already-`ACTIVE` store — for example, to roll out a new backend migration to one tenant without repeating database/role creation.

## Seven initial stores

Fill the `STORE_1_*` through `STORE_7_*` values in `.env`, then run:

```bash
npm run tenant:provision:seven
```

This upserts each store's master `Store`/`StoreDomain` rows (generating a dedicated role and password for genuinely new stores — existing `ACTIVE` stores are left untouched) and runs the full provisioning pipeline for each. It does not log credentials and does not drop or reset databases. Safe to re-run.

## CLI equivalents

```bash
npm run tenant:db:create           # ensure every store's database exists (idempotent)
npm run tenant:migrate -- --store=<id>   # run migrations for one store
npm run tenant:migrate:all         # run migrations for all ACTIVE/PENDING/FAILED stores, stops on first failure
npm run tenant:migrate:all -- --continue-on-error  # keep going past failures
npm run tenant:seed -- --store=<id>      # reseed one store
```

## Suspending a store

```http
PATCH /api/super-admin/stores/:storeId/status
```

```json
{ "status": "SUSPENDED" }
```

A suspended store is rejected by both `resolveAdminTenant` and `resolvePublicTenant` (status must be `ACTIVE`).
```

- [ ] **Step 2: Update `docs/MULTI_TENANT_ARCHITECTURE.md`**

Add this section at the end of the file:

```markdown

## Payment webhooks

Stripe payment intents created via the customer panel carry `metadata.storeId`, set from the tenant resolved at checkout time (`resolvePublicTenant`). The webhook handler (`src/controllers/webhookController.js`) verifies the Stripe signature first, then:

- Checks `MasterWebhookEvent` (master DB) by `event.id` for idempotency — a replayed event short-circuits without reprocessing.
- Reads `metadata.storeId` off the payment intent and resolves that store's tenant client to apply the order update, instead of the master database.
- If `metadata.storeId` is missing (e.g. a stale or manually-created payment intent), the event is recorded as processed with no update — it never guesses a tenant.
- When `MULTI_TENANT_ENABLED=false`, behavior is unchanged from single-tenant mode (updates go to `masterPrisma`).

All 7 stores currently share one Stripe account (`STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`); tenant separation for payments is by `metadata.storeId`, not by Stripe account.

## Store provisioning

`src/services/storeProvisioning.service.js` is the single source of truth for turning a `PENDING` store into an `ACTIVE` one: create database → create a dedicated Postgres role (scoped to only that database) → migrate → seed → create the first store admin. Each step persists `Store.provisioningStep` on success, so a failed provisioning run can be retried and resumes rather than restarting. Both the Super Admin API (`POST /stores/:id/provision`) and the CLI scripts (`scripts/provisionSevenStores.js`, `scripts/createTenantDatabases.js`, `scripts/tenantMigrate.js`, `scripts/tenantSeed.js`) call the same service functions.
```

- [ ] **Step 3: Commit**

```bash
git add docs/TENANT_PROVISIONING.md docs/MULTI_TENANT_ARCHITECTURE.md
git commit -m "docs: document real provisioning pipeline and webhook tenant resolution"
```

---

## Manual verification (after all tasks)

These require a reachable Postgres server with a superuser-capable `TENANT_DB_ADMIN_USER` — run them if such an environment is available; otherwise leave as a documented remaining step for deployment:

1. `npm test` — full suite passes.
2. Create one throwaway store via `POST /api/super-admin/stores`, then `POST /api/super-admin/stores/:id/provision` — confirm via `psql` that the new database and a dedicated role (not the old shared `TENANT_DB_APP_USER`) exist, the tenant schema is migrated, and seed data is present.
3. Kill the provisioning mid-way (e.g., temporarily point `TENANT_DB_ADMIN_PASSWORD` at a wrong value) and confirm `provisioningStatus` becomes `FAILED` with a redacted `provisioningError`, then fix the credential and call `/provision` again — confirm it resumes rather than re-running completed steps.
4. With `MULTI_TENANT_ENABLED=true` and Stripe test keys configured, complete a test checkout against a specific store's domain, then replay the same Stripe test webhook event twice — confirm the order's `paymentStatus` updates once in that store's tenant database and the replay is a no-op (`duplicate: true`).
