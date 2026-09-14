# Deployment

## Required Hosts

```text
api.platform-domain.com       -> backend API
admin.platform-domain.com     -> store admin panel
superadmin.platform-domain.com -> super admin panel
website1.com                  -> storefront
website2.com                  -> storefront
website3.com                  -> storefront
website4.com                  -> storefront
website5.com                  -> storefront
website6.com                  -> storefront
website7.com                  -> storefront
```

All storefronts call the same backend and send the actual domain through the browser `Origin` header. Local development can send `X-Store-Key`.

## Environment

Set `MASTER_DATABASE_URL`, `DATABASE_URL`, `TENANT_DATABASE_ENCRYPTION_KEY`, and tenant database admin/app credentials securely in the deployment environment. Do not commit secrets.

Set `MULTI_TENANT_ENABLED=true` only after:

1. Master migrations have been applied.
2. Store rows and domains exist.
3. Tenant databases have been created.
4. Tenant migrations and seeds have passed.
5. Store admin assignments exist.

## CORS

Storefront domains are loaded from active `StoreDomain` rows. Admin and super admin origins can be added with `CORS_ALLOWED_ORIGINS`.
