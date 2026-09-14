const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");
const realtime = require("../realtime/supportRealtime");

const ACTIVE_STATUSES = ["OPEN", "WAITING_FOR_AGENT", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_CUSTOMER"];
const CUSTOMER_MESSAGE_TYPES = ["TEXT", "IMAGE", "FILE", "ORDER_REFERENCE", "PRODUCT_REFERENCE", "SYSTEM"];

const conversationInclude = {
  customer: { select: { id: true, name: true, email: true, phone: true, isVetVerified: true } },
  order: { select: { id: true, orderStatus: true, paymentStatus: true, total: true, trackingNumber: true, shipmentStatus: true } },
  product: { select: { id: true, name: true, sku: true, image: true } },
  rating: true,
};

function sanitizeMessageText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function visibleMessagesWhere(customerView) {
  return customerView ? { messageType: { in: CUSTOMER_MESSAGE_TYPES } } : {};
}

function normalizeConversation(conversation, customerView = false) {
  if (!conversation) return conversation;
  const messages = Array.isArray(conversation.messages)
    ? conversation.messages.filter((message) => !customerView || message.messageType !== "INTERNAL_NOTE")
    : undefined;
  return { ...conversation, ...(messages ? { messages } : {}) };
}

async function getSettings(db = prisma) {
  return db.supportSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

async function ensureCustomerConversation(id, customerId, options = {}) {
  const conversation = await prisma.supportConversation.findFirst({
    where: { id, customerId },
    include: {
      ...conversationInclude,
      messages: {
        where: visibleMessagesWhere(true),
        orderBy: { createdAt: "asc" },
        take: options.take || 50,
      },
    },
  });
  if (!conversation) throw new ApiError(404, "Support conversation not found");
  return normalizeConversation(conversation, true);
}

async function ensureAdminConversation(id, options = {}) {
  const conversation = await prisma.supportConversation.findUnique({
    where: { id },
    include: {
      ...conversationInclude,
      messages: {
        orderBy: { createdAt: "asc" },
        take: options.take || 75,
      },
    },
  });
  if (!conversation) throw new ApiError(404, "Support conversation not found");
  return conversation;
}

async function validateContext({ customerId, orderId, productId }) {
  const data = {};
  if (orderId) {
    const order = await prisma.order.findFirst({ where: { id: orderId, customerId } });
    if (!order) throw new ApiError(403, "You cannot attach this order to support");
    data.orderId = order.id;
  }
  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new ApiError(404, "Product not found");
    data.productId = product.id;
  }
  return data;
}

async function createOrGetCustomerConversation(customer, payload = {}) {
  const settings = await getSettings();
  if (!settings.enabled) throw new ApiError(403, "Live chat is currently disabled");

  const context = await validateContext({
    customerId: customer.id,
    orderId: payload.orderId || null,
    productId: payload.productId || null,
  });

  const active = await prisma.supportConversation.findFirst({
    where: {
      customerId: customer.id,
      status: { in: ACTIVE_STATUSES },
      ...(context.orderId ? { orderId: context.orderId } : {}),
      ...(context.productId ? { productId: context.productId } : {}),
    },
    include: {
      ...conversationInclude,
      messages: { where: visibleMessagesWhere(true), orderBy: { createdAt: "asc" }, take: 50 },
    },
    orderBy: { lastMessageAt: "desc" },
  });
  if (active) return normalizeConversation(active, true);

  const conversation = await prisma.$transaction(async (tx) => {
    const created = await tx.supportConversation.create({
      data: {
        id: generateId("support"),
        customerId: customer.id,
        status: "WAITING_FOR_AGENT",
        priority: payload.priority || "NORMAL",
        subject: payload.subject || null,
        source: payload.source || "WEBSITE",
        metadata: payload.metadata || null,
        ...context,
      },
    });
    await tx.supportMessage.create({
      data: {
        conversationId: created.id,
        senderType: "SYSTEM",
        messageType: "SYSTEM",
        message: "Thanks for contacting our support team. An agent will be with you shortly.",
      },
    });
    if (payload.initialMessage) {
      await tx.supportMessage.create({
        data: {
          conversationId: created.id,
          senderId: customer.id,
          senderType: "CUSTOMER",
          messageType: "TEXT",
          message: sanitizeMessageText(payload.initialMessage),
        },
      });
      await tx.supportConversation.update({
        where: { id: created.id },
        data: { agentUnread: { increment: 1 }, lastMessageAt: new Date() },
      });
    }
    return tx.supportConversation.findUnique({
      where: { id: created.id },
      include: {
        ...conversationInclude,
        messages: { where: visibleMessagesWhere(true), orderBy: { createdAt: "asc" }, take: 50 },
      },
    });
  });

  realtime.emitToAdmins("support:conversation_created", { conversation: normalizeConversation(conversation, true) });
  return normalizeConversation(conversation, true);
}

async function listCustomerConversations(customerId, query = {}) {
  const where = {
    customerId,
    ...(query.status ? { status: query.status } : {}),
  };
  return prisma.supportConversation.findMany({
    where,
    include: { ...conversationInclude, messages: { where: visibleMessagesWhere(true), orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { lastMessageAt: "desc" },
    take: query.limit || 30,
  });
}

async function getCustomerConversation(id, customerId) {
  return ensureCustomerConversation(id, customerId);
}

async function sendCustomerMessage(id, customer, payload) {
  const conversation = await ensureCustomerConversation(id, customer.id, { take: 1 });
  const messageText = sanitizeMessageText(payload.message);
  if (!messageText) throw new ApiError(400, "Message is required");

  const result = await prisma.$transaction(async (tx) => {
    if (payload.clientMessageId) {
      const existing = await tx.supportMessage.findUnique({
        where: { conversationId_clientMessageId: { conversationId: id, clientMessageId: payload.clientMessageId } },
      });
      if (existing) return existing;
    }
    if (["RESOLVED", "CLOSED"].includes(conversation.status)) {
      await tx.supportConversation.update({
        where: { id },
        data: { status: "OPEN", resolvedAt: null, closedAt: null },
      });
    }
    const message = await tx.supportMessage.create({
      data: {
        conversationId: id,
        senderId: customer.id,
        senderType: "CUSTOMER",
        messageType: payload.messageType || "TEXT",
        message: messageText,
        metadata: payload.metadata || null,
        clientMessageId: payload.clientMessageId || null,
      },
    });
    await tx.supportConversation.update({
      where: { id },
      data: {
        status: conversation.status === "WAITING_FOR_CUSTOMER" ? "OPEN" : undefined,
        agentUnread: { increment: 1 },
        lastMessageAt: message.createdAt,
      },
    });
    return message;
  });

  realtime.emitSupportEvent(id, "support:message_new", { conversationId: id, message: result });
  return result;
}

async function markCustomerRead(id, customerId) {
  await ensureCustomerConversation(id, customerId, { take: 1 });
  await prisma.supportConversation.update({ where: { id }, data: { customerUnread: 0 } });
  await prisma.supportMessage.updateMany({
    where: { conversationId: id, senderType: { in: ["AGENT", "SYSTEM"] }, readAt: null },
    data: { readAt: new Date() },
  });
  realtime.emitSupportEvent(id, "support:message_read", { conversationId: id, reader: "CUSTOMER" });
  return { ok: true };
}

async function resolveCustomerConversation(id, customerId) {
  await ensureCustomerConversation(id, customerId, { take: 1 });
  const conversation = await prisma.supportConversation.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
    include: conversationInclude,
  });
  realtime.emitSupportEvent(id, "support:conversation_status", { conversationId: id, status: "RESOLVED" });
  return conversation;
}

async function reopenCustomerConversation(id, customerId) {
  await ensureCustomerConversation(id, customerId, { take: 1 });
  const conversation = await prisma.supportConversation.update({
    where: { id },
    data: { status: "OPEN", resolvedAt: null, closedAt: null, lastMessageAt: new Date() },
    include: conversationInclude,
  });
  realtime.emitSupportEvent(id, "support:conversation_status", { conversationId: id, status: "OPEN" });
  return conversation;
}

async function rateConversation(id, customerId, payload) {
  const conversation = await ensureCustomerConversation(id, customerId, { take: 1 });
  if (!["RESOLVED", "CLOSED"].includes(conversation.status)) {
    throw new ApiError(400, "You can rate support after the conversation is resolved");
  }
  return prisma.supportRating.upsert({
    where: { conversationId: id },
    update: { rating: payload.rating, feedback: payload.feedback || null },
    create: { conversationId: id, customerId, rating: payload.rating, feedback: payload.feedback || null },
  });
}

function buildAdminWhere(query = {}) {
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.assignedAgentId ? { assignedAgentId: query.assignedAgentId } : {}),
  };
  if (query.q) {
    where.OR = [
      { id: { contains: query.q, mode: "insensitive" } },
      { subject: { contains: query.q, mode: "insensitive" } },
      { orderId: { contains: query.q, mode: "insensitive" } },
      { customer: { name: { contains: query.q, mode: "insensitive" } } },
      { customer: { email: { contains: query.q, mode: "insensitive" } } },
      { messages: { some: { message: { contains: query.q, mode: "insensitive" }, messageType: { not: "INTERNAL_NOTE" } } } },
    ];
  }
  return where;
}

