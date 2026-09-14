const aiCallingService = require("../services/aiCallingService");
const { providerStatus } = require("../services/aiCallingConfigService");
const vobizService = require("../services/vobizService");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

function requireWebhookAccess(req) {
  const expected = String(process.env.VOBIZ_WEBHOOK_TOKEN || "").trim();
  if (!expected) return;
  const supplied = String(req.query.token || req.headers["x-ai-calling-token"] || "").trim();
  if (supplied !== expected) throw new ApiError(403, "Invalid Vobiz webhook token");
}

const dashboard = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await aiCallingService.getDashboard(req.tenantDb) });
});

const config = asyncHandler(async (req, res) => {
  res.json({ success: true, data: providerStatus() });
});

const listAgents = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await aiCallingService.listAgents(req.tenantDb) });
});

const createAgent = asyncHandler(async (req, res) => {
  const agent = await aiCallingService.createAgent(req.body, req.user, req.tenantDb);
  res.status(201).json({ success: true, data: agent });
});

const updateAgent = asyncHandler(async (req, res) => {
  const agent = await aiCallingService.updateAgent(req.params.id, req.body, req.tenantDb);
  res.json({ success: true, data: agent });
});

const deleteAgent = asyncHandler(async (req, res) => {
  const agent = await aiCallingService.deleteAgent(req.params.id, req.tenantDb);
  res.json({ success: true, data: agent });
});

const listCalls = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await aiCallingService.listCalls(req.query, req.tenantDb) });
});

const getCall = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await aiCallingService.getCall(req.params.id, req.tenantDb) });
});

const createTestCall = asyncHandler(async (req, res) => {
  const call = await aiCallingService.createTestCall(req.body, req.user, req.tenantDb);
  res.status(201).json({ success: true, data: call });
});

const runAction = asyncHandler(async (req, res) => {
  const action = await aiCallingService.runAction(req.params.id, req.body.type, req.body.payload, req.user, req.tenantDb);
  res.json({ success: true, data: action });
});

const quickStart = asyncHandler(async (req, res) => {
  const result = await aiCallingService.quickStartCalling(req.body, req.user, req.tenantDb);
  res.status(201).json({ success: true, data: result });
});

const vobizAnswer = asyncHandler(async (req, res) => {
  requireWebhookAccess(req);
  const callId = req.query.callId || req.body.callId || req.body.CallUUID;
  if (!callId) throw new ApiError(400, "callId is required");
  const call = await aiCallingService.getCall(callId, req.tenantDb).catch(() => null);
  res.type("application/xml").send(vobizService.buildAnswerXml({
    callId,
    openingMessage: call?.agent?.openingMessage,
  }));
});

const vobizHangup = asyncHandler(async (req, res) => {
  requireWebhookAccess(req);
  const callId = req.query.callId || req.body.callId;
  if (!callId) throw new ApiError(400, "callId is required");
  const call = await aiCallingService.handleVobizHangup(callId, req.body || req.query, req.tenantDb);
  res.json({ success: true, data: call });
});

const vobizStreamStatus = asyncHandler(async (req, res) => {
  requireWebhookAccess(req);
  const callId = req.query.callId || req.body.callId || req.body.CallUUID;
  if (!callId) throw new ApiError(400, "callId is required");
  const result = await aiCallingService.handleVobizStreamStatus(callId, { ...(req.query || {}), ...(req.body || {}) }, req.tenantDb);
  res.json({ success: true, data: result });
});

module.exports = {
  config,
  createAgent,
  createTestCall,
  deleteAgent,
  dashboard,
  getCall,
  listAgents,
  listCalls,
  quickStart,
  runAction,
  updateAgent,
  vobizAnswer,
  vobizHangup,
  vobizStreamStatus,
};
