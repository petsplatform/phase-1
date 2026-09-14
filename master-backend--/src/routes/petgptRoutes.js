const express = require("express");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const { getCurrentStore } = require("../config/tenantContext");
const petgptController = require("../controllers/petgptController");
const rateLimiter = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const { chatSchema } = require("../validations/petgptSchemas");

const router = express.Router();

async function optionalCustomerAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "customer") return next();

    const currentStore = getCurrentStore();
    if (currentStore && payload.storeId && payload.storeId !== currentStore.id) {
      return next();
    }

    const customer = await prisma.customer.findUnique({ where: { id: payload.id } });
    if (customer?.status === "Active") {
      req.customer = customer;
    }
    return next();
  } catch {
    return next();
  }
}

router.post(
  "/chat",
  optionalCustomerAuth,
  rateLimiter({
    action: "petgpt-chat",
    windowMs: 60 * 1000,
    ipLimit: 20,
    accountLimit: 20,
    countSuccessfulRequests: true,
    message: "PetGPT is receiving too many messages. Please wait a moment.",
  }),
  validate(chatSchema),
  petgptController.chat,
);

module.exports = router;
