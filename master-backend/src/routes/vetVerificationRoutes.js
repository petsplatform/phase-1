const express = require("express");
const controller = require("../controllers/vetVerificationController");
const validate = require("../middleware/validate");
const { createCloudinaryUpload } = require("../config/cloudinary");
const { requireCustomerAuth } = require("../middleware/auth");
const { idParam, rejectVetVerificationSchema, vetVerificationListSchema } = require("../validations/adminSchemas");
const { vetVerificationSchema } = require("../validations/customerPanelSchemas");

const customerRouter = express.Router();
const adminRouter = express.Router();

const licenseUpload = createCloudinaryUpload({
  folder: "e-commerce/vet-licenses",
  allowedFormats: ["jpg", "jpeg", "png", "pdf"],
  allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
  maxFileSize: 10 * 1024 * 1024,
});

customerRouter.use(requireCustomerAuth);
customerRouter.post("/", licenseUpload.single("document"), validate(vetVerificationSchema), controller.submitMine);
customerRouter.get("/", controller.getMine);
customerRouter.put("/reapply", licenseUpload.single("document"), validate(vetVerificationSchema), controller.reapplyMine);

adminRouter.get("/", validate(vetVerificationListSchema), controller.list);
adminRouter.get("/:id", validate(idParam), controller.getById);
adminRouter.put("/:id/approve", validate(idParam), controller.approve);
adminRouter.put("/:id/reject", validate(rejectVetVerificationSchema), controller.reject);

module.exports = { adminRouter, customerRouter };
