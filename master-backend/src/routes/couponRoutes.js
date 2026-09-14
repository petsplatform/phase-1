const express = require("express");
const { list, get, create, update, remove } = require("../controllers/couponController");
const validate = require("../middleware/validate");
const { couponSchema, idParam } = require("../validations/adminSchemas");

const router = express.Router();

router.get("/", list);
router.post("/", validate(couponSchema), create);
router.get("/:id", validate(idParam), get);
router.put("/:id", validate(couponSchema), update);
router.delete("/:id", validate(idParam), remove);

module.exports = router;
