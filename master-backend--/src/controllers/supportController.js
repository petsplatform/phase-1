const supportService = require("../services/supportService");
const realtime = require("../realtime/supportRealtime");
const asyncHandler = require("../utils/asyncHandler");

const createConversation = asyncHandler(async (req, res) => {
  const conversation = await supportService.createOrGetCustomerConversation(req.customer, req.validated.body);
  res.status(201).json({ success: true, data: conversation });
});

const listCustomerConversations = asyncHandler(async (req, res) => {
  const conversations = await supportService.listCustomerConversations(req.customer.id, req.validated.query || {});
  res.json({ success: true, data: conversations });
});

const getCustomerConversation = asyncHandler(async (req, res) => {
  const conversation = await supportService.getCustomerConversation(req.params.id, req.customer.id);
  res.json({ success: true, data: conversation });
});

const sendCustomerMessage = asyncHandler(async (req, res) => {
  const message = await supportService.sendCustomerMessage(req.params.id, req.customer, req.validated.body);
  res.status(201).json({ success: true, data: message });
});

const markCustomerRead = asyncHandler(async (req, res) => {
  const data = await supportService.markCustomerRead(req.params.id, req.customer.id);
  res.json({ success: true, data });
});

const resolveCustomerConversation = asyncHandler(async (req, res) => {
  const conversation = await supportService.resolveCustomerConversation(req.params.id, req.customer.id);
  res.json({ success: true, data: conversation });
});

const reopenCustomerConversation = asyncHandler(async (req, res) => {
  const conversation = await supportService.reopenCustomerConversation(req.params.id, req.customer.id);
  res.json({ success: true, data: conversation });
});

const rateConversation = asyncHandler(async (req, res) => {
  const rating = await supportService.rateConversation(req.params.id, req.customer.id, req.validated.body);
  res.status(201).json({ success: true, data: rating });
});

const customerStream = asyncHandler(async (req, res) => {
  const conversation = await supportService.getCustomerConversation(req.params.id, req.customer.id);
  realtime.initStream(res);
  realtime.addConversationClient(conversation.id, res);
});

const listAdminConversations = asyncHandler(async (req, res) => {
  const data = await supportService.listAdminConversations(req.validated.query || {});
  res.json({ success: true, data });
});

const getAdminConversation = asyncHandler(async (req, res) => {
  const conversation = await supportService.getAdminConversation(req.params.id);
  res.json({ success: true, data: conversation });
});

const sendAgentMessage = asyncHandler(async (req, res) => {
  const message = await supportService.sendAgentMessage(req.params.id, req.user, req.validated.body);
  res.status(201).json({ success: true, data: message });
});

const addInternalNote = asyncHandler(async (req, res) => {
  const message = await supportService.addInternalNote(req.params.id, req.user, req.validated.body.note);
  res.status(201).json({ success: true, data: message });
});

const assignConversation = asyncHandler(async (req, res) => {
  const conversation = await supportService.assignConversation(req.params.id, req.validated.body.assignedAgentId || null);
  res.json({ success: true, data: conversation });
});

const updateConversationStatus = asyncHandler(async (req, res) => {
  const conversation = await supportService.updateConversationStatus(req.params.id, req.validated.body);
  res.json({ success: true, data: conversation });
});

const markAdminRead = asyncHandler(async (req, res) => {
  const data = await supportService.markAdminRead(req.params.id);
  res.json({ success: true, data });
});

const adminStream = asyncHandler(async (req, res) => {
  realtime.initStream(res);
  realtime.addAdminClient(res, req.user?.userId || req.user?.id);
});

const getSettings = asyncHandler(async (req, res) => {
  const settings = await supportService.getSettings();
  res.json({ success: true, data: settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await supportService.updateSettings(req.validated.body);
  res.json({ success: true, data: settings });
});

module.exports = {
  addInternalNote,
  adminStream,
  assignConversation,
  createConversation,
  customerStream,
  getAdminConversation,
  getCustomerConversation,
  getSettings,
  listAdminConversations,
  listCustomerConversations,
  markAdminRead,
  markCustomerRead,
  rateConversation,
  reopenCustomerConversation,
  resolveCustomerConversation,
  sendAgentMessage,
  sendCustomerMessage,
  updateConversationStatus,
  updateSettings,
};
