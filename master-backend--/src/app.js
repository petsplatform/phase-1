const dotenv = require("dotenv");
dotenv.config({ override: true });
require("./config/env");

const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

const corsOptions = require("./config/corsOptions");
const { requireAuth, requireCustomerAuth } = require("./middleware/auth");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const validate = require("./middleware/validate");
const resolveAdminTenant = require("./middleware/resolveAdminTenant");
const resolvePublicTenant = require("./middleware/resolvePublicTenant");
const superAdminReadOnly = require("./middleware/superAdminReadOnly");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const contentRoutes = require("./routes/contentRoutes");
const customerRoutes = require("./routes/customerRoutes");
const customerPanelRoutes = require("./routes/customerPanelRoutes");
const customerPanelController = require("./controllers/customerPanelController");
const inquiryController = require("./controllers/inquiryController");
const dashboardRoutes = require("./routes/dashboardRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const couponRoutes = require("./routes/couponRoutes");
const taxRoutes = require("./routes/taxRoutes");
const publicTaxRoutes = require("./routes/publicTaxRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const bulkImportRoutes = require("./routes/bulkImportRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const vetVerificationRoutes = require("./routes/vetVerificationRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const shipmentChargeRoutes = require("./routes/shipmentChargeRoutes");
const autoOrderRoutes = require("./routes/autoOrderRoutes");
const petgptRoutes = require("./routes/petgptRoutes");
const supportRoutes = require("./routes/supportRoutes");
const aiCallingRoutes = require("./routes/aiCallingRoutes");
const supportController = require("./controllers/supportController");
const autoOrderController = require("./controllers/autoOrderController");
const { inquirySchema } = require("./validations/adminSchemas");
const {
  changeCustomerPasswordSchema,
  idParam,
  setPasswordSchema,
} = require("./validations/customerPanelSchemas");
const {
  autoOrderCreateSchema,
  autoOrderUpdateSchema,
  idParam: autoOrderIdParam,
  paymentSetupIntentSchema,
  savePaymentMethodSchema,
} = require("./validations/autoOrderSchemas");

const app = express();

function tokenQueryToAuthorization(req, res, next) {
  if (!req.headers.authorization) {
    const token =
      req.query?.token ||
      new URL(
        req.originalUrl || req.url || "",
        "http://localhost",
      ).searchParams.get("token");
    if (token) req.headers.authorization = `Bearer ${token}`;
  }
  next();
}

function routeAutoOrdersByToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return requireAuth(req, res, next);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type === "customer") {
      return resolvePublicTenant(req, res, (tenantError) => {
        if (tenantError) return next(tenantError);
        return autoOrderRoutes.customerRouter(req, res, next);
      });
    }
  } catch {
    return requireAuth(req, res, next);
  }

  return requireAuth(req, res, (authError) => {
    if (authError) return next(authError);
    return superAdminReadOnly(req, res, (readOnlyError) => {
      if (readOnlyError) return next(readOnlyError);
      return resolveAdminTenant(req, res, (tenantError) => {
        if (tenantError) return next(tenantError);
        return autoOrderRoutes.adminRouter(req, res, next);
      });
    });
  });
}

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors(corsOptions()));
app.use("/api/webhooks", webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("E-Commerce server is running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Admin panel backend is healthy" });
});

app.get("/api/ai-calling/vobiz/health", (req, res) => {
  res.json({ success: true, message: "AI calling webhook backend is healthy" });
});

