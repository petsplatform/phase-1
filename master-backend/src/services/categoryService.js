const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { withCategoryThemeImage } = require("../utils/categoryThemeImages");
const { generateId } = require("../utils/ids");

const includeCount = { _count: { select: { products: true } } };

async function listCategories({ q, status }) {
  const categories = await prisma.category.findMany({
    where: {
      status: status && status !== "All" ? status : undefined,
      OR: q
        ? [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: includeCount,
    orderBy: { createdAt: "desc" },
  });
  return categories.map(withCategoryThemeImage);
}

async function getCategory(id) {
  const category = await prisma.category.findUnique({ where: { id }, include: includeCount });
  if (!category) throw new ApiError(404, "Category not found");
  return withCategoryThemeImage(category);
}

async function createCategory(payload) {
  const category = await prisma.category.create({
    data: { id: generateId("category"), ...payload },
    include: includeCount,
  });
  return withCategoryThemeImage(category);
}

async function updateCategory(id, payload) {
  await getCategory(id);
  const category = await prisma.category.update({ where: { id }, data: payload, include: includeCount });
  return withCategoryThemeImage(category);
}

async function deleteCategory(id) {
  await getCategory(id);
  await prisma.category.delete({ where: { id } });
}

module.exports = { createCategory, deleteCategory, getCategory, listCategories, updateCategory };
