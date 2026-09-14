const { prisma: defaultPrisma } = require("../config/db");
const ApiError = require("../utils/apiError");

function getDb(db) {
  return db || defaultPrisma;
}

async function listCouriers({ q, status } = {}, db) {
  const client = getDb(db);
  return client.courier.findMany({
    where: {
      status: status && status !== "All" ? status : undefined,
      name: q ? { contains: q, mode: "insensitive" } : undefined,
    },
    orderBy: { name: "asc" },
  });
}

async function getCourier(id, db) {
  const client = getDb(db);
  const courier = await client.courier.findUnique({ where: { id } });
  if (!courier) throw new ApiError(404, "Courier not found");
  return courier;
}

async function createCourier(payload, db) {
  const client = getDb(db);
  return client.courier.create({
    data: {
      name: payload.name,
      trackingUrlPattern: payload.trackingUrlPattern || null,
      status: payload.status || "Active",
    },
  });
}

async function updateCourier(id, payload, db) {
  const client = getDb(db);
  await getCourier(id, client);
  return client.courier.update({
    where: { id },
    data: {
      name: payload.name,
      trackingUrlPattern: payload.trackingUrlPattern || null,
      status: payload.status || "Active",
    },
  });
}

async function deleteCourier(id, db) {
  const client = getDb(db);
  await getCourier(id, client);
  return client.courier.update({ where: { id }, data: { status: "Inactive" } });
}

async function getShipmentSettings(db) {
  const client = getDb(db);
  return client.shipmentSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

async function updateShipmentSettings(payload, db) {
  const client = getDb(db);
  return client.shipmentSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...payload },
    update: payload,
  });
}

module.exports = {
  createCourier,
  deleteCourier,
  getCourier,
  getShipmentSettings,
  listCouriers,
  updateCourier,
  updateShipmentSettings,
};
