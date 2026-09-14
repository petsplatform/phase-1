const express = require("express");
const inquiryController = require("../controllers/inquiryController");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const resolveAdminTenant = require("../middleware/resolveAdminTenant");
const resolvePublicTenant = require("../middleware/resolvePublicTenant");
const { inquirySchema, inquiryStatusSchema, idParam } = require("../validations/adminSchemas");

const router = express.Router();

router.post("/", resolvePublicTenant, validate(inquirySchema), inquiryController.create);

router.use(requireAuth, resolveAdminTenant);

router.get("/", inquiryController.list);
router.patch("/:id/status", validate(inquiryStatusSchema), inquiryController.updateStatus);
router.delete("/:id", validate(idParam), inquiryController.remove);

module.exports = router;