async function listAdminConversations(query = {}) {
  const page = query.page || 1;
  const limit = query.limit || 25;
  const where = buildAdminWhere(query);
  const [items, total, stats] = await Promise.all([
    prisma.supportConversation.findMany({
      where,
      include: { ...conversationInclude, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportConversation.count({ where }),
    getStats(),
  ]);
  return { items, total, page, limit, stats };
}

async function getAdminConversation(id) {
  await prisma.supportConversation.update({ where: { id }, data: { agentUnread: 0 } }).catch(() => {});
  return ensureAdminConversation(id);
}

async function sendAgentMessage(id, agent, payload) {
  await ensureAdminConversation(id, { take: 1 });
  const messageText = sanitizeMessageText(payload.message);
  if (!messageText) throw new ApiError(400, "Message is required");
  const message = await prisma.$transaction(async (tx) => {
    if (payload.clientMessageId) {
      const existing = await tx.supportMessage.findUnique({
        where: { conversationId_clientMessageId: { conversationId: id, clientMessageId: payload.clientMessageId } },
      });
      if (existing) return existing;
    }
    const created = await tx.supportMessage.create({
      data: {
        conversationId: id,
        senderId: agent.userId || agent.id,
        senderType: "AGENT",
        messageType: "TEXT",
        message: messageText,
        clientMessageId: payload.clientMessageId || null,
        metadata: payload.metadata || null,
      },
    });
    const conversation = await tx.supportConversation.findUnique({ where: { id } });
    await tx.supportConversation.update({
      where: { id },
      data: {
        status: conversation.status === "WAITING_FOR_AGENT" ? "IN_PROGRESS" : conversation.status,
        firstResponseAt: conversation.firstResponseAt || created.createdAt,
        customerUnread: { increment: 1 },
        lastMessageAt: created.createdAt,
      },
    });
    return created;
  });
  realtime.emitSupportEvent(id, "support:message_new", { conversationId: id, message });
  return message;
}

async function addInternalNote(id, agent, note) {
  await ensureAdminConversation(id, { take: 1 });
  const message = await prisma.supportMessage.create({
    data: {
      conversationId: id,
      senderId: agent.userId || agent.id,
      senderType: "AGENT",
      messageType: "INTERNAL_NOTE",
      message: sanitizeMessageText(note),
    },
  });
  realtime.emitToAdmins("support:internal_note", { conversationId: id, message });
  return message;
}

async function assignConversation(id, assignedAgentId) {
  const data = assignedAgentId
    ? { assignedAgentId, status: "ASSIGNED" }
    : { assignedAgentId: null, status: "WAITING_FOR_AGENT" };
  const conversation = await prisma.supportConversation.update({
    where: { id },
    data,
    include: conversationInclude,
  });
  realtime.emitSupportEvent(id, "support:conversation_assigned", { conversationId: id, conversation });
  return conversation;
}

async function updateConversationStatus(id, payload) {
  const data = {
    status: payload.status,
    ...(payload.priority ? { priority: payload.priority } : {}),
    ...(payload.status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
    ...(payload.status === "CLOSED" ? { closedAt: new Date() } : {}),
  };
  const conversation = await prisma.supportConversation.update({ where: { id }, data, include: conversationInclude });
  realtime.emitSupportEvent(id, "support:conversation_status", { conversationId: id, conversation });
  return conversation;
}

async function markAdminRead(id) {
  await ensureAdminConversation(id, { take: 1 });
  await prisma.supportConversation.update({ where: { id }, data: { agentUnread: 0 } });
  await prisma.supportMessage.updateMany({
    where: { conversationId: id, senderType: "CUSTOMER", readAt: null },
    data: { readAt: new Date() },
  });
  realtime.emitSupportEvent(id, "support:message_read", { conversationId: id, reader: "AGENT" });
  return { ok: true };
}

async function getStats() {
  const [total, open, waiting, assigned, urgent, resolved, ratings] = await Promise.all([
    prisma.supportConversation.count(),
    prisma.supportConversation.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.supportConversation.count({ where: { status: "WAITING_FOR_AGENT" } }),
    prisma.supportConversation.count({ where: { assignedAgentId: { not: null }, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    prisma.supportConversation.count({ where: { priority: "URGENT", status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    prisma.supportConversation.count({ where: { status: "RESOLVED" } }),
    prisma.supportRating.aggregate({ _avg: { rating: true }, _count: { rating: true } }),
  ]);
  return {
    total,
    open,
    waiting,
    assigned,
    urgent,
    resolved,
    averageRating: ratings._avg.rating || null,
    ratingCount: ratings._count.rating || 0,
    onlineAgents: realtime.getOnlineAgentIds().length,
  };
}

async function updateSettings(payload) {
  return prisma.supportSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...payload },
    update: payload,
  });
}

module.exports = {
  addInternalNote,
  assignConversation,
  createOrGetCustomerConversation,
  getAdminConversation,
  getCustomerConversation,
  getSettings,
  getStats,
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
