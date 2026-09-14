# Multi-Tenant Architecture

This backend supports a database-per-tenant model behind one API.

## Databases

- Master database: `AdminUser`, `Store`, `StoreDomain`, `UserStoreAssignment`, and `MasterAuditLog`.
- Tenant databases: existing commerce tables such as products, categories, customers, orders, coupons, banners, settings, and content.

Store admins are resolved through:

```text
AdminUser -> UserStoreAssignment -> Store -> tenant database
```

Frontend requests must never send database names, URLs, users, or passwords.

## Request Flow

Admin routes use `requireAuth` and `resolveAdminTenant`. The resolver validates the active assignment in the master database, loads the active store, resolves a cached Prisma client for that tenant, and attaches it as `req.tenantDb`.

Public storefront routes use `resolvePublicTenant`. The resolver reads `Origin`, then `X-Store-Domain`, and in development may use `X-Store-Key`. Domains are normalized and validated against active `StoreDomain` rows.

Existing services keep importing `prisma`; `src/config/db.js` routes calls to the request tenant client by using `AsyncLocalStorage`. Outside a tenant request it uses the master client.

## Safety Rules

- Tenant database passwords are encrypted with `TENANT_DATABASE_ENCRYPTION_KEY`.
- API responses never include tenant passwords or full database URLs.
- Store admin APIs do not trust `storeId` from request bodies, params, or headers.
- Customer tokens include `storeId` when a public tenant is resolved.
- Tenant Prisma clients are cached by store and disconnected on shutdown.
