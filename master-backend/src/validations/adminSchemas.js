const { z } = require("zod");

const requiredString = (label) =>
  z.string().trim().min(1, `${label} is required`);
const optionalString = z.preprocess(
  (val) => (val === undefined || val === null || val === "" ? null : String(val).trim() || null),
  z.string().nullable().optional(),
);
const contactNameString = (label) =>
  requiredString(label)
    .min(2, `${label} must be at least 2 characters`)
    .max(70, `${label} must be 70 characters or less`)
    .regex(/^[A-Za-z][A-Za-z\s'.-]*$/, `${label} can only include letters, spaces, apostrophes, dots, and hyphens`);
const contactPhoneString = z
  .string()
  .trim()
  .regex(/^[+]?[0-9\s()-]{7,20}$/, "A valid phone number is required")
  .refine((value) => {
    const digitCount = value.replace(/\D/g, "").length;
    return digitCount >= 7 && digitCount <= 15;
  }, "Phone number must have 7 to 15 digits");
const contactSubjectString = requiredString("Subject")
  .min(3, "Subject must be at least 3 characters")
  .max(120, "Subject must be 120 characters or less")
  .regex(/[A-Za-z]/, "Subject must include letters");
const contactMessageString = requiredString("Message")
  .min(10, "Message must be at least 10 characters")
  .max(1000, "Message must be 1000 characters or less")
  .regex(/[A-Za-z]/, "Message must include letters");
const requiredDate = (label) =>
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
  );
const optionalDate = z.coerce.date().optional().nullable();
const optionalDateOnly = z
  .preprocess(
    (value) => {
      if (value === "" || value === undefined || value === null) return null;
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00`);
      }
      return value;
    },
    z.coerce.date(),
  )
  .optional()
  .nullable();
const requiredNonNegativeNumber = (label) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .nonnegative(`${label} must be zero or greater`);
const requiredPositiveNumber = (label) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .positive(`${label} must be greater than zero`);
const requiredNonNegativeInteger = (label) =>
  z
    .preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z
        .any()
        .refine(
          (value) => value !== "" && value !== undefined && value !== null,
          `${label} is required`,
        )
        .refine((value) => Number.isFinite(Number(value)), `${label} must be a number`)
        .transform((value) => Number(value))
        .refine((value) => Number.isInteger(value), `${label} must be a whole number`)
        .refine((value) => value >= 0, `${label} must be zero or greater`),
    );
const requiredPositiveInteger = (label) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .positive(`${label} must be greater than zero`);

const productOptionTypeSchema = z
  .enum(["size", "weight", "volume", "length", "custom"])
  .optional()
  .default("size");

const colorVariantSchema = z
  .object({
    id: z.string().optional(),
    label: requiredString("Color name"),
    color: z.string().optional().nullable(),
    mainImage: optionalString,
    gallery: z.array(z.string()).optional().default([]),
  })
  .passthrough();

const optionVariantSchema = z
  .object({
    id: z.string().optional(),
    label: requiredString("Variant name"),
    sku: optionalString,
    price: requiredPositiveNumber("Variant selling price").optional(),
    regularPrice: requiredPositiveNumber("Variant MRP").optional(),
    salePrice: requiredPositiveNumber("Variant MRP").optional(),
    stock: requiredNonNegativeInteger("Variant stock").optional(),
    status: z.enum(["Active", "Inactive"]).optional().default("Active"),
  })
  .passthrough()
  .refine(
    (variant) => {
      const regularPrice = variant.regularPrice ?? variant.salePrice;
      return (
        variant.price === undefined ||
        regularPrice === undefined ||
        Number(variant.price) <= Number(regularPrice)
      );
    },
    {
      message: "Variant selling price cannot be greater than variant MRP",
      path: ["price"],
    },
  );

const productSkuSchema = z
  .object({
    id: z.string().optional(),
    packLabel: requiredString("Pack label"),
    sku: requiredString("SKU"),
    regularPrice: requiredPositiveNumber("SKU MRP"),
    salePrice: z.coerce.number().positive("SKU selling price").optional().nullable(),
    price: z.coerce.number().positive("SKU selling price").optional().nullable(),
    stock: requiredNonNegativeInteger("SKU stock"),
    status: z.enum(["Active", "Inactive"]).optional().default("Active"),
    enabled: z.coerce.boolean().optional(),
    image: optionalString,
  })
  .passthrough()
  .refine(
    (sku) => {
      const sellingPrice = sku.salePrice ?? sku.price ?? sku.regularPrice;
      return Number(sellingPrice) <= Number(sku.regularPrice);
    },
    {
      message: "SKU selling price cannot be greater than SKU MRP",
      path: ["salePrice"],
    },
  );

const familyVariantSchema = z
  .object({
    id: z.string().optional(),
    name: requiredString("Variant name"),
    displayName: optionalString,
    slug: optionalString,
    strength: optionalString,
    weightRange: optionalString,
    packColor: optionalString,
    image: optionalString,
    gallery: z.array(z.string()).optional().default([]),
    shortDescription: optionalString,
    content: optionalString,
    status: z.enum(["Active", "Inactive"]).optional().default("Active"),
    enabled: z.coerce.boolean().optional(),
    seoTitle: optionalString,
    seoDescription: optionalString,
    skus: z.array(productSkuSchema).optional().default([]),
  })
  .passthrough();

const productDetailsSchema = z
  .object({
    content: optionalString,
    overview: optionalString,
    benefits: z.array(z.string()).optional().default([]),
    directions: z.array(z.string()).optional().default([]),
    ingredients: optionalString,
    safety: optionalString,
    faq: z.array(z.object({
      question: optionalString,
      answer: optionalString,
    })).optional().default([]),
  })
  .passthrough()
  .optional()
  .default({});

const idParam = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.any().optional(),
  query: z.any().optional(),
});

const todayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const todayDateKey = (timezone = process.env.STORE_TIMEZONE || process.env.TZ || "America/New_York") => {
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const parts = formatter.formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
};

const dateOnlyKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const productSchema = z.object({
  body: z
    .object({
      name: requiredString("Product name"),
      slug: optionalString,
      categoryId: optionalString,
      category: optionalString,
      petType: optionalString,
      description: optionalString,
      parentContent: optionalString,
      productDetails: productDetailsSchema,
      productType: z.enum(["SIMPLE", "FAMILY"]).optional().default("SIMPLE"),
      familyVariants: z.array(familyVariantSchema).optional().default([]),
      seoTitle: optionalString,
      seoDescription: optionalString,
      shippingReturns: optionalString,
      returnPolicies: optionalString,
      prescriptionRequired: z.coerce.boolean().optional().default(false),
      vetOnly: z.coerce.boolean().optional().default(false),
      price: requiredPositiveNumber("Selling price").optional(),
      salePrice: z.coerce
        .number()
        .nonnegative("MRP must be zero or greater")
        .optional()
        .nullable(),
      stock: requiredNonNegativeInteger("Stock").optional(),
      sku: requiredString("Product SKU"),
      status: z.enum(["Active", "Inactive"]).default("Active"),
      image: optionalString,
      gallery: z.array(z.string()).optional().default([]),
      optionType: productOptionTypeSchema,
      optionLabel: optionalString,
      capacities: z.array(z.string().trim().min(1)).optional().default([]),
      colorVariants: z.array(colorVariantSchema).optional().default([]),
      optionVariants: z.array(optionVariantSchema).optional().default([]),
    })
    .refine((body) => body.categoryId || body.category, {
      message: "Category is required",
      path: ["categoryId"],
    })
    .refine(
      (body) =>
        body.productType === "FAMILY" ||
        (Array.isArray(body.optionVariants) && body.optionVariants.length > 0) ||
        (body.price !== undefined && body.stock !== undefined),
      {
        message: "Add variants or provide product price and stock",
        path: ["optionVariants"],
      },
    )
    .refine(
      (body) =>
        body.productType !== "FAMILY" ||
        (Array.isArray(body.familyVariants) &&
          body.familyVariants.some((variant) => Array.isArray(variant.skus) && variant.skus.length > 0)),
      {
        message: "Add at least one variant with one pack/SKU",
        path: ["familyVariants"],
      },
    )
    .refine(
      (body) =>
        body.price === undefined ||
        body.salePrice === null ||
        body.salePrice === undefined ||
        body.price <= body.salePrice,
      {
        message: "Selling price cannot be greater than MRP",
        path: ["price"],
      },
    ),
  params: z.any().optional(),
  query: z.any().optional(),
});

const categorySchema = z.object({
  body: z.object({
    name: requiredString("Category name"),
    description: optionalString,
    image: optionalString,
    status: z.enum(["Active", "Inactive"]).default("Active"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const orderStatusSchema = z.object({
  body: z.object({
    orderStatus: z.enum([
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ]),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const shipmentStatuses = [
  "Pending",
  "Packed",
  "ReadyToShip",
  "Shipped",
  "InTransit",
  "OutForDelivery",
  "Delivered",
  "Cancelled",
  "Returned",
  "FailedDelivery",
];

const optionalFutureDateOnly = z
  .preprocess(
    (value) => {
      if (value === "" || value === undefined || value === null) return null;
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00`);
      }
      return value;
    },
    z.coerce.date(),
  )
  .optional()
  .nullable()
  .refine((value) => !value || value >= todayStart(), "Estimated delivery date must be today or a future date");

