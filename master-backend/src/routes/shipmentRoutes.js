const express = require("express");
const controller = require("../controllers/shipmentController");
const validate = require("../middleware/validate");
const { requireCustomerAuth } = require("../middleware/auth");
const {
  bulkShipmentSchema,
  courierSchema,
  idParam,
  shipmentListSchema,
  shipmentSchema,
  shipmentSettingsSchema,
  shipmentStatusSchema,
} = require("../validations/adminSchemas");

const adminRouter = express.Router();
const customerRouter = express.Router();

adminRouter.get("/shipments", validate(shipmentListSchema), controller.listShipments);
adminRouter.post("/shipments/bulk", validate(bulkShipmentSchema), controller.bulkShipments);
adminRouter.get("/orders/:id/shipment", validate(idParam), controller.getShipment);
adminRouter.post("/orders/:id/shipment", validate(shipmentSchema), controller.createShipment);
adminRouter.put("/orders/:id/shipment", validate(shipmentSchema), controller.updateShipment);
adminRouter.put("/orders/:id/shipment/status", validate(shipmentStatusSchema), controller.updateShipmentStatus);
adminRouter.delete("/orders/:id/shipment", validate(idParam), controller.deleteShipment);

adminRouter.get("/couriers", controller.listCouriers);
adminRouter.post("/couriers", validate(courierSchema), controller.createCourier);
adminRouter.put("/couriers/:id", validate(courierSchema), controller.updateCourier);
adminRouter.delete("/couriers/:id", validate(idParam), controller.deleteCourier);
adminRouter.get("/shipment-settings", controller.getSettings);
adminRouter.put("/shipment-settings", validate(shipmentSettingsSchema), controller.updateSettings);

customerRouter.use(requireCustomerAuth);
customerRouter.get("/orders/:id/shipment", validate(idParam), controller.customerShipment);
customerRouter.get("/orders/:id/tracking", validate(idParam), controller.customerTracking);

module.exports = { adminRouter, customerRouter };
