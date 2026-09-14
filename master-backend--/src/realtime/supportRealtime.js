const conversations = new Map();
const admins = new Set();
const onlineAgents = new Map();

function writeEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data || {})}\n\n`);
}

function registerClient(collection, key, res) {
  if (!collection.has(key)) collection.set(key, new Set());
  collection.get(key).add(res);
  res.on("close", () => {
    collection.get(key)?.delete(res);
    if (collection.get(key)?.size === 0) collection.delete(key);
  });
}

function addConversationClient(conversationId, res) {
  registerClient(conversations, conversationId, res);
}

function addAdminClient(res, agentId) {
  admins.add(res);
  if (agentId) onlineAgents.set(agentId, { agentId, onlineAt: new Date().toISOString() });
  res.on("close", () => {
    admins.delete(res);
    if (agentId) onlineAgents.delete(agentId);
  });
}

function emitToConversation(conversationId, event, data) {
  for (const res of conversations.get(conversationId) || []) {
    writeEvent(res, event, data);
  }
}

function emitToAdmins(event, data) {
  for (const res of admins) {
    writeEvent(res, event, data);
  }
}

function emitSupportEvent(conversationId, event, data) {
  emitToConversation(conversationId, event, data);
  emitToAdmins(event, data);
}

function getOnlineAgentIds() {
  return Array.from(onlineAgents.keys());
}

function initStream(res) {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  writeEvent(res, "support:connected", { connectedAt: new Date().toISOString() });
  const timer = setInterval(() => writeEvent(res, "support:ping", { at: Date.now() }), 25000);
  res.on("close", () => clearInterval(timer));
}

module.exports = {
  addAdminClient,
  addConversationClient,
  emitSupportEvent,
  emitToAdmins,
  getOnlineAgentIds,
  initStream,
};
