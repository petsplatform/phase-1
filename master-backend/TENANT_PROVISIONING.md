# Tenant Provisioning

Use the Super Admin API to create store metadata, domains, and assignments. Database creation should be performed with controlled PostgreSQL administrative credentials outside normal request handlers.

## Seven Initial Stores

Fill the `STORE_1_*` through `STORE_7_*` values in `.env`, then run:

```bash
npm run tenant:provision:seven
```

This creates or updates master `Store` and `StoreDomain` rows. It does not log credentials and does not drop or reset databases.

## First Store Admin

Use:

```http
POST /api/super-admin/stores/:storeId/users
```

Body:

```json
{
  "name": "Store Admin",
  "email": "admin@example.com",
  "password": "change-me",
  "role": "STORE_ADMIN"
}
```

## Activating A Store

After the tenant database exists and migrations/seeds pass:

```http
PATCH /api/super-admin/stores/:storeId/status
```

```json
{ "status": "ACTIVE" }
```
