# Tenant Migrations

The project uses Prisma 6.19.0. Tenant migrations reuse the existing Prisma migration folder and set `DATABASE_URL` per tenant internally.

Run one tenant:

```bash
npm run tenant:migrate -- --store=<storeId>
```

Run all tenants:

```bash
npm run tenant:migrate:all
```

Continue after a tenant failure:

```bash
npm run tenant:migrate:all -- --continue-on-error
```

Seed one tenant:

```bash
npm run tenant:seed -- --store=<storeId>
```

Seed all active tenants:

```bash
npm run tenant:seed:all
```

These scripts never print tenant database passwords or URLs.
