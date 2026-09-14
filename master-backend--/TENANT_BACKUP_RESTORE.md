# Tenant Backup And Restore

Back up and restore one tenant database at a time. Do not run destructive reset commands against production tenants.

## Backup

Use PostgreSQL tooling from a secure server:

```bash
pg_dump --format=custom --dbname=<tenant_database> --file=<storeKey>-backup.dump
```

## Restore

Restore into a prepared empty database:

```bash
pg_restore --dbname=<tenant_database> --clean --if-exists <storeKey>-backup.dump
```

After restore, run:

```bash
npm run tenant:migrate -- --store=<storeId>
```

## Password Rotation

1. Rotate the PostgreSQL password.
2. Update the store through the Super Admin API with `databasePassword`.
3. Restart the backend or let the tenant client reconnect after cache eviction.
4. Check `GET /api/super-admin/stores/:storeId/health`.