app.get(
  "/api/auth/password-status",
  resolvePublicTenant,
  requireCustomerAuth,
  customerPanelController.getPasswordStatus,
);
app.post(
  "/api/auth/set-password",
  resolvePublicTenant,
  requireCustomerAuth,
  validate(setPasswordSchema),
  customerPanelController.setPassword,
);
app.post(
  "/api/auth/change-password",
  resolvePublicTenant,
  requireCustomerAuth,
  validate(changeCustomerPasswordSchema),
  customerPanelController.changePassword,
);
app.use("/api/auth", authRoutes);
app.use("/api/ai-calling/vobiz", resolvePublicTenant, aiCallingRoutes.publicRouter);
app.use("/api/petgpt", resolvePublicTenant, petgptRoutes);
app.use("/api/customer-panel/petgpt", resolvePublicTenant, petgptRoutes);
app.use("/api/customer-panel/taxes", resolvePublicTenant, publicTaxRoutes);
app.get(
  "/api/customer-panel/catalog/products",
  resolvePublicTenant,
  customerPanelController.listProducts,
);
app.get(
  "/api/customer-panel/catalog/products/:productSlug/variants/:variantSlug",
  resolvePublicTenant,
  customerPanelController.getProductVariant,
);
app.get(
  "/api/customer-panel/catalog/products/:id",
  resolvePublicTenant,
  validate(idParam),
  customerPanelController.getProduct,
);
app.get(
  "/api/customer-panel/catalog/categories",
  resolvePublicTenant,
  customerPanelController.listCategories,
);
app.get(
  "/api/customer-panel/coupons",
  resolvePublicTenant,
  customerPanelController.listCoupons,
);
app.post(
  "/api/customer-panel/inquiries",
  resolvePublicTenant,
  validate(inquirySchema),
  inquiryController.create,
);
app.get(
  "/api/customer-panel/auto-orders",
  resolvePublicTenant,
  requireCustomerAuth,
  autoOrderController.listCustomerAutoOrders,
);  
app.post(
  "/api/customer-panel/auto-orders",
  resolvePublicTenant,
  requireCustomerAuth,
  validate(autoOrderCreateSchema),
  autoOrderController.createCustomerAutoOrder,
);
app.get(
  "/api/customer-panel/auto-orders/:id",
  resolvePublicTenant,
  requireCustomerAuth,
  validate(autoOrderIdParam),
  autoOrderController.getCustomerAutoOrder,
);
app.patch(
  "/api/customer-panel/auto-orders/:id",
  resolvePublicTenant,
  requireCustomerAuth,
  validate(autoOrderUpdateSchema),
  autoOrderController.updateCustomerAutoOrder,
);
app.post(
  "/api/customer-panel/auto-orders/:id/pause",
  resolvePublicTenant,
  requireCustomerAuth,
  validate(autoOrderIdParam),
  autoOrderController.pauseCustomerAutoOrder,
);
app.post(
  "/api/customer-panel/auto-orders/:id/resume",
  resolvePublicTenant,
  requireCustomerAuth,
  validate(autoOrderIdParam),
  autoOrderController.resumeCustomerAutoOrder,
);
app.post(
  "/api/customer-panel/auto-orders/:id/cancel",
  resolvePublicTenant,
  requireCustomerAuth,
  validate(autoOrderIdParam),
  autoOrderController.cancelCustomerAutoOrder,
);
app.post(
  "/api/customer-panel/auto-orders/:id/payment-setup-intent",
  resolvePublicTenant,
  requireCustomerAuth,
  validate(paymentSetupIntentSchema),
  autoOrderController.createPaymentSetupIntent,
);
app.post(
  "/api/customer-panel/auto-orders/:id/payment-method",
  resolvePublicTenant,
  requireCustomerAuth,
  validate(savePaymentMethodSchema),
  autoOrderController.savePaymentMethod,
);
app.use(
  "/api/customer-panel/auto-orders",
  resolvePublicTenant,
  autoOrderRoutes.customerRouter,
);
app.use(
  "/api/customer-panel/support",
  resolvePublicTenant,
  supportRoutes.customerRouter,
);
app.use("/api/customer-panel", resolvePublicTenant, customerPanelRoutes);
app.use("/api/customer-panel", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Customer panel route not found",
  });
});
app.use(
  "/api/customer/vet-verification",
  resolvePublicTenant,
  vetVerificationRoutes.customerRouter,
);
app.use(
  "/api/customer/shipment-charges",
  resolvePublicTenant,
  shipmentChargeRoutes.publicRouter,
);
app.use("/api/customer", resolvePublicTenant, shipmentRoutes.customerRouter);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/dashboard", requireAuth, resolveAdminTenant, dashboardRoutes);
app.use(
  "/api/products",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  productRoutes,
);
app.use(
  "/api/categories",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  categoryRoutes,
);
app.use("/api/orders/auto-orders", routeAutoOrdersByToken);
app.use(
  "/api/orders",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  orderRoutes,
);
app.use("/api/auto-orders", routeAutoOrdersByToken);
app.use("/api/content", contentRoutes);
app.get(
  "/api/admin/support/stream",
  tokenQueryToAuthorization,
  requireAuth,
  resolveAdminTenant,
  supportController.adminStream,
);
app.use(
  "/api/admin/support",
  tokenQueryToAuthorization,
  requireAuth,
  resolveAdminTenant,
  supportRoutes.adminRouter,
);
app.use(
  "/api/ai-calling",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  aiCallingRoutes.adminRouter,
);
app.use("/api/settings", settingsRoutes);
app.use(
  "/api",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  shipmentRoutes.adminRouter,
);
app.use(
  "/api/customers",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  customerRoutes,
);
app.use(
  "/api/vet-verifications",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  vetVerificationRoutes.adminRouter,
);
app.use(
  "/api/admin/vet-verifications",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  vetVerificationRoutes.adminRouter,
);
app.use(
  "/api/admin",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  shipmentRoutes.adminRouter,
);
app.use(
  "/api/shipment-charges",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  shipmentChargeRoutes.adminRouter,
);
app.use(
  "/api/coupons",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  couponRoutes,
);
app.use(
  "/api/taxes",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  taxRoutes,
);
app.use("/api/upload", requireAuth, resolveAdminTenant, uploadRoutes);
app.use(
  "/api/bulk-import",
  requireAuth,
  superAdminReadOnly,
  resolveAdminTenant,
  bulkImportRoutes,
);
app.use("/api/audit-logs", auditLogRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
