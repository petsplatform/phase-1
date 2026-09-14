const { z } = require("zod");

const createStoreSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Store name is required"),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    storeKey: z.string().trim().min(1, "Store key is required"),
    primaryDomain: z.string().trim().min(1, "Primary domain is required"),
    databaseName: z.string().trim().optional(),
    databaseHost: z.string().trim().optional(),
    databasePort: z.coerce.number().int().positive().optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const provisionStoreSchema = z.object({
  body: z.object({
    adminEmail: z.string().trim().email("A valid admin email is required"),
    adminPassword: z.string().min(8, "Admin password must be at least 8 characters"),
    adminName: z.string().trim().optional(),
  }),
  params: z.object({ storeId: z.string().trim().min(1) }),
  query: z.any().optional(),
});

module.exports = { createStoreSchema, provisionStoreSchema };
