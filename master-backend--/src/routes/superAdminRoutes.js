const express = require("express");
const controller = require("../controllers/superAdminController");
const { requireAuth } = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const validate = require("../middleware/validate");
const { createStoreSchema, provisionStoreSchema } = require("../validations/superAdminSchemas");
const ApiError = require("../utils/apiError");

const router = express.Router();

router.use(requireAuth, authorizeRole("SUPER_ADMIN"));
router.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next(new ApiError(403, "Super admin has view-only access"));
  }
  return next();
});

router.get("/overview", controller.overview);
router.get("/orders", controller.listOrders);
router.get("/orders/:id/shipment-label", controller.getShipmentLabel);
router.get("/products", controller.listProducts);
router.get("/customers", controller.listCustomers);
router.get("/categories", controller.listCategories);
router.get("/vet-verifications", controller.listVetVerifications);
router.get("/vet-verifications/:id", controller.getVetVerification);
router.post("/stores", validate(createStoreSchema), controller.createStore);
router.get("/stores", controller.listStores);
router.get("/stores/:storeId", controller.getStore);
router.patch("/stores/:storeId", controller.updateStore);
router.post("/stores/:storeId/domains", controller.addDomain);
router.delete("/stores/:storeId/domains/:domainId", controller.removeDomain);
router.post("/stores/:storeId/provision", validate(provisionStoreSchema), controller.provisionStore);
router.post("/stores/:storeId/migrate", controller.migrateStore);
router.post("/stores/:storeId/seed", controller.seedStore);
router.post("/stores/:storeId/users", controller.assignUser);
router.patch("/stores/:storeId/status", controller.updateStatus);
router.get("/stores/:storeId/health", controller.health);

module.exports = router;
