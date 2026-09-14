const productService = require("../services/productService");
const asyncHandler = require("../utils/asyncHandler");
const { writeAuditLog } = require("../services/auditLogService");

const listProducts = asyncHandler(async (req, res) => {
  const products = await productService.listProducts(req.query);
  res.json({ success: true, data: products });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.params.id);
  res.json({ success: true, data: product });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.validated.body);
  writeAuditLog({ actorId: req.user?.userId || req.user?.id, storeId: req.store?.id, action: "create", module: "Products", description: `Created product: ${product.name}`, ipAddress: req.ip });
  res.status(201).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.validated.body);
  writeAuditLog({ actorId: req.user?.userId || req.user?.id, storeId: req.store?.id, action: "update", module: "Products", description: `Updated product: ${product.name}`, ipAddress: req.ip });
  res.json({ success: true, data: product });
});

const patchProduct = asyncHandler(async (req, res) => {
  const product = await productService.patchProduct(req.params.id, req.body);
  writeAuditLog({ actorId: req.user?.userId || req.user?.id, storeId: req.store?.id, action: "update", module: "Products", description: `Patched product: ${req.params.id}`, ipAddress: req.ip });
  res.json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  writeAuditLog({ actorId: req.user?.userId || req.user?.id, storeId: req.store?.id, action: "delete", module: "Products", description: `Deleted product: ${req.params.id}`, ipAddress: req.ip });
  res.json({ success: true, message: "Product deleted" });
});

module.exports = { createProduct, deleteProduct, getProduct, listProducts, patchProduct, updateProduct };
