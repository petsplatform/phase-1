const express = require("express");
const controller = require("../controllers/productController");
const validate = require("../middleware/validate");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");
const { idParam, productSchema } = require("../validations/adminSchemas");

const router = express.Router();

router.get("/", controller.listProducts);
router.post("/", ...uploadSingleImage("image"), validate(productSchema), controller.createProduct);
router.get("/:id", validate(idParam), controller.getProduct);
router.put("/:id", ...uploadSingleImage("image"), validate(productSchema), controller.updateProduct);
router.patch("/:id", validate(idParam), controller.patchProduct);
router.delete("/:id", validate(idParam), controller.deleteProduct);

module.exports = router;
