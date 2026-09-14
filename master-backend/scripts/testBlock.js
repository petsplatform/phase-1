require("dotenv").config({ override: true });
require("../src/config/env");

const fs = require("fs");
const { getTenantClient } = require("../src/config/tenantDatabaseManager");
const { masterPrisma } = require("../src/config/db");

async function run() {
  const store = await masterPrisma.store.findFirst({ where: { storeKey: "STORE_1" } });
  const db = await getTenantClient(store);
  const customer = await db.customer.findFirst({ orderBy: { joined: "desc" } });
  if (!customer) { fs.writeFileSync("test_out.txt", "No customer found"); return; }

  const updated = await db.customer.update({
    where: { id: customer.id },
    data: { status: "Inactive", blockedReason: "Test block" },
  });
  const restored = await db.customer.update({
    where: { id: customer.id },
    data: { status: "Active", blockedReason: null },
  });
  fs.writeFileSync("test_out.txt", `OK: blocked=${updated.status}/${updated.blockedReason} restored=${restored.status}`);
  await masterPrisma.$disconnect();
}

run().catch((e) => fs.writeFileSync("test_out.txt", "ERR: " + e.message));
