const express = require("express");
const { changePassword, login, me } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const rateLimiter = require("../middleware/rateLimiter");
const { changePasswordSchema, loginSchema } = require("../validations/adminSchemas");

const router = express.Router();

router.post("/login", rateLimiter({ action: "admin-login" }), validate(loginSchema), login);
router.get("/me", requireAuth, me);
router.patch("/change-password", requireAuth, validate(changePasswordSchema), changePassword);

module.exports = router;
