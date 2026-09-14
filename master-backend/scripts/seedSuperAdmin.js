require("dotenv").config();

const bcrypt = require("bcryptjs");
const { masterPrisma } = require("../src/config/db");

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    throw new Error("Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env before running this script.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await masterPrisma.adminUser.upsert({
    where: { email },
    update: {
      name,
      role: "SUPER_ADMIN",
      passwordHash,
    },
    create: {
      name,
      email,
      role: "SUPER_ADMIN",
      passwordHash,
    },
  });

  console.log(`[seed:super-admin] ${email}`);
}

main()
  .catch((error) => {
    console.error("[seed:super-admin] failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await masterPrisma.$disconnect();
  });
