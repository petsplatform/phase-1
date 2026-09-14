const asyncHandler = require("../utils/asyncHandler");
const shipmentService = require("../services/shipmentService");
const courierService = require("../services/courierService");

function adminMeta(req) {
  return {
    adminId: req.user?.userId || req.user?.id || null,
    storeId: req.store?.id || null,
    store: req.store,
    ip: req.ip,
  };
}

const listShipments = asyncHandler(async (req, res) => {
  const data = await shipmentService.listShipments(req.validated?.query || req.query, req.tenantDb);
  res.json({ success: true, data });
});

const getShipment = asyncHandler(async (req, res) => {
  const data = await shipmentService.getShipment(req.params.id, req.tenantDb);
  res.json({ success: true, data });
});

const createShipment = asyncHandler(async (req, res) => {
  const data = await shipmentService.createOrUpdateShipment(req.params.id, req.validated.body, adminMeta(req), req.tenantDb);
  res.status(201).json({ success: true, data });
});

const updateShipment = asyncHandler(async (req, res) => {
  const data = await shipmentService.createOrUpdateShipment(req.params.id, req.validated.body, adminMeta(req), req.tenantDb);
  res.json({ success: true, data });
});

const updateShipmentStatus = asyncHandler(async (req, res) => {
  const data = await shipmentService.updateShipmentStatus(req.params.id, req.validated.body, adminMeta(req), req.tenantDb);
  res.json({ success: true, data });
});

const deleteShipment = asyncHandler(async (req, res) => {
  const data = await shipmentService.deleteShipment(req.params.id, adminMeta(req), req.tenantDb);
  res.json({ success: true, data });
});

const bulkShipments = asyncHandler(async (req, res) => {
  const data = await shipmentService.bulkCreateShipments(req.validated.body, adminMeta(req), req.tenantDb);
  res.status(201).json({ success: true, data });
});

const customerShipment = asyncHandler(async (req, res) => {
  const data = await shipmentService.getShipment(req.params.id, req.tenantDb, req.customer.id);
  res.json({ success: true, data });
});

const customerTracking = asyncHandler(async (req, res) => {
  const data = await shipmentService.getTracking(req.params.id, req.tenantDb, req.customer.id);
  res.json({ success: true, data });
});

const listCouriers = asyncHandler(async (req, res) => {
  const data = await courierService.listCouriers(req.query, req.tenantDb);
  res.json({ success: true, data });
});

const createCourier = asyncHandler(async (req, res) => {
  const data = await courierService.createCourier(req.validated.body, req.tenantDb);
  res.status(201).json({ success: true, data });
});

const updateCourier = asyncHandler(async (req, res) => {
  const data = await courierService.updateCourier(req.params.id, req.validated.body, req.tenantDb);
  res.json({ success: true, data });
});

const deleteCourier = asyncHandler(async (req, res) => {
  const data = await courierService.deleteCourier(req.params.id, req.tenantDb);
  res.json({ success: true, data });
});

const getSettings = asyncHandler(async (req, res) => {
  const data = await courierService.getShipmentSettings(req.tenantDb);
  res.json({ success: true, data });
});

const updateSettings = asyncHandler(async (req, res) => {
  const data = await courierService.updateShipmentSettings(req.validated.body, req.tenantDb);
  res.json({ success: true, data });
});

module.exports = {
  bulkShipments,
  createCourier,
  createShipment,
  customerShipment,
  customerTracking,
  deleteCourier,
  deleteShipment,
  getSettings,
  getShipment,
  listCouriers,
  listShipments,
  updateCourier,
  updateSettings,
  updateShipment,
  updateShipmentStatus,
};
