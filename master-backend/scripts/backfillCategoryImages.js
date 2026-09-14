require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { masterPrisma } = require("../src/config/db");
const { buildTenantDatabaseUrl } = require("../src/config/tenantDatabaseManager");
const { findCategoryThemeImage } = require("../src/utils/categoryThemeImages");

async function updateStoreCategories(store) {
  const tenantPrisma = new PrismaClient({
    datasources: {
      db: {
        url: buildTenantDatabaseUrl(store),
      },
    },
  });

  try {
    const categories = await tenantPrisma.category.findMany();
    let updated = 0;

    for (const category of categories) {
      const image = findCategoryThemeImage(category);
      if (category.image === image) continue;

      await tenantPrisma.category.update({
        where: { id: category.id },
        data: { image },
      });
      updated += 1;
    }

    console.log(`[category-images] ${store.storeKey}: updated ${updated}/${categories.length}`);
  } finally {
    await tenantPrisma.$disconnect();
  }
}

async function main() {
  const stores = (await masterPrisma.store.findMany({
    orderBy: { storeKey: "asc" },
  })).filter((store) => store.databaseName && store.databaseUser && store.encryptedDatabasePass);

  for (const store of stores) {
    await updateStoreCategories(store);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await masterPrisma.$disconnect();
  });
