# Webhook Tenant Fix + Real Store Provisioning — Design

Date: 2026-07-15
Repo touched: `Admin-pannel-backend`

## Context

A prior session already built the core multi-tenant machinery: master DB (`Store`, `StoreDomain`, `UserStoreAssignment`, `MasterAuditLog`), `resolveAdminTenant`/`resolvePublicTenant` middleware, AES-256-GCM credential encryption (`tenantCrypto.js`), a cached tenant Prisma client manager, and dynamic CORS. That part works and is not being touched here.

Two things are broken or missing:

1. **Stripe webhook never resolves a tenant.** `webhookController.js` calls the shared `prisma` proxy directly with no `resolveAdminTenant`/`resolvePublicTenant` in its route chain, so it always falls back to `masterPrisma`. Once `MULTI_TENANT_ENABLED=true`, order lookups by `stripePaymentIntentId` will find nothing in the master DB (the order lives in a tenant DB) and payment status updates silently no-op.
2. **Provisioning isn't real.** `POST /api/super-admin/stores/:id/provision|migrate|seed` are stub handlers that return `202 queued` and do nothing (`superAdminController.js:44-49,58-61`). Actual DB creation/migration/seeding only happens via manually-run CLI scripts (`createTenantDatabases.js`, `tenantMigrate.js`, `tenantSeed.js`, `provisionSevenStores.js`) that hardcode `provisioningStatus: "COMPLETED"` regardless of whether those steps actually succeeded, with no retry/resume logic.

This spec covers fixing both, as one unit since the provisioning service and the webhook fix both touch `Store`/tenant-resolution code paths.

## Assumptions (confirm if wrong)

- All 7 stores share one Stripe account (single `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` in env). Per-store Stripe credentials are out of scope.
- The existing single `prisma/schema.prisma` shared between master and tenant DBs is a known, pre-existing wart (tenant DBs get unused `AdminUser`/`Store`/... tables). Not being fixed here — new models added below inherit the same limitation.
- `TENANT_DB_ADMIN_USER` will be granted `CREATEROLE` in addition to its existing `CREATEDB` privilege before this ships (needed for per-store role creation). This is a manual DBA step, documented but not automated.

## Data model changes

```prisma
model Store {
  // ...existing fields unchanged...
  provisioningStep String? // VALIDATED | DB_CREATED | ROLE_CREATED | MIGRATED | SEEDED | ADMIN_CREATED | DONE
}

model MasterWebhookEvent {
  id          String   @id @default(uuid())
  provider    String   // "stripe"
  eventId     String   @unique
  storeId     String?
  type        String
  processedAt DateTime @default(now())

  @@index([storeId])
}
```

One migration adds both. `provisioningStep` is nullable so existing `ACTIVE` stores (the 7 already provisioned via the CLI scripts) are left `null`/unaffected — resume logic only kicks in when a provisioning run is explicitly (re)started.

## Store creation → provisioning flow

**`POST /api/super-admin/stores` (changed contract):** Super Admin sends `name`, `slug`, `storeKey`, `primaryDomain`, optional `databaseName` (defaults to `store_<slug_with_underscores>`). No `databasePassword`/`databaseUser` in the request — the server generates a dedicated Postgres role name (`store_<slug>_app`) and a random 32-byte password immediately, encrypts the password with `encryptSecret`, and saves the `Store` row as `status=PENDING`, `provisioningStatus=NOT_STARTED`, `provisioningStep=null`. No real Postgres objects exist yet at this point.

**`POST /api/super-admin/stores/:id/provision`** (also takes `{ adminEmail, adminPassword, adminName }` for the first store admin) runs synchronously and advances a step machine, persisting `provisioningStep` after each success so retrying resumes rather than restarting:

1. **DB_CREATED** — `CREATE DATABASE <name>` via the admin Postgres connection, skipped if `pg_database` already has it (reuses `createTenantDatabases.js` logic, moved into the service).
2. **ROLE_CREATED** — `CREATE ROLE <role> LOGIN PASSWORD '<decrypted generated password>'` if `pg_roles` doesn't already have it, then `GRANT ALL PRIVILEGES ON DATABASE <name> TO <role>`. Scoped to that one database only.
3. **MIGRATED** — runs `prisma migrate deploy` with `DATABASE_URL` built from the tenant's own role/password (not the admin credentials), via `child_process.execFileSync` (reuses `tenantMigrate.js` logic).
4. **SEEDED** — runs `prisma/seed.js` against the tenant URL (reuses `tenantSeed.js` logic), passing `TENANT_STORE_NAME`/`TENANT_SUPPORT_EMAIL` env vars as it does today.
5. **ADMIN_CREATED** — creates (or upserts by email) the first `AdminUser` in the master DB and a `UserStoreAssignment(role: STORE_ADMIN, isActive: true)`, using the `adminEmail`/`adminPassword`/`adminName` from the request body.
6. **DONE** — `status=ACTIVE`, `provisioningStatus=COMPLETED`.

On any step failure: `provisioningStatus=FAILED`, `provisioningError` set to a sanitized message (strip anything matching a `postgresql://...` URL pattern or the raw password before saving), `provisioningStep` stays at the last **completed** step. Calling `/provision` again re-enters the step machine at the first incomplete step — each step function checks for existing state before acting, so re-running a completed step is a no-op (idempotent).

