const express = require("express");
const { list, get, create, update, remove } = require("../controllers/taxController");
const validate = require("../middleware/validate");
const { idParam, taxSchema } = require("../validations/adminSchemas");

const router = express.Router();

router.get("/", list);
router.post("/", validate(taxSchema), create);
router.get("/:id", validate(idParam), get);
router.put("/:id", validate(taxSchema), update);
router.delete("/:id", validate(idParam), remove);

module.exports = router;
