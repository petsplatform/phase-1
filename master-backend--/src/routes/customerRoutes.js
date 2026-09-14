const express = require("express");
const controller = require("../controllers/customerController");
const validate = require("../middleware/validate");
const { idParam } = require("../validations/adminSchemas");

const router = express.Router();

router.get("/", controller.listCustomers);
router.post("/", controller.createCustomer);
router.get("/:id", validate(idParam), controller.getCustomer);
router.put("/:id", validate(idParam), controller.updateCustomer);
router.patch("/:id/status", validate(idParam), controller.updateCustomerStatus);
router.patch("/:id/block", validate(idParam), controller.blockCustomer);
router.patch("/:id/unblock", validate(idParam), controller.unblockCustomer);
router.delete("/:id", validate(idParam), controller.deleteCustomer);

module.exports = router;
