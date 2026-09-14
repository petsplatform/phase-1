const express = require("express");
const controller = require("../controllers/autoOrderController");
const { requireCustomerAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  adminAutoOrderUpdateSchema,
  autoOrderCreateSchema,
  autoOrderUpdateSchema,
  idParam,
  paymentSetupIntentSchema,
  savePaymentMethodSchema,
} = require("../validations/autoOrderSchemas");

const customerRouter = express.Router();
customerRouter.use(requireCustomerAuth);
customerRouter.get("/", controller.listCustomerAutoOrders);
customerRouter.post("/", validate(autoOrderCreateSchema), controller.createCustomerAutoOrder);
customerRouter.get("/:id", validate(idParam), controller.getCustomerAutoOrder);
customerRouter.patch("/:id", validate(autoOrderUpdateSchema), controller.updateCustomerAutoOrder);
customerRouter.post("/:id/pause", validate(idParam), controller.pauseCustomerAutoOrder);
customerRouter.post("/:id/resume", validate(idParam), controller.resumeCustomerAutoOrder);
customerRouter.post("/:id/cancel", validate(idParam), controller.cancelCustomerAutoOrder);
customerRouter.post(
  "/:id/payment-setup-intent",
  validate(paymentSetupIntentSchema),
  controller.createPaymentSetupIntent,
);
customerRouter.post(
  "/:id/payment-method",
  validate(savePaymentMethodSchema),
  controller.savePaymentMethod,
);

const adminRouter = express.Router();
adminRouter.get("/metrics", controller.getAdminMetrics);
adminRouter.post("/run-due", controller.runDueAutoOrders);
adminRouter.get("/", controller.listAdminAutoOrders);
adminRouter.get("/:id", validate(idParam), controller.getAdminAutoOrder);
adminRouter.patch("/:id", validate(adminAutoOrderUpdateSchema), controller.updateAdminAutoOrder);
adminRouter.post("/:id/pause", validate(idParam), (req, res, next) => {
  req.validated.body = { status: "PAUSED" };
  return controller.updateAdminAutoOrder(req, res, next);
});
adminRouter.post("/:id/resume", validate(idParam), (req, res, next) => {
  req.validated.body = { status: "ACTIVE", failureReason: null };
  return controller.updateAdminAutoOrder(req, res, next);
});
adminRouter.post("/:id/cancel", validate(idParam), (req, res, next) => {
  req.validated.body = { status: "CANCELLED" };
  return controller.updateAdminAutoOrder(req, res, next);
});

module.exports = { adminRouter, customerRouter };
