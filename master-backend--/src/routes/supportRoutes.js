const express = require("express");
const controller = require("../controllers/supportController");
const { requireAuth, requireCustomerAuth } = require("../middleware/auth");
const rateLimiter = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const {
  adminListSchema,
  assignSchema,
  createConversationSchema,
  idParam,
  internalNoteSchema,
  listCustomerConversationsSchema,
  messageSchema,
  ratingSchema,
  settingsSchema,
  statusSchema,
} = require("../validations/supportSchemas");

function tokenQueryToHeader(req, res, next) {
  if (!req.headers.authorization) {
    const token =
      req.query?.token ||
      new URL(req.originalUrl || req.url || "", "http://localhost").searchParams.get("token");
    if (token) req.headers.authorization = `Bearer ${token}`;
  }
  next();
}

const customerRouter = express.Router();
customerRouter.use(tokenQueryToHeader);
customerRouter.get("/", requireCustomerAuth, validate(listCustomerConversationsSchema), controller.listCustomerConversations);
customerRouter.post("/", requireCustomerAuth, validate(createConversationSchema), controller.createConversation);
customerRouter.get("/:id/stream", requireCustomerAuth, validate(idParam), controller.customerStream);
customerRouter.get("/:id", requireCustomerAuth, validate(idParam), controller.getCustomerConversation);
customerRouter.post(
  "/:id/messages",
  requireCustomerAuth,
  rateLimiter({
    action: "support-message",
    windowMs: 60 * 1000,
    ipLimit: 40,
    accountLimit: 20,
    countSuccessfulRequests: true,
    message: "Please wait a moment before sending more messages.",
  }),
  validate(messageSchema),
  controller.sendCustomerMessage,
);
customerRouter.post("/:id/read", requireCustomerAuth, validate(idParam), controller.markCustomerRead);
customerRouter.post("/:id/resolve", requireCustomerAuth, validate(idParam), controller.resolveCustomerConversation);
customerRouter.post("/:id/reopen", requireCustomerAuth, validate(idParam), controller.reopenCustomerConversation);
customerRouter.post("/:id/rating", requireCustomerAuth, validate(ratingSchema), controller.rateConversation);

const adminRouter = express.Router();
adminRouter.use(tokenQueryToHeader);
adminRouter.get("/", requireAuth, validate(adminListSchema), controller.listAdminConversations);
adminRouter.get("/stream", requireAuth, controller.adminStream);
adminRouter.get("/settings", requireAuth, controller.getSettings);
adminRouter.put("/settings", requireAuth, validate(settingsSchema), controller.updateSettings);
adminRouter.get("/:id", requireAuth, validate(idParam), controller.getAdminConversation);
adminRouter.post("/:id/messages", requireAuth, validate(messageSchema), controller.sendAgentMessage);
adminRouter.post("/:id/read", requireAuth, validate(idParam), controller.markAdminRead);
adminRouter.post("/:id/assign", requireAuth, validate(assignSchema), controller.assignConversation);
adminRouter.post("/:id/status", requireAuth, validate(statusSchema), controller.updateConversationStatus);
adminRouter.post("/:id/internal-note", requireAuth, validate(internalNoteSchema), controller.addInternalNote);

module.exports = { adminRouter, customerRouter };
