const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");

const list = async ({ q } = {}) => {
  const records = await prisma.coupon.findMany({
    where: q ? { OR: [{ code: { contains: q, mode: "insensitive" } }] } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return expireCoupons(records);
};

const get = async (id) => {
  const record = await prisma.coupon.findUnique({ where: { id } });
  if (!record) throw new ApiError(404, "Coupon not found");
  return (await expireCoupons([record]))[0];
};

const create = async (payload) => {
  const data = normalizeCoupon(payload);
  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) throw new ApiError(409, "Coupon code already exists. Please use a different coupon code.");

  return prisma.coupon.create({ data: { id: generateId("coupon"), ...data } });
};

const update = async (id, payload) => {
  await get(id);
  const data = normalizeCoupon(payload);
  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing && existing.id !== id) {
    throw new ApiError(409, "Coupon code already exists. Please use a different coupon code.");
  }

  return prisma.coupon.update({ where: { id }, data });
};

const remove = async (id) => {
  await get(id);
  await prisma.coupon.delete({ where: { id } });
};

function normalizeCoupon(payload) {
  const expiry = normalizeCouponExpiry(payload.expiry);
  return {
    ...payload,
    code: String(payload.code || "").trim().toUpperCase(),
    expiry,
    status: isCouponExpired(expiry) ? "Inactive" : payload.status || "Active",
  };
}

function isCouponExpired(expiry) {
  if (!expiry) return false;
  const date = new Date(expiry);
  if (Number.isNaN(date.getTime())) return false;
  return dateKey(date) < dateKey(new Date());
}

function dateKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function expireCoupons(records) {
  const expired = records.filter((record) => record.status === "Active" && isCouponExpired(record.expiry));
  if (expired.length) {
    await prisma.coupon.updateMany({
      where: { id: { in: expired.map((record) => record.id) } },
      data: { status: "Inactive" },
    });
  }

  return records.map((record) => (
    expired.some((expiredRecord) => expiredRecord.id === record.id)
      ? { ...record, status: "Inactive" }
      : record
  ));
}

function normalizeCouponExpiry(expiry) {
  if (!expiry) return expiry;
  const date = new Date(expiry);
  if (Number.isNaN(date.getTime())) return expiry;
  if (
    date.getHours() !== 0 ||
    date.getMinutes() !== 0 ||
    date.getSeconds() !== 0 ||
    date.getMilliseconds() !== 0
  ) {
    return date;
  }
  date.setHours(23, 59, 59, 999);
  return date;
}

module.exports = { list, get, create, update, remove };
