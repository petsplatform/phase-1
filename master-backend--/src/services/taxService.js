const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");

const ACTIVE_STATUS = "Active";

const list = ({ q } = {}) =>
  prisma.taxRate.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

const get = async (id) => {
  const record = await prisma.taxRate.findUnique({ where: { id } });
  if (!record) throw new ApiError(404, "Tax rate not found");
  return record;
};

const getActive = async () =>
  prisma.taxRate.findFirst({
    where: { status: ACTIVE_STATUS },
    orderBy: { updatedAt: "desc" },
  });

const create = async (payload) => {
  const data = normalizeTax(payload);

  return prisma.$transaction(async (tx) => {
    if (data.status === ACTIVE_STATUS) {
      await tx.taxRate.updateMany({
        where: { status: ACTIVE_STATUS },
        data: { status: "Inactive" },
      });
    }

    return tx.taxRate.create({
      data: { id: generateId("tax"), ...data },
    });
  });
};

const update = async (id, payload) => {
  await get(id);
  const data = normalizeTax(payload);

  return prisma.$transaction(async (tx) => {
    if (data.status === ACTIVE_STATUS) {
      await tx.taxRate.updateMany({
        where: { id: { not: id }, status: ACTIVE_STATUS },
        data: { status: "Inactive" },
      });
    }

    return tx.taxRate.update({ where: { id }, data });
  });
};

const remove = async (id) => {
  await get(id);
  await prisma.taxRate.delete({ where: { id } });
};

function normalizeTax(payload) {
  return {
    name: String(payload.name || "").trim(),
    rate: Number(payload.rate || 0),
    description: payload.description ? String(payload.description).trim() : null,
    status: payload.status === "Inactive" ? "Inactive" : ACTIVE_STATUS,
  };
}

module.exports = { list, get, getActive, create, update, remove };
