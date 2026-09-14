const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");

async function ensureExists(id) {
  const record = await prisma.inquiry.findUnique({ where: { id } });
  if (!record) throw new ApiError(404, "Inquiry not found");
  return record;
}

const create = (payload, db = prisma) =>
  db.inquiry.create({ data: { id: generateId("inquiry"), ...payload } });

const list = () => prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });

async function updateStatus(id, status) {
  await ensureExists(id);
  return prisma.inquiry.update({ where: { id }, data: { status } });
}

async function remove(id) {
  await ensureExists(id);
  await prisma.inquiry.delete({ where: { id } });
}

module.exports = { create, list, updateStatus, remove };
