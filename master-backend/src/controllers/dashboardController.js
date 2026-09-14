const dashboardService = require("../services/dashboardService");
const asyncHandler = require("../utils/asyncHandler");

const getSummary = asyncHandler(async (req, res) => {
  const cacheKey = req.store?.id || (req.user?.role === "SUPER_ADMIN" ? "super" : req.user?.userId) || "default";
  const summary = await dashboardService.getSummary(req.tenantDb, req.query, cacheKey);
  res.json({ success: true, data: summary });
});

module.exports = { getSummary };
