const express = require("express");
const controller = require("../controllers/webhookController");

const router = express.Router();

router.post("/stripe", express.raw({ type: "application/json" }), controller.handleStripeWebhook);

module.exports = router;
