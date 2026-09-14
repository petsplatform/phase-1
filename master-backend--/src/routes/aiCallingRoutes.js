const express = require("express");
const controller = require("../controllers/aiCallingController");

const adminRouter = express.Router();
const publicRouter = express.Router();

adminRouter.get("/dashboard", controller.dashboard);
adminRouter.get("/config", controller.config);
adminRouter.get("/agents", controller.listAgents);
adminRouter.post("/agents", controller.createAgent);
adminRouter.put("/agents/:id", controller.updateAgent);
adminRouter.delete("/agents/:id", controller.deleteAgent);
adminRouter.get("/calls", controller.listCalls);
adminRouter.get("/calls/:id", controller.getCall);
adminRouter.post("/calls/:id/actions", controller.runAction);
adminRouter.post("/test-call", controller.createTestCall);
adminRouter.post("/quick-start", controller.quickStart);

publicRouter.post("/answer", controller.vobizAnswer);
publicRouter.get("/answer", controller.vobizAnswer);
publicRouter.post("/hangup", controller.vobizHangup);
publicRouter.get("/hangup", controller.vobizHangup);
publicRouter.post("/stream-status", controller.vobizStreamStatus);
publicRouter.get("/stream-status", controller.vobizStreamStatus);

module.exports = { adminRouter, publicRouter };
