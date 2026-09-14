const autoOrderService = require("../services/autoOrderService");
const { writeAuditLog } = require("../services/auditLogService");
const asyncHandler = require("../utils/asyncHandler");

const createCustomerAutoOrder = asyncHandler(async (req, res) => {
  const data = await autoOrderService.createCustomerAutoOrder(req.customer, req.validated.body);
  res.status(201).json({ success: true, data });
});

const listCustomerAutoOrders = asyncHandler(async (req, res) => {
  const data = await autoOrderService.listCustomerAutoOrders(req.customer.id);
  res.json({ success: true, data });
});

const getCustomerAutoOrder = asyncHandler(async (req, res) => {
  const data = await autoOrderService.getCustomerAutoOrder(req.customer.id, req.validated.params.id);
  res.json({ success: true, data });
});

const updateCustomerAutoOrder = asyncHandler(async (req, res) => {
  const data = await autoOrderService.updateCustomerAutoOrder(
    req.customer,
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ success: true, data });
});

const pauseCustomerAutoOrder = asyncHandler(async (req, res) => {
  const data = await autoOrderService.pauseCustomerAutoOrder(req.customer.id, req.validated.params.id);
  res.json({ success: true, data });
});

const resumeCustomerAutoOrder = asyncHandler(async (req, res) => {
  const data = await autoOrderService.resumeCustomerAutoOrder(req.customer.id, req.validated.params.id);
  res.json({ success: true, data });
});

const cancelCustomerAutoOrder = asyncHandler(async (req, res) => {
  const data = await autoOrderService.cancelCustomerAutoOrder(req.customer.id, req.validated.params.id);
  res.json({ success: true, data });
});

const createPaymentSetupIntent = asyncHandler(async (req, res) => {
  const data = await autoOrderService.createPaymentSetupIntent(req.customer, req.validated.params.id);
  res.status(201).json({ success: true, data });
});

const savePaymentMethod = asyncHandler(async (req, res) => {
  const data = await autoOrderService.savePaymentMethodFromSetupIntent(
    req.customer,
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ success: true, data });
});

const listAdminAutoOrders = asyncHandler(async (req, res) => {
  const data = await autoOrderService.listAdminAutoOrders(req.query);
  res.json({ success: true, data });
});

const getAdminAutoOrder = asyncHandler(async (req, res) => {
  const data = await autoOrderService.getAdminAutoOrder(req.validated.params.id);
  res.json({ success: true, data });
});

const updateAdminAutoOrder = asyncHandler(async (req, res) => {
  const data = await autoOrderService.updateAdminAutoOrder(req.validated.params.id, req.validated.body);
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "update",
    module: "Automated Orders",
    description: `Updated automated order ${req.validated.params.id}`,
    ipAddress: req.ip,
  });
  res.json({ success: true, data });
});

const getAdminMetrics = asyncHandler(async (req, res) => {
  const data = await autoOrderService.getAutoOrderMetrics();
  res.json({ success: true, data });
});

const runDueAutoOrders = asyncHandler(async (req, res) => {
  const data = await autoOrderService.processDueAutoOrders(req.tenantDb);
  const processed = data.filter((item) => item && !item.duplicate).length;
  const successful = data.filter((item) => item?.success).length;
  const failed = data.filter((item) => item && item.success === false).length;
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "update",
    module: "Automated Orders",
    description: `Manually processed due automated orders: ${successful} successful, ${failed} failed`,
    ipAddress: req.ip,
    metadata: {
      entityType: "Automated Orders",
      entityId: req.store?.storeKey || req.store?.id || null,
      entityName: req.store?.name || null,
      processed,
      successful,
      failed,
    },
  });
  res.json({ success: true, data: { processed, successful, failed, results: data } });
});

module.exports = {
  cancelCustomerAutoOrder,
  createPaymentSetupIntent,
  createCustomerAutoOrder,
  getAdminAutoOrder,
  getAdminMetrics,
  getCustomerAutoOrder,
  listAdminAutoOrders,
  listCustomerAutoOrders,
  pauseCustomerAutoOrder,
  resumeCustomerAutoOrder,
  runDueAutoOrders,
  savePaymentMethod,
  updateAdminAutoOrder,
  updateCustomerAutoOrder,
};
