const couponService = require("../services/couponService");
const asyncHandler = require("../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const records = await couponService.list(req.query);
  res.json({ success: true, data: records });
});

const get = asyncHandler(async (req, res) => {
  const record = await couponService.get(req.params.id);
  res.json({ success: true, data: record });
});

const create = asyncHandler(async (req, res) => {
  const record = await couponService.create(req.validated.body);
  res.status(201).json({ success: true, data: record });
});

const update = asyncHandler(async (req, res) => {
  const record = await couponService.update(req.params.id, req.validated.body);
  res.json({ success: true, data: record });
});

const remove = asyncHandler(async (req, res) => {
  await couponService.remove(req.params.id);
  res.json({ success: true, message: "Coupon deleted" });
});

module.exports = { list, get, create, update, remove };
