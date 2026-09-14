const { z } = require("zod");

const chatSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, "Message is required").max(800),
    conversationId: z.string().trim().max(120).optional().nullable(),
    petId: z.string().trim().max(120).optional().nullable(),
    sessionId: z.string().trim().max(120).optional().nullable(),
    clientMessageId: z.string().trim().max(120).optional().nullable(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

module.exports = {
  chatSchema,
};
