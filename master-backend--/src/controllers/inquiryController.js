const inquiryService = require("../services/inquiryService");
const asyncHandler = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.create(req.validated.body, req.tenantDb);
  res.status(201).json({ success: true, data: inquiry });
});

const list = asyncHandler(async (req, res) => {
  const inquiries = await inquiryService.list();
  res.json({ success: true, data: inquiries });
});

const updateStatus = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.updateStatus(req.params.id, req.validated.body.status);
  res.json({ success: true, data: inquiry });
});

const remove = asyncHandler(async (req, res) => {
  await inquiryService.remove(req.params.id);
  res.json({ success: true, message: "Inquiry deleted" });
});

module.exports = { create, list, updateStatus, remove };