const requiredFutureDateOnly = z
  .preprocess(
    (value) => {
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00`);
      }
      return value;
    },
    z.coerce.date({
      required_error: "Estimated delivery date is required",
      invalid_type_error: "Estimated delivery date must be a valid date",
    }),
  )
  .refine((value) => value >= todayStart(), "Estimated delivery date must be today or a future date");

const shipmentSchema = z.object({
  body: z.object({
    courierName: requiredString("Courier"),
    trackingNumber: requiredString("Tracking number"),
    awbNumber: requiredString("AWB number"),
    trackingUrl: optionalString,
    estimatedDeliveryDate: requiredFutureDateOnly,
    notes: requiredString("Shipment notes"),
    location: requiredString("Location"),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const shipmentStatusSchema = z.object({
  body: z.object({
    status: z.enum(shipmentStatuses),
    location: requiredString("Location"),
    description: requiredString("Shipment notes"),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const shipmentListSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    q: z.string().trim().optional(),
    shipmentStatus: z.enum(["All", ...shipmentStatuses]).optional(),
    courierName: z.string().trim().optional(),
    startDate: z.string().trim().optional(),
    endDate: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }).optional(),
});

const bulkShipmentSchema = z.object({
  body: z.object({
    courierName: requiredString("Courier"),
    shipments: z.array(z.object({
      orderId: requiredString("Order number"),
      trackingNumber: requiredString("Tracking number"),
      awbNumber: optionalString,
      estimatedDeliveryDate: optionalDateOnly,
      notes: optionalString,
    })).min(1, "At least one shipment is required"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const courierSchema = z.object({
  body: z.object({
    name: requiredString("Courier name"),
    trackingUrlPattern: optionalString,
    status: z.enum(["Active", "Inactive"]).optional().default("Active"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const shipmentSettingsSchema = z.object({
  body: z.object({
    defaultCourierId: optionalString,
    defaultEstimatedDeliveryDays: z.coerce.number().int().min(1).max(60).optional(),
    enableEmailNotifications: z.coerce.boolean().optional(),
    enableSmsNotifications: z.coerce.boolean().optional(),
    enablePushNotifications: z.coerce.boolean().optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const bannerSchema = z.object({
  body: z
    .object({
      title: requiredString("Banner title"),
      subtitle: optionalString,
      buttonText: optionalString,
      link: optionalString,
      image: requiredString("Banner image"),
      position: requiredString("Position"),
      startDate: requiredDate("Start date"),
      endDate: requiredDate("End date"),
      status: z.enum(["Active", "Inactive"]).default("Active"),
    })
    .refine((body) => body.startDate >= todayStart(), {
      message: "Start date must be today or a future date",
      path: ["startDate"],
    })
    .refine((body) => body.endDate >= todayStart(), {
      message: "End date must be today or a future date",
      path: ["endDate"],
    })
    .refine((body) => body.endDate >= body.startDate, {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const popupSchema = z.object({
  body: z.object({
    title: requiredString("Popup title"),
    message: optionalString,
    buttonText: optionalString,
    link: optionalString,
    image: optionalString,
    status: z.enum(["Active", "Inactive"]).default("Active"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const announcementSchema = z.object({
  body: z
    .object({
      text: requiredString("Announcement text"),
      link: optionalString,
      startDate: requiredDate("Start date"),
      endDate: requiredDate("End date"),
      status: z.enum(["Active", "Inactive"]).default("Active"),
    })
    .refine((body) => body.startDate >= todayStart(), {
      message: "Start date must be today or a future date",
      path: ["startDate"],
    })
    .refine((body) => body.endDate >= todayStart(), {
      message: "End date must be today or a future date",
      path: ["endDate"],
    })
    .refine((body) => body.endDate >= body.startDate, {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const inquiryBodySchema = z
  .object({
    fullName: contactNameString("Full name").optional(),
    name: contactNameString("Name").optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("A valid email address is required")
      .max(120, "Email must be 120 characters or less"),
    phone: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? null : value),
      contactPhoneString.optional().nullable(),
    ),
    subject: contactSubjectString,
    message: contactMessageString,
  })
  .refine((body) => body.fullName || body.name, {
    message: "Full name is required",
    path: ["fullName"],
  })
  .transform((body) => ({
    fullName: body.fullName || body.name,
    email: body.email,
    phone: body.phone || null,
    subject: body.subject,
    message: body.message,
  }));

const inquirySchema = z.object({
  body: inquiryBodySchema,
  params: z.any().optional(),
  query: z.any().optional(),
});

const inquiryStatusSchema = z.object({
  body: z.object({
    status: z.enum(["New", "InProgress", "Resolved"]),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const couponSchema = z.object({
  body: z
    .object({
      code: requiredString("Coupon code").toUpperCase(),
      type: z.enum(["percentage", "flat"]).default("percentage"),
      value: requiredPositiveNumber("Coupon value"),
      minOrder: requiredNonNegativeNumber("Minimum order"),
      maxUses: requiredPositiveInteger("Max uses"),
      expiry: optionalDateOnly,
      status: z.enum(["Active", "Inactive"]).default("Active"),
    })
    .refine((body) => !body.expiry || dateOnlyKey(body.expiry) >= todayDateKey(), {
      message: "Expiry date must be today or a future date",
      path: ["expiry"],
    }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const taxSchema = z.object({
  body: z.object({
    name: requiredString("Tax name"),
    rate: z.coerce
      .number({ invalid_type_error: "Tax rate must be a number" })
      .min(0, "Tax rate must be zero or greater")
      .max(100, "Tax rate cannot be greater than 100"),
    description: optionalString,
    status: z.enum(["Active", "Inactive"]).default("Active"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const vetVerificationListSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    status: z.enum(["Pending", "Approved", "Rejected", "Expired", "All"]).optional(),
    q: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }).optional(),
});

const rejectVetVerificationSchema = z.object({
  body: z.object({
    remarks: requiredString("Rejection remarks").min(3, "Rejection remarks must be at least 3 characters"),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});

const settingsSchema = z.object({
  body: z.object({
    storeName: z.string().trim().min(1).optional(),
    supportEmail: z.string().trim().email().optional(),
    supportPhone: z.string().optional().nullable(),
    currency: z.string().trim().min(1).optional(),
    timezone: z.string().trim().min(1).optional(),
    rewardsEnabled: z.coerce.boolean().optional(),
    rewardSignupPoints: z.coerce.number().int().nonnegative().optional(),
    rewardPointsPerCurrencyUnit: z.coerce.number().nonnegative().optional(),
    rewardPointValue: z.coerce.number().nonnegative().optional(),
    rewardMaxRedeemPercent: z.coerce.number().min(0).max(100).optional(),
    rewardMinRedeemPoints: z.coerce.number().int().nonnegative().optional(),
    abandonedCartEmailEnabled: z.coerce.boolean().optional(),
    abandonedCartDelayHours: z.coerce.number().nonnegative().optional(),
    abandonedCartDiscountPercent: z.coerce.number().min(0).max(100).optional(),
    abandonedCartMinimumAmount: z.coerce.number().nonnegative().optional(),
    abandonedCartMaxEmails: z.coerce.number().int().nonnegative().optional(),
    mobileAppEnabled: z.coerce.boolean().optional(),
    appStoreUrl: z
      .preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? null : value),
        z.string().trim().url("App Store URL must be a valid URL").optional().nullable(),
      ),
    playStoreUrl: z
      .preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? null : value),
        z.string().trim().url("Play Store URL must be a valid URL").optional().nullable(),
      ),
    clearSmtpCredentials: z.boolean().optional(),
    smtpEmail: z
      .preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? null : value),
        z.string().trim().email().optional().nullable(),
      ),
    smtpPass: z
      .preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? null : value),
        z.string().trim().optional().nullable(),
      ),
    smtpHost: z
      .preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? null : value),
        z.string().trim().optional().nullable(),
      ),
    smtpPort: z
      .preprocess(
        (value) => (value === "" || value === null || value === undefined ? null : value),
        z.coerce
          .number({ invalid_type_error: "SMTP port must be a number" })
          .int("SMTP port must be a whole number")
          .min(1, "SMTP port is required")
          .max(65535, "SMTP port must be 65535 or less")
          .optional()
          .nullable(),
      ),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const shipmentChargeSchema = z.object({
  body: z.object({
    label: requiredString("Label"),
    minOrderAmount: z.coerce.number().nonnegative("Min order must be zero or greater"),
    maxOrderAmount: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : v),
      z.coerce.number().nonnegative().optional().nullable(),
    ),
    charge: z.coerce.number().nonnegative("Charge must be zero or greater"),
    status: z.enum(["Active", "Inactive"]).optional().default("Active"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

module.exports = {
  announcementSchema,
  bannerSchema,
  categorySchema,
  changePasswordSchema,
  couponSchema,
  idParam,
  inquirySchema,
  inquiryStatusSchema,
  loginSchema,
  orderStatusSchema,
  popupSchema,
  productSchema,
  settingsSchema,
  taxSchema,
  rejectVetVerificationSchema,
  bulkShipmentSchema,
  courierSchema,
  shipmentListSchema,
  shipmentSchema,
  shipmentSettingsSchema,
  shipmentChargeSchema,
  shipmentStatusSchema,
  vetVerificationListSchema,
};
