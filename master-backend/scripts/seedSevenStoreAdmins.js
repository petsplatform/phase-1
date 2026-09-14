require("dotenv").config();

const bcrypt = require("bcryptjs");
const { masterPrisma } = require("../src/config/db");

function value(name) {
  return process.env[name];
}

function adminConfig(index) {
  const storeKey = value(`STORE_${index}_KEY`) || `STORE_${index}`;
  const storeName = value(`STORE_${index}_NAME`) || `Local Store ${index}`;

  return {
    storeKey,
    name: value(`STORE_${index}_ADMIN_NAME`) || `${storeName} Admin`,
    email: value(`STORE_${index}_ADMIN_EMAIL`) || `admin${index}@store.local`,
    password:
      value(`STORE_${index}_ADMIN_PASSWORD`) ||
      value("SEVEN_STORE_ADMIN_PASSWORD") ||
      "Store@12345",
  };
}

async function upsertStoreAdmin(index) {
  const config = adminConfig(index);
  const store = await masterPrisma.store.findUnique({
    where: { storeKey: config.storeKey },
  });

  if (!store) {
    console.log(`[seed:store-admins] skipped ${config.storeKey}; store not found`);
    return;
  }

  const passwordHash = await bcrypt.hash(config.password, 10);
  const admin = await masterPrisma.adminUser.upsert({
    where: { email: config.email },
    update: {
      name: config.name,
      role: "STORE_ADMIN",
      passwordHash,
    },
    create: {
      name: config.name,
      email: config.email,
      role: "STORE_ADMIN",
      passwordHash,
    },
  });

  await masterPrisma.userStoreAssignment.upsert({
    where: { userId_storeId: { userId: admin.id, storeId: store.id } },
    update: { role: "STORE_ADMIN", isActive: true },
    create: {
      userId: admin.id,
      storeId: store.id,
      role: "STORE_ADMIN",
      isActive: true,
    },
  });

  console.log(`[seed:store-admins] ${config.storeKey} -> ${config.email}`);
}

async function main() {
  for (let index = 1; index <= 7; index += 1) {
    await upsertStoreAdmin(index);
  }
}

main()
  .catch((error) => {
    console.error("[seed:store-admins] failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await masterPrisma.$disconnect();
  });
