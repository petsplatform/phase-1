const { prisma: defaultPrisma } = require("../config/db");
const ApiError = require("../utils/apiError");

function getDb(db) {
  return db || defaultPrisma;
}

async function listCharges(db) {
  return getDb(db).shipmentCharge.findMany({
    orderBy: { minOrderAmount: "asc" },
  });
}

async function getCharge(id, db) {
  const charge = await getDb(db).shipmentCharge.findUnique({ where: { id } });
  if (!charge) throw new ApiError(404, "Shipment charge not found");
  return charge;
}

async function createCharge(payload, db) {
  return getDb(db).shipmentCharge.create({
    data: {
      label: payload.label,
      minOrderAmount: payload.minOrderAmount,
      maxOrderAmount: payload.maxOrderAmount ?? null,
      charge: payload.charge,
      status: payload.status || "Active",
    },
  });
}

async function updateCharge(id, payload, db) {
  await getCharge(id, db);
  return getDb(db).shipmentCharge.update({
    where: { id },
    data: {
      label: payload.label,
      minOrderAmount: payload.minOrderAmount,
      maxOrderAmount: payload.maxOrderAmount ?? null,
      charge: payload.charge,
      status: payload.status || "Active",
    },
  });
}

async function deleteCharge(id, db) {
  await getCharge(id, db);
  return getDb(db).shipmentCharge.delete({ where: { id } });
}

// Called during checkout to auto-resolve shipping cost from subtotal
async function resolveShippingCharge(subtotal, db) {
  const charges = await getDb(db).shipmentCharge.findMany({
    where: { status: "Active" },
    orderBy: { minOrderAmount: "asc" },
  });
  if (!charges.length) return 0;

  const amount = Number(subtotal) || 0;
  const matched = charges.find((c) => {
    const aboveMin = amount >= c.minOrderAmount;
    const belowMax = c.maxOrderAmount === null || c.maxOrderAmount === undefined || amount <= c.maxOrderAmount;
    return aboveMin && belowMax;
  });
  return matched ? matched.charge : 0;
}

// Public endpoint — returns active charges for website display
async function getPublicCharges(db) {
  return getDb(db).shipmentCharge.findMany({
    where: { status: "Active" },
    select: { id: true, label: true, minOrderAmount: true, maxOrderAmount: true, charge: true },
    orderBy: { minOrderAmount: "asc" },
  });
}

module.exports = { createCharge, deleteCharge, getCharge, getPublicCharges, listCharges, resolveShippingCharge, updateCharge };
