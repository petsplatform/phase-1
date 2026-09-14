const express = require("express");
const controller = require("../controllers/orderController");
const validate = require("../middleware/validate");
const { idParam, orderStatusSchema } = require("../validations/adminSchemas");

const router = express.Router();

router.get("/", controller.listOrders);
router.get("/:id/invoice", validate(idParam), controller.getInvoice);
router.get("/:id/shipment-label", validate(idParam), controller.getShipmentLabel);
router.get("/:id", validate(idParam), controller.getOrder);
router.patch("/:id/status", validate(orderStatusSchema), controller.updateOrderStatus);
router.delete("/:id", validate(idParam), controller.deleteOrder);

module.exports = router;
