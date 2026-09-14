const express = require("express");
const controller = require("../controllers/categoryController");
const validate = require("../middleware/validate");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");
const { categorySchema, idParam } = require("../validations/adminSchemas");

const router = express.Router();

router.get("/", controller.listCategories);
router.post("/", ...uploadSingleImage("image"), validate(categorySchema), controller.createCategory);
router.get("/:id", validate(idParam), controller.getCategory);
router.put("/:id", ...uploadSingleImage("image"), validate(categorySchema), controller.updateCategory);
router.delete("/:id", validate(idParam), controller.deleteCategory);

module.exports = router;
