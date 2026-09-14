const { z } = require("zod");

const idParam = z.object({
  body: z.any().optional(),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const dateValue = z.preprocess((value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }
  return value;
}, z.coerce.date());

const autoOrderCreateSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    variantId: z.string().optional().nullable(),
    variantLabel: z.string().optional().nullable(),
    quantity: z.coerce.number().int().positive(),
    frequencyValue: z.coerce.number().int().refine((value) => [7, 15, 30, 60].includes(value), {
      message: "Frequency must be 7, 15, 30, or 60 days",
    }),
    firstOrderDate: dateValue,
    shippingAddressIndex: z.coerce.number().int().nonnegative(),
    paymentMethod: z.enum(["stripe"]).optional().default("stripe"),
    paymentMethodReference: z.string().optional().nullable(),
    stripeCustomerId: z.string().optional().nullable(),
    autoRenew: z.boolean().optional().default(true),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const autoOrderUpdateSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().int().positive().optional(),
    frequencyValue: z.coerce.number().int().refine((value) => [7, 15, 30, 60].includes(value), {
      message: "Frequency must be 7, 15, 30, or 60 days",
    }).optional(),
    nextOrderDate: dateValue.optional(),
    shippingAddressIndex: z.coerce.number().int().nonnegative().optional(),
    paymentMethodReference: z.string().optional().nullable(),
    stripeCustomerId: z.string().optional().nullable(),
    autoRenew: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const adminAutoOrderUpdateSchema = z.object({
  body: z.object({
    nextOrderDate: dateValue.optional(),
    status: z.enum([
      "ACTIVE",
      "PAUSED",
      "PAYMENT_FAILED",
      "OUT_OF_STOCK",
      "PRESCRIPTION_REQUIRED",
      "CANCELLED",
      "COMPLETED",
    ]).optional(),
    failureReason: z.string().optional().nullable(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const paymentSetupIntentSchema = z.object({
  body: z.any().optional(),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const savePaymentMethodSchema = z.object({
  body: z.object({
    setupIntentId: z.string().min(1, "Setup intent is required"),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

module.exports = {
  adminAutoOrderUpdateSchema,
  autoOrderCreateSchema,
  autoOrderUpdateSchema,
  idParam,
  paymentSetupIntentSchema,
  savePaymentMethodSchema,
};
