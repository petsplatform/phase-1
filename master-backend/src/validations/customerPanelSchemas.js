const { z } = require("zod");

const PHONE_VALIDATION_MESSAGE = "Please enter a valid phone number.";
const anyObject = z.object({}).passthrough();
const optionalStringLike = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .optional();
const nullableStringLike = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .optional()
  .nullable();
const isValidPhone = (phone) => {
  if (phone === "") return true;
  if (!/^\+?[0-9\s\-()]+$/.test(phone)) return false;

  const digitCount = phone.replace(/\D/g, "").length;
  return digitCount >= 7 && digitCount <= 15;
};
const isRequiredValidPhone = (phone) => {
  const value = String(phone || "").trim();
  return Boolean(value) && isValidPhone(value);
};
const optionalPhoneSchema = z
  .string()
  .trim()
  .refine(isValidPhone, "Enter a valid mobile number")
  .optional()
  .nullable();
const requiredPhoneSchema = z
  .string()
  .trim()
  .refine(isRequiredValidPhone, PHONE_VALIDATION_MESSAGE);
const addressValue = z.union([z.string().min(1), anyObject]);
const orderShippingAddressSchema = z.union([
  z.string().trim().min(1, "Shipping address is required"),
  anyObject.superRefine((address, ctx) => {
    const hasName = Boolean(
      String(address.fullName || address.name || "").trim(),
    );
    const hasAddressLine = Boolean(
      String(
        address.addressLine1 ||
          address.address ||
          address.street ||
          address.line1 ||
          "",
      ).trim(),
    );
    if (!hasName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fullName"],
        message: "Shipping full name is required",
      });
    }
    if (!isRequiredValidPhone(address.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: PHONE_VALIDATION_MESSAGE,
      });
    }
    if (!hasAddressLine) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["addressLine1"],
        message: "Shipping address line is required",
      });
    }
  }),
]);
const savedAddressValue = z.union([
  z.string().min(1),
  anyObject.superRefine((address, ctx) => {
    const requiredFields = [
      { keys: ["fullName", "name"], path: "fullName", message: "Full name is required" },
      { keys: ["addressLine1", "address", "street", "line1"], path: "addressLine1", message: "Address line is required" },
      { keys: ["city"], path: "city", message: "City is required" },
      { keys: ["state"], path: "state", message: "State is required" },
      { keys: ["postalCode", "zip"], path: "postalCode", message: "Postal code is required" },
      { keys: ["country"], path: "country", message: "Country is required" },
    ];

    requiredFields.forEach(({ keys, path, message }) => {
      const hasValue = keys.some((key) => String(address[key] || "").trim());
      if (!hasValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message,
        });
      }
    });

    if (!isRequiredValidPhone(address.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: PHONE_VALIDATION_MESSAGE,
      });
    }
  }),
]);

const customerLoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const customerLoginOtpRequestSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Enter a valid email address"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const customerLoginOtpVerifySchema = z.object({
  body: z.object({
    otpToken: z.string().min(1, "OTP session is required"),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit OTP"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const checkoutOtpRequestSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Full name is required"),
    email: z.string().trim().email("Enter a valid email address"),
    phone: z.string().trim().min(7, "Enter a valid mobile number"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const checkoutOtpVerifySchema = z.object({
  body: z.object({
    otpToken: z.string().min(1, "OTP session is required"),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit OTP"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const customerRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
    addresses: z.array(addressValue).optional().default([]),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const updateCustomerProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: optionalPhoneSchema,
    avatar: z.string().optional().nullable(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const addressSchema = z.object({
  body: z.object({ address: savedAddressValue }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const addressIndexParam = z.object({
  body: z.any().optional(),
  params: z.object({ index: z.coerce.number().int().nonnegative() }),
  query: z.any().optional(),
});

const updateAddressSchema = z.object({
  body: z.object({ address: savedAddressValue }),
  params: z.object({ index: z.coerce.number().int().nonnegative() }),
  query: z.any().optional(),
});

const orderItemSchema = z
  .object({
    productId: optionalStringLike,
    id: optionalStringLike,
    name: optionalStringLike,
    productName: optionalStringLike,
    title: optionalStringLike,
    sku: optionalStringLike,
    variantId: optionalStringLike,
    quantity: z.coerce
      .number({ invalid_type_error: "Quantity is required" })
      .int("Quantity must be a whole number")
      .positive("Quantity must be greater than zero"),
    price: z.coerce
      .number({ invalid_type_error: "Price is required" })
      .nonnegative("Price must be zero or greater"),
    image: nullableStringLike,
    optionLabel: nullableStringLike,
    selectedSize: z.any().optional().nullable(),
    selectedColor: z.any().optional().nullable(),
  })
  .passthrough()
  .superRefine((item, ctx) => {
    if (!item.productId && !item.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productId"],
        message: "Product ID is required",
      });
    }
    if (!item.name && !item.productName && !item.title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Product name is required",
      });
    }
  });

const createCustomerOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1, "Cart is empty"),
    shippingAddress: orderShippingAddressSchema,
    email: z.string().trim().email("Enter a valid email address").optional(),
    fullName: z.string().trim().min(1, "Full name is required").optional(),
    phone: requiredPhoneSchema.optional().nullable(),
    subtotal: z.coerce.number().nonnegative().optional(),
    shipping: z.coerce.number().nonnegative().optional(),
    shippingCost: z.coerce.number().nonnegative().optional(),
    tax: z.coerce.number().nonnegative().optional(),
    taxAmount: z.coerce.number().nonnegative().optional(),
    totalAmount: z.coerce.number().nonnegative().optional(),
    discount: z.coerce.number().nonnegative().optional(),
    promoDiscount: z.coerce.number().nonnegative().optional(),
    couponDiscount: z.coerce.number().nonnegative().optional(),
    couponCode: z.string().optional().nullable(),
    rewardPointsToRedeem: z.coerce.number().int().nonnegative().optional().default(0),
    currency: z.string().trim().length(3).optional().default("usd"),
    paymentMethod: z.enum(["stripe", "cod"]).optional().default("cod"),
    stripePaymentIntentId: z.string().optional().nullable(),
    prescriptionUrl: nullableStringLike,
    prescriptions: z.array(z.object({ url: z.string(), fileName: z.string().optional() }).passthrough()).optional().nullable(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const checkoutQuoteSchema = createCustomerOrderSchema;

const createPaymentIntentSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive(),
    currency: z.string().trim().length(3).optional().default("usd"),
    localFallback: z.boolean().optional().default(false),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const updatePaymentIntentSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive(),
    currency: z.string().trim().length(3).optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const checkoutContactSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Full name is required"),
    email: z.string().trim().email("Enter a valid email address"),
    phone: requiredPhoneSchema,
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const newsletterSubscribeSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Enter a valid email address").max(100),
    name: z.string().trim().max(100).optional().nullable(),
    source: z.string().trim().max(80).optional().default("website"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const reverseGeocodeSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
  }),
});

const idParam = z.object({
  body: z.any().optional(),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const collectionItemSchema = anyObject;

const syncCollectionSchema = z.object({
  body: z.object({
    items: z.array(collectionItemSchema).optional().default([]),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const addCollectionItemSchema = z.object({
  body: z.object({
    item: collectionItemSchema,
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().int().positive(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().min(1, "Product ID is required"),
    orderId: z.string().min(1, "Order ID is required"),
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().optional().nullable(),
    comment: z.string().trim().min(3, "Review comment is required"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const productIdParam = z.object({
  body: z.any().optional(),
  params: z.object({ productId: z.string().min(1) }),
  query: z.any().optional(),
});

const stringListSchema = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .default([])
  .transform((value) => {
    const items = Array.isArray(value)
      ? value
      : String(value || "").split(/[,\n]/);
    return items.map((item) => String(item).trim()).filter(Boolean);
  });

const petBodySchema = z.object({
  name: z.string().trim().min(1, "Pet name is required").max(80),
  species: z.string().trim().min(1, "Species is required").max(50),
  breed: z.string().trim().max(80).optional().nullable(),
  age: z.string().trim().max(50).optional().nullable(),
  weight: z.string().trim().max(50).optional().nullable(),
  gender: z.string().trim().max(30).optional().nullable(),
  neuteredSpayed: z.boolean().optional().nullable(),
  medicalConditions: stringListSchema,
  allergies: stringListSchema,
  currentMedications: stringListSchema,
  vaccinationInfo: z.string().trim().max(500).optional().nullable(),
});

const petSchema = z.object({
  body: petBodySchema,
  params: z.any().optional(),
  query: z.any().optional(),
});

const updatePetSchema = z.object({
  body: petBodySchema.partial(),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const customerLoginMethodSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Enter a valid email address"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const passwordValue = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .max(72, "Password must not exceed 72 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/\d/, "Password must include a number");

const setPasswordSchema = z.object({
  body: z.object({
    password: passwordValue,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const changeCustomerPasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().optional(),
    newPassword: passwordValue,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const resetPasswordSchema = z.object({
  body: z.object({
    otpToken: z.string().min(1, "OTP session is required"),
    code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
    password: passwordValue,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const futureDate = (label) =>
  z.preprocess(
    (value) => {
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00`);
      }
      return value;
    },
    z.coerce.date({
      required_error: `${label} is required`,
      invalid_type_error: `${label} must be a valid date`,
    }),
  ).refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, `${label} cannot be in the past`);

const vetVerificationBodySchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  clinicName: z.string().trim().min(1, "Clinic name is required"),
  licenseNumber: z.string().trim().min(1, "License number is required"),
  licenseState: z.string().trim().min(1, "License state is required"),
  licenseExpiry: futureDate("License expiry"),
  phone: requiredPhoneSchema,
  email: z.string().trim().email("Enter a valid email address"),
});

const vetVerificationSchema = z.object({
  body: vetVerificationBodySchema,
  params: z.any().optional(),
  query: z.any().optional(),
});

module.exports = {
  addressIndexParam,
  addressSchema,
  checkoutContactSchema,
  checkoutQuoteSchema,
  checkoutOtpRequestSchema,
  checkoutOtpVerifySchema,
  createCustomerOrderSchema,
  createPaymentIntentSchema,
  createReviewSchema,
  changeCustomerPasswordSchema,
  customerLoginMethodSchema,
  customerLoginOtpRequestSchema,
  customerLoginOtpVerifySchema,
  customerLoginSchema,
  customerRegisterSchema,
  idParam,
  newsletterSubscribeSchema,
  petSchema,
  productIdParam,
  resetPasswordSchema,
  reverseGeocodeSchema,
  setPasswordSchema,
  addCollectionItemSchema,
  syncCollectionSchema,
  updateAddressSchema,
  updateCartItemSchema,
  updateCustomerProfileSchema,
  updatePetSchema,
  updatePaymentIntentSchema,
  vetVerificationSchema,
};
