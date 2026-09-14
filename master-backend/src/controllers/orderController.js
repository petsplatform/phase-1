const orderService = require("../services/orderService");
const asyncHandler = require("../utils/asyncHandler");
const { writeAuditLog } = require("../services/auditLogService");

const listOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listOrders(req.query, req.tenantDb);
  res.json({ success: true, data: orders });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrder(req.params.id, req.tenantDb);
  res.json({ success: true, data: order });
});

const getInvoice = asyncHandler(async (req, res) => {
  const html = await orderService.getInvoiceHtml(req.params.id, req.store, req.tenantDb);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `inline; filename=invoice-${req.params.id}.html`);
  res.send(html);
});

const getShipmentLabel = asyncHandler(async (req, res) => {
  const html = await orderService.getShipmentLabelHtml(req.params.id, req.store, req.tenantDb);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `inline; filename=shipment-label-${req.params.id}.html`);
  res.send(html);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.validated.body.orderStatus,
    req.tenantDb,
    req.store,
  );
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "update",
    module: "Orders",
    description: `Order status changed to ${req.validated.body.orderStatus}`,
    ipAddress: req.ip,
    metadata: {
      entityType: "Order",
      entityId: order.id,
      entityName: order.customerName,
      entityEmail: order.email,
      orderId: order.id,
      status: req.validated.body.orderStatus,
    },
  });
  res.json({ success: true, data: order });
});

const deleteOrder = asyncHandler(async (req, res) => {
  const order = await orderService.deleteOrder(req.params.id, req.tenantDb);
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "delete",
    module: "Orders",
    description: "Order deleted",
    ipAddress: req.ip,
    metadata: {
      entityType: "Order",
      entityId: order.id,
      entityName: order.customerName,
      entityEmail: order.email,
      orderId: order.id,
    },
  });
  res.json({ success: true, message: "Order deleted" });
});

module.exports = {
  deleteOrder,
  getInvoice,
  getOrder,
  getShipmentLabel,
  listOrders,
  updateOrderStatus,
};
