const categoryService = require("../services/categoryService");
const asyncHandler = require("../utils/asyncHandler");

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories(req.query);
  res.json({ success: true, data: categories });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategory(req.params.id);
  res.json({ success: true, data: category });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.validated.body);
  res.status(201).json({ success: true, data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.validated.body);
  res.json({ success: true, data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.json({ success: true, message: "Category deleted" });
});

module.exports = { createCategory, deleteCategory, getCategory, listCategories, updateCategory };
