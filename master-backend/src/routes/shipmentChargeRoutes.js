const express = require("express");
const controller = require("../controllers/shipmentChargeController");
const validate = require("../middleware/validate");
const { shipmentChargeSchema, idParam } = require("../validations/adminSchemas");

const adminRouter = express.Router();
const publicRouter = express.Router();

adminRouter.get("/", controller.list);
adminRouter.post("/", validate(shipmentChargeSchema), controller.create);
adminRouter.put("/:id", validate(shipmentChargeSchema), controller.update);
adminRouter.delete("/:id", validate(idParam), controller.remove);

publicRouter.get("/", controller.publicList);

module.exports = { adminRouter, publicRouter };
