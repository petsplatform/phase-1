const asyncHandler = require("../utils/asyncHandler");
const svc = require("../services/shipmentChargeService");

const list = asyncHandler(async (req, res) => {
  const data = await svc.listCharges(req.tenantDb);
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const data = await svc.createCharge(req.validated.body, req.tenantDb);
  res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const data = await svc.updateCharge(req.params.id, req.validated.body, req.tenantDb);
  res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  await svc.deleteCharge(req.params.id, req.tenantDb);
  res.json({ success: true });
});

const publicList = asyncHandler(async (req, res) => {
  const data = await svc.getPublicCharges(req.tenantDb);
  res.json({ success: true, data });
});

module.exports = { create, list, publicList, remove, update };
