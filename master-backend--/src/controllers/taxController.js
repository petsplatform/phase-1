const taxService = require("../services/taxService");
const asyncHandler = require("../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const records = await taxService.list(req.query);
  res.json({ success: true, data: records });
});

const active = asyncHandler(async (req, res) => {
  const record = await taxService.getActive();
  res.json({ success: true, data: record });
});

const get = asyncHandler(async (req, res) => {
  const record = await taxService.get(req.params.id);
  res.json({ success: true, data: record });
});

const create = asyncHandler(async (req, res) => {
  const record = await taxService.create(req.validated.body);
  res.status(201).json({ success: true, data: record });
});

const update = asyncHandler(async (req, res) => {
  const record = await taxService.update(req.params.id, req.validated.body);
  res.json({ success: true, data: record });
});

const remove = asyncHandler(async (req, res) => {
  await taxService.remove(req.params.id);
  res.json({ success: true, message: "Tax rate deleted" });
});

module.exports = { list, active, get, create, update, remove };
