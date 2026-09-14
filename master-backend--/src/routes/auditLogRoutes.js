const express = require("express");
const { requireAuth } = require("../middleware/auth");
const resolveAdminTenant = require("../middleware/resolveAdminTenant");
const { list } = require("../controllers/auditLogController");

const router = express.Router();

// GET /api/audit-logs?action=&module=&from=&to=&page=&limit=
router.get("/", requireAuth, resolveAdminTenant, list);

module.exports = router;
