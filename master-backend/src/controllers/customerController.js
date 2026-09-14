const customerService = require("../services/customerService");
const asyncHandler = require("../utils/asyncHandler");
const { writeAuditLog } = require("../services/auditLogService");

const listCustomers = asyncHandler(async (req, res) => {
  const customers = await customerService.listCustomers(req.query, req.tenantDb);
  res.json({ success: true, data: customers });
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomer(req.params.id, req.tenantDb);
  res.json({ success: true, data: customer });
});

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.tenantDb);
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "create",
    module: "Customers",
    description: "Customer created",
    ipAddress: req.ip,
    metadata: { entityType: "Customer", entityId: customer.id, entityName: customer.name, entityEmail: customer.email },
  });
  res.status(201).json({ success: true, data: customer });
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.tenantDb);
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "update",
    module: "Customers",
    description: "Customer updated",
    ipAddress: req.ip,
    metadata: { entityType: "Customer", entityId: customer.id, entityName: customer.name, entityEmail: customer.email },
  });
  res.json({ success: true, data: customer });
});

const updateCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomerStatus(req.params.id, req.body.status, req.tenantDb);
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "update",
    module: "Customers",
    description: `Customer status set to ${req.body.status}`,
    ipAddress: req.ip,
    metadata: { entityType: "Customer", entityId: customer.id, entityName: customer.name, entityEmail: customer.email, status: req.body.status },
  });
  res.json({ success: true, data: customer });
});

const blockCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.blockCustomer(req.params.id, req.body.reason, req.tenantDb, req.store);
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "update",
    module: "Customers",
    description: `Customer blocked. Reason: ${req.body.reason || "N/A"}`,
    ipAddress: req.ip,
    metadata: { entityType: "Customer", entityId: customer.id, entityName: customer.name, entityEmail: customer.email, reason: req.body.reason || null },
  });
  res.json({ success: true, data: customer });
});

const unblockCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.unblockCustomer(req.params.id, req.tenantDb, req.store);
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "update",
    module: "Customers",
    description: "Customer unblocked",
    ipAddress: req.ip,
    metadata: { entityType: "Customer", entityId: customer.id, entityName: customer.name, entityEmail: customer.email },
  });
  res.json({ success: true, data: customer });
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.deleteCustomer(req.params.id, req.tenantDb);
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "delete",
    module: "Customers",
    description: "Customer deleted",
    ipAddress: req.ip,
    metadata: { entityType: "Customer", entityId: customer.id, entityName: customer.name, entityEmail: customer.email },
  });
  res.json({ success: true, message: "Customer deleted" });
});

module.exports = { blockCustomer, createCustomer, deleteCustomer, getCustomer, listCustomers, unblockCustomer, updateCustomer, updateCustomerStatus };
