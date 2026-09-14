const asyncHandler = require("../utils/asyncHandler");
const { getAuditLogs } = require("../services/auditLogService");

const list = asyncHandler(async (req, res) => {
  const { action, module, from, to, page, limit, storeKey } = req.query;
  const isSuperAdmin = req.user?.role === "SUPER_ADMIN";
  const storeId = isSuperAdmin ? null : (req.store?.id || null);
  const data = await getAuditLogs({ action, module, from, to, page, limit, storeId, storeKey: isSuperAdmin ? storeKey : null });
  res.json({ success: true, data });
});

module.exports = { list };
