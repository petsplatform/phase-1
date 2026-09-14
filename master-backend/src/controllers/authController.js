const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");
const { writeAuditLog } = require("../services/auditLogService");

const login = asyncHandler(async (req, res) => {
  const data = await authService.loginAdmin(req.validated.body);
  writeAuditLog({
    actorId: data?.admin?.id || null,
    action: "login",
    module: "Auth",
    description: `Admin login: ${req.validated.body.email}`,
    ipAddress: req.ip,
  });
  res.json({ success: true, data });
});

const me = asyncHandler(async (req, res) => {
  const data = await authService.getCurrentAdmin(req.user);
  res.json({ success: true, data });
});

const changePassword = asyncHandler(async (req, res) => {
  const data = await authService.changePassword(req.user, req.validated.body);
  writeAuditLog({
    actorId: req.user?.userId || req.user?.id,
    action: "update",
    module: "Auth",
    description: "Admin changed password",
    ipAddress: req.ip,
  });
  res.json({ success: true, data });
});

module.exports = { changePassword, login, me };
