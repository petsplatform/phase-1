const { getTenantClient } = require("../config/tenantDatabaseManager");
const service = require("../services/superAdminStoreService");
const overviewService = require("../services/superAdminOverviewService");
const provisioningService = require("../services/storeProvisioning.service");
const asyncHandler = require("../utils/asyncHandler");

const actorId = (req) => req.user?.userId || req.user?.id || null;

const listStores = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listStores() });
});

const overview = asyncHandler(async (req, res) => {
  const filters = {
    ...req.query,
    storeKey: req.query.storeKey || req.headers["x-store-key"],
  };
  res.json({ success: true, data: await overviewService.overview(filters) });
});

const listOrders = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await overviewService.listOrders(req.query) });
});

const getShipmentLabel = asyncHandler(async (req, res) => {
  const html = await overviewService.getShipmentLabelHtml(req.params.id);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `inline; filename=shipment-label-${req.params.id}.html`);
  res.send(html);
});

const listProducts = asyncHandler(async (req, res) => {
  const filters = {
    ...req.query,
    storeKey: req.query.storeKey || req.headers["x-store-key"],
  };
  res.json({ success: true, data: await overviewService.listProducts(filters) });
});

const listCustomers = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await overviewService.listCustomers(req.query) });
});

const listCategories = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await overviewService.listCategories(req.query) });
});

const listVetVerifications = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await overviewService.listVetVerifications(req.query) });
});

const getVetVerification = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await overviewService.getVetVerification(req.params.id) });
});

const createStore = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.createStore(actorId(req), req.body) });
});

const getStore = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getStore(req.params.storeId) });
});

const updateStore = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateStore(actorId(req), req.params.storeId, req.body) });
});

const addDomain = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.addDomain(actorId(req), req.params.storeId, req.body) });
});

const removeDomain = asyncHandler(async (req, res) => {
  await service.removeDomain(actorId(req), req.params.storeId, req.params.domainId);
  res.json({ success: true, message: "Domain removed" });
});

const updateStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateStatus(actorId(req), req.params.storeId, req.body.status) });
});

const assignUser = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.assignUser(actorId(req), req.params.storeId, req.body) });
});

const health = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.storeHealth(req.params.storeId, getTenantClient) });
});

const provisionStore = asyncHandler(async (req, res) => {
  await provisioningService.provisionStore(actorId(req), req.params.storeId, req.body);
  res.json({ success: true, data: await service.getStore(req.params.storeId) });
});

const migrateStore = asyncHandler(async (req, res) => {
  const result = await provisioningService.migrateStore(actorId(req), req.params.storeId);
  res.json({ success: true, data: result });
});

const seedStore = asyncHandler(async (req, res) => {
  const result = await provisioningService.seedStore(actorId(req), req.params.storeId);
  res.json({ success: true, data: result });
});

module.exports = {
  addDomain,
  assignUser,
  createStore,
  getShipmentLabel,
  getStore,
  getVetVerification,
  health,
  listCategories,
  listCustomers,
  listVetVerifications,
  listOrders,
  listProducts,
  listStores,
  migrateStore,
  overview,
  provisionStore,
  removeDomain,
  seedStore,
  updateStatus,
  updateStore,
};
