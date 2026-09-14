const express = require("express");
const { clearSmtpSettings, getSettings, runAbandonedCartEmails, updateSettings, sendTestEmail } = require("../controllers/settingsController");
const validate = require("../middleware/validate");
const { settingsSchema } = require("../validations/adminSchemas");
const { requireAuth } = require("../middleware/auth");
const resolveAdminTenant = require("../middleware/resolveAdminTenant");
const resolveAdminOrPublicTenant = require("../middleware/resolveAdminOrPublicTenant");
const superAdminReadOnly = require("../middleware/superAdminReadOnly");

const router = express.Router();

router.get("/", resolveAdminOrPublicTenant, getSettings);
router.put("/", requireAuth, superAdminReadOnly, resolveAdminTenant, validate(settingsSchema), updateSettings);
router.delete("/smtp", requireAuth, superAdminReadOnly, resolveAdminTenant, clearSmtpSettings);
router.post("/test-email", requireAuth, superAdminReadOnly, resolveAdminTenant, sendTestEmail);
router.post("/abandoned-cart/run", requireAuth, superAdminReadOnly, resolveAdminTenant, runAbandonedCartEmails);

module.exports = router;
