const { z } = require("zod");

const idParam = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.any().optional(),
  query: z.any().optional(),
});

const sourceEnum = z.enum(["WEBSITE", "PETGPT", "ORDER", "PRODUCT", "CHECKOUT"]);
const priorityEnum = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
const statusEnum = z.enum(["OPEN", "WAITING_FOR_AGENT", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"]);
const subjectEnum = z.enum(["Order Issue", "Payment Issue", "Delivery Issue", "Return/Refund", "Product Question", "Account Issue", "Technical Issue", "Other"]);

const optionalTrimmed = z
  .string()
  .trim()
  .max(160)
  .optional()
  .nullable();

const createConversationSchema = z.object({
  body: z.object({
    subject: subjectEnum.optional().or(optionalTrimmed),
    source: sourceEnum.optional().default("WEBSITE"),
    priority: priorityEnum.optional().default("NORMAL"),
    orderId: z.string().trim().min(1).optional().nullable(),
    productId: z.string().trim().min(1).optional().nullable(),
    metadata: z.object({}).passthrough().optional().nullable(),
    initialMessage: z.string().trim().min(1).max(2000).optional().nullable(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const listCustomerConversationsSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    status: statusEnum.optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }).optional(),
});

const messageSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, "Message is required").max(2000, "Message is too long"),
    clientMessageId: z.string().trim().min(1).max(120).optional().nullable(),
    messageType: z.enum(["TEXT", "IMAGE", "FILE", "ORDER_REFERENCE", "PRODUCT_REFERENCE"]).optional().default("TEXT"),
    metadata: z.object({}).passthrough().optional().nullable(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const ratingSchema = z.object({
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    feedback: z.string().trim().max(1000).optional().nullable(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const adminListSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    assignedAgentId: z.string().trim().optional(),
    q: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }).optional(),
});

const assignSchema = z.object({
  body: z.object({
    assignedAgentId: z.string().trim().min(1).optional().nullable(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const statusSchema = z.object({
  body: z.object({
    status: statusEnum,
    priority: priorityEnum.optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const internalNoteSchema = z.object({
  body: z.object({
    note: z.string().trim().min(1).max(2000),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const settingsSchema = z.object({
  body: z.object({
    enabled: z.coerce.boolean().optional(),
    supportName: z.string().trim().min(1).max(80).optional(),
    welcomeMessage: z.string().trim().min(1).max(240).optional(),
    offlineMessage: z.string().trim().min(1).max(240).optional(),
    autoAssignmentEnabled: z.coerce.boolean().optional(),
    maxConversationsPerAgent: z.coerce.number().int().min(1).max(50).optional(),
    fileUploadEnabled: z.coerce.boolean().optional(),
    ratingEnabled: z.coerce.boolean().optional(),
    emailNotificationsEnabled: z.coerce.boolean().optional(),
    availability: z.object({}).passthrough().optional().nullable(),
    autoCloseResolvedAfterDays: z.coerce.number().int().min(1).max(90).optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

module.exports = {
  adminListSchema,
  assignSchema,
  createConversationSchema,
  idParam,
  internalNoteSchema,
  listCustomerConversationsSchema,
  messageSchema,
  ratingSchema,
  settingsSchema,
  statusSchema,
};
