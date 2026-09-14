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
