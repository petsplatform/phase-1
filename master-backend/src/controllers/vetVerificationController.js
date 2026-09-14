const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const vetVerificationService = require("../services/vetVerificationService");
const { writeAuditLog } = require("../services/auditLogService");

const submitMine = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Veterinary license document is required");
  const data = await vetVerificationService.submit(
    req.customer,
    { ...req.validated.body, documentUrl: req.file.path },
    { store: req.store, ip: req.ip },
    req.tenantDb,
  );
  writeAuditLog({
    actorId: req.customer.id,
    storeId: req.store?.id,
    action: "create",
    module: "Vet Verification",
    description: "Application Submitted",
    ipAddress: req.ip,
    metadata: {
      entityType: "Vet Verification",
      entityId: data.id,
      entityName: data.fullName,
      entityEmail: data.email,
      applicationId: data.id,
      customerId: req.customer.id,
      licenseNumber: data.licenseNumber,
    },
  });
  res.status(201).json({ success: true, data });
});

const getMine = asyncHandler(async (req, res) => {
  const data = await vetVerificationService.getMine(req.customer, req.tenantDb);
  res.json({ success: true, data });
});

const reapplyMine = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Veterinary license document is required");
  const data = await vetVerificationService.submit(
    req.customer,
    { ...req.validated.body, documentUrl: req.file.path },
    { store: req.store, ip: req.ip },
    req.tenantDb,
  );
  writeAuditLog({
    actorId: req.customer.id,
    storeId: req.store?.id,
    action: "update",
    module: "Vet Verification",
    description: "Application Re-submitted",
    ipAddress: req.ip,
    metadata: {
      entityType: "Vet Verification",
      entityId: data.id,
      entityName: data.fullName,
      entityEmail: data.email,
      applicationId: data.id,
      customerId: req.customer.id,
      licenseNumber: data.licenseNumber,
      reapply: true,
    },
  });
  res.json({ success: true, data });
});

const list = asyncHandler(async (req, res) => {
  const data = await vetVerificationService.list(req.validated?.query || req.query, req.tenantDb);
  res.json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await vetVerificationService.getById(req.params.id, req.tenantDb);
  res.json({ success: true, data });
});

const approve = asyncHandler(async (req, res) => {
  const data = await vetVerificationService.approve(req.params.id, req.user, { store: req.store, ip: req.ip }, req.tenantDb);
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "update",
    module: "Vet Verification",
    description: "Application Approved",
    ipAddress: req.ip,
    metadata: {
      entityType: "Vet Verification",
      entityId: data.id,
      entityName: data.fullName,
      entityEmail: data.email,
      applicationId: data.id,
      customerId: data.userId,
      adminId: req.user?.userId || req.user?.id,
      licenseNumber: data.licenseNumber,
    },
  });
  res.json({ success: true, data });
});

const reject = asyncHandler(async (req, res) => {
  const data = await vetVerificationService.reject(req.params.id, req.validated.body.remarks, req.user, { store: req.store, ip: req.ip }, req.tenantDb);
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    storeId: req.store?.id,
    action: "update",
    module: "Vet Verification",
    description: "Application Rejected",
    ipAddress: req.ip,
    metadata: {
      entityType: "Vet Verification",
      entityId: data.id,
      entityName: data.fullName,
      entityEmail: data.email,
      applicationId: data.id,
      customerId: data.userId,
      adminId: req.user?.userId || req.user?.id,
      licenseNumber: data.licenseNumber,
      remarks: req.validated.body.remarks,
    },
  });
  res.json({ success: true, data });
});

module.exports = { approve, getById, getMine, list, reapplyMine, reject, submitMine };