Every attempt (start, per-step failure, final success) writes a `MasterAuditLog` row (`action: "STORE_PROVISION_STARTED" | "STORE_PROVISION_STEP_FAILED" | "STORE_PROVISION_COMPLETED"`, `metadata: { step }`), with credentials never included in `metadata`.

**`POST /stores/:id/migrate`** and **`POST /stores/:id/seed`** remain as separate endpoints that call the MIGRATED/SEEDED step functions directly against an already-provisioned store — for re-running a schema update or reseeding without repeating DB/role creation.

**CLI scripts refactor:** `provisionSevenStores.js`, `createTenantDatabases.js`, `tenantMigrate.js`, `tenantSeed.js` get rewritten to call the same step functions from the new `src/services/storeProvisioning.service.js` instead of duplicating the logic inline, so the bootstrap path and the API can't drift apart. `npm run tenant:provision:seven` becomes a loop that calls the service's full pipeline per configured `STORE_1..7_*` env block.

## Webhook fix

- `customerPanelService.js` — `createPaymentIntent` and `updatePaymentIntent`: add `storeId: getCurrentStore()?.id` into the Stripe `metadata` object passed to `stripeService` (mirrors the existing `signCustomerToken` pattern at line 48).
- `webhookController.js` rewrite:
  1. Verify signature first (unchanged — must happen before any DB access).
  2. Look up `MasterWebhookEvent` by `event.id` against `masterPrisma`. If found, return `200 { received: true, duplicate: true }` immediately — no reprocessing.
  3. Read `metadata.storeId` off `event.data.object`.
     - `MULTI_TENANT_ENABLED=false`: unchanged current behavior against `masterPrisma` (single-tenant deployments keep working as-is).
     - `true` and `storeId` present: load the `Store` from master DB, require `status=ACTIVE` (403-equivalent skip + log if not), resolve its tenant client via `getTenantClient`, find/update the `Order` there by `stripePaymentIntentId`.
     - `true` and `storeId` missing: log a warning (no PII/secrets), still record the `MasterWebhookEvent` as processed with `storeId: null`, return `200` — never guess a tenant.
  4. Record the `MasterWebhookEvent` row after successful processing (or after the "skip, no storeId" branch), inside the same handler so a genuine DB failure mid-update doesn't get marked processed (leaving it retryable by Stripe's own retry mechanism).

## API endpoint summary (changed only)

| Method | Path | Change |
|---|---|---|
| POST | `/api/super-admin/stores` | No longer accepts `databasePassword`/`databaseUser` in the body; server-generates and encrypts them. `databaseName` becomes optional. |
| POST | `/api/super-admin/stores/:id/provision` | Real implementation (was a stub). Body: `{ adminEmail, adminPassword, adminName }`. Runs the full step machine synchronously, returns final store state (never includes credentials). |
| POST | `/api/super-admin/stores/:id/migrate` | Real implementation (was a stub). No body. Runs MIGRATED step only. |
| POST | `/api/super-admin/stores/:id/seed` | Real implementation (was a stub). No body. Runs SEEDED step only. |
| POST | `/api/webhooks/stripe` (existing path, unchanged) | Handler rewritten per above; response shape unchanged (`{ received: true }`, plus `duplicate: true` on dedupe). |

## Env additions

- `TENANT_DB_ADMIN_USER`/`TENANT_DB_ADMIN_PASSWORD` now require `CREATEROLE` in addition to the existing `CREATEDB` (documented in `docs/TENANT_PROVISIONING.md`, not automated — this is a one-time DBA action against the Postgres server).

No new env var names — provisioning reuses `TENANT_DB_HOST/PORT/ADMIN_USER/ADMIN_PASSWORD` already in `.env.example`.

## Testing

- `tests/services/storeProvisioning.service.test.js`: each step function is idempotent (calling twice doesn't error/duplicate), a failure at step N leaves `provisioningStep` at N-1's completion and a retry resumes from N, sanitization strips connection strings/passwords from `provisioningError`.
- `tests/controllers/webhookController.test.js` (new): metadata-present routes to the right tenant client (mocked `getTenantClient`), metadata-absent skips without throwing, duplicate `event.id` short-circuits without a second DB write, `MULTI_TENANT_ENABLED=false` preserves old behavior.
- Manual verification: provision one throwaway store end-to-end via the API (not the CLI script), confirm `psql` shows the new database and role, confirm the tenant DB has the migrated schema and seed data, confirm a Stripe test webhook event updates the right store's order and a replayed event is a no-op.
- Full cross-store isolation test suite (products/orders/customers across stores, domain resolution, disabled assignments, etc.) stays out of scope — deferred to a separate future sub-project per the priority ordering already agreed.

## Non-goals

- No job queue / async provisioning (confirmed: synchronous, step-tracked).
- No per-store Stripe credentials.
- No frontend changes (Super Admin UI, store-admin header, axios headers) — separate sub-project.
- No fix for the shared master/tenant `schema.prisma` file structure.
- Not adding rate limiting to the webhook or super-admin routes (pre-existing gap, not introduced or worsened here).
