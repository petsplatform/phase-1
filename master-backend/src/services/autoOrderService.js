const { Prisma } = require("@prisma/client");
const { prisma } = require("../config/db");
const { getCurrentStore } = require("../config/tenantContext");
const ApiError = require("../utils/apiError");
const customerPanelService = require("./customerPanelService");
const notificationService = require("./notificationService");
const stripeService = require("./stripeService");
const { findVariant, normalizeProduct } = require("../utils/productCatalog");

const ALLOWED_FREQUENCIES = new Set([7, 15, 30, 60]);
const MAX_RETRIES = Number(process.env.AUTO_ORDER_MAX_RETRIES || 3);
const RETRY_DELAY_DAYS = Number(process.env.AUTO_ORDER_RETRY_DELAY_DAYS || 1);

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
}

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, "Date is invalid");
  return date;
}

function formatFrequency(autoOrder) {
  return `Every ${autoOrder.frequencyValue} days`;
}

function parseAddress(address, index) {
  if (typeof address !== "string") return { index, ...address };
  try {
    return { index, ...JSON.parse(address) };
  } catch {
    return { index, address };
  }
}

function getCustomerAddress(customer, index) {
  const addressIndex = Number(index);
  if (!Number.isInteger(addressIndex) || addressIndex < 0 || addressIndex >= customer.addresses.length) {
    throw new ApiError(400, "Delivery address is invalid");
  }
  return parseAddress(customer.addresses[addressIndex], addressIndex);
}

function publicAutoOrder(autoOrder) {
  return {
    ...autoOrder,
    frequencyLabel: formatFrequency(autoOrder),
    productName: autoOrder.product?.name,
    productImage: autoOrder.product?.image,
  };
}

async function validateAutoOrderInput(customer, payload, db = prisma) {
  const quantity = Math.max(1, Number(payload.quantity) || 1);
  const frequencyValue = Number(payload.frequencyValue);
  if (!ALLOWED_FREQUENCIES.has(frequencyValue)) {
    throw new ApiError(400, "Frequency must be every 7, 15, 30, or 60 days");
  }

  const product = await db.product.findFirst({
    where: { id: payload.productId, status: "Active" },
  });
  if (!product) throw new ApiError(400, "Product is not available");

  const catalogProduct = normalizeProduct(product);
  const variant = payload.variantId
    ? findVariant(product, payload.variantId, payload.variantLabel)
    : null;
  if (payload.variantId && !variant) throw new ApiError(400, "Selected variant is not available");
  if (variant && !variant.isAvailable) throw new ApiError(400, "Selected variant is out of stock");

  const inventory = variant?.inventory || catalogProduct.inventory;
  if (!inventory.isInStock || inventory.stockQuantity < quantity) {
    throw new ApiError(400, `${product.name} is out of stock`);
  }

  const shippingAddress = getCustomerAddress(customer, payload.shippingAddressIndex);
  const firstOrderDate = normalizeDate(payload.firstOrderDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (firstOrderDate < today) throw new ApiError(400, "First delivery date cannot be in the past");

  if (product.vetOnly && !customer.isVetVerified) {
    throw new ApiError(403, "This product is available only for verified veterinarians.");
  }

  return {
    product,
    quantity,
    frequencyValue,
    firstOrderDate,
    shippingAddress,
    variant,
  };
}

async function createCustomerAutoOrder(customer, payload) {
  const validated = await validateAutoOrderInput(customer, payload);
  const autoOrder = await prisma.autoOrder.create({
    data: {
      customerId: customer.id,
      productId: validated.product.id,
      variantId: validated.variant?.id || payload.variantId || null,
      variantLabel: validated.variant?.label || payload.variantLabel || null,
      quantity: validated.quantity,
      frequencyValue: validated.frequencyValue,
      firstOrderDate: validated.firstOrderDate,
      nextOrderDate: validated.firstOrderDate,
      shippingAddressIndex: Number(payload.shippingAddressIndex),
      shippingAddressSnapshot: validated.shippingAddress,
      paymentMethod: payload.paymentMethod || "stripe",
      paymentMethodReference: payload.paymentMethodReference || null,
      stripeCustomerId: payload.stripeCustomerId || null,
      autoRenew: payload.autoRenew !== false,
      status: payload.autoRenew === false ? "PAUSED" : "ACTIVE",
    },
    include: { product: true, executions: { orderBy: { scheduledDate: "desc" } } },
  });

  await createNotification(customer.id, "Auto Order created", `${validated.product.name} will reorder ${formatFrequency(autoOrder).toLowerCase()}.`);
  return publicAutoOrder(autoOrder);
}

async function listCustomerAutoOrders(customerId) {
  const rows = await prisma.autoOrder.findMany({
    where: { customerId },
    include: { product: true, executions: { orderBy: { scheduledDate: "desc" }, take: 5 } },
    orderBy: [{ status: "asc" }, { nextOrderDate: "asc" }],
  });
  return rows.map(publicAutoOrder);
}

async function getCustomerAutoOrder(customerId, id) {
  const autoOrder = await prisma.autoOrder.findFirst({
    where: { id, customerId },
    include: {
      product: true,
      executions: { include: { order: true }, orderBy: { scheduledDate: "desc" } },
    },
  });
  if (!autoOrder) throw new ApiError(404, "Auto order not found");
  return publicAutoOrder(autoOrder);
}

async function updateCustomerAutoOrder(customer, id, payload) {
  const existing = await getCustomerAutoOrder(customer.id, id);
  const data = {};
  if (payload.quantity !== undefined) data.quantity = Math.max(1, Number(payload.quantity) || 1);
  if (payload.frequencyValue !== undefined) {
    const frequencyValue = Number(payload.frequencyValue);
    if (!ALLOWED_FREQUENCIES.has(frequencyValue)) {
      throw new ApiError(400, "Frequency must be every 7, 15, 30, or 60 days");
    }
    data.frequencyValue = frequencyValue;
  }
  if (payload.nextOrderDate !== undefined) data.nextOrderDate = normalizeDate(payload.nextOrderDate);
  if (payload.shippingAddressIndex !== undefined) {
    const address = getCustomerAddress(customer, payload.shippingAddressIndex);
    data.shippingAddressIndex = Number(payload.shippingAddressIndex);
    data.shippingAddressSnapshot = address;
  }
  if (payload.paymentMethodReference !== undefined) data.paymentMethodReference = payload.paymentMethodReference || null;
  if (payload.stripeCustomerId !== undefined) data.stripeCustomerId = payload.stripeCustomerId || null;
  if (payload.autoRenew !== undefined) data.autoRenew = Boolean(payload.autoRenew);

  const updated = await prisma.autoOrder.update({
    where: { id: existing.id },
    data,
    include: { product: true, executions: { orderBy: { scheduledDate: "desc" }, take: 5 } },
  });
  return publicAutoOrder(updated);
}

async function createPaymentSetupIntent(customer, id) {
  const autoOrder = await getCustomerAutoOrder(customer.id, id);
  const stripeCustomerId =
    autoOrder.stripeCustomerId ||
    (await stripeService.createCustomer({
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      metadata: {
        customerId: customer.id,
        autoOrderId: autoOrder.id,
        integration: "auto-order-payment-setup",
      },
    })).id;

  if (!autoOrder.stripeCustomerId) {
    await prisma.autoOrder.update({
      where: { id: autoOrder.id },
      data: { stripeCustomerId },
    });
  }

  const setupIntent = await stripeService.createSetupIntent(stripeCustomerId, {
    customerId: customer.id,
    autoOrderId: autoOrder.id,
    integration: "auto-order-payment-setup",
  });

  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
    stripeCustomerId,
  };
}

async function savePaymentMethodFromSetupIntent(customer, id, payload) {
  const autoOrder = await getCustomerAutoOrder(customer.id, id);
  const setupIntent = await stripeService.retrieveSetupIntent(payload.setupIntentId);

  if (setupIntent.status !== "succeeded") {
    throw new ApiError(400, "Payment setup has not been completed");
  }
  if (setupIntent.metadata?.autoOrderId !== autoOrder.id) {
    throw new ApiError(403, "Payment setup does not belong to this auto order");
  }
  if (setupIntent.customer !== autoOrder.stripeCustomerId) {
    throw new ApiError(403, "Payment setup does not belong to this customer");
  }

  const paymentMethodReference =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;
  if (!paymentMethodReference) {
    throw new ApiError(400, "Stripe did not return a saved payment method");
  }

  const updated = await prisma.autoOrder.update({
    where: { id: autoOrder.id },
    data: {
      paymentMethod: "stripe",
      paymentMethodReference,
      stripeCustomerId: setupIntent.customer,
      failureReason: null,
      status: autoOrder.status === "PAYMENT_FAILED" ? "ACTIVE" : undefined,
    },
    include: { product: true, executions: { orderBy: { scheduledDate: "desc" }, take: 5 } },
  });

  await createNotification(customer.id, "Auto payment authorized", `${updated.product.name} can now be charged automatically.`);
  return publicAutoOrder(updated);
}

async function changeCustomerAutoOrderStatus(customerId, id, status, message) {
  await getCustomerAutoOrder(customerId, id);
  const autoOrder = await prisma.autoOrder.update({
    where: { id },
    data: {
      status,
      autoRenew: status === "ACTIVE",
      failureReason: status === "ACTIVE" ? null : undefined,
    },
    include: { product: true, executions: { orderBy: { scheduledDate: "desc" }, take: 5 } },
  });
  await createNotification(customerId, message, `${autoOrder.product.name}: ${message.toLowerCase()}.`);
  return publicAutoOrder(autoOrder);
}

const pauseCustomerAutoOrder = (customerId, id) =>
  changeCustomerAutoOrderStatus(customerId, id, "PAUSED", "Auto Order paused");
const resumeCustomerAutoOrder = (customerId, id) =>
  changeCustomerAutoOrderStatus(customerId, id, "ACTIVE", "Auto Order resumed");
const cancelCustomerAutoOrder = (customerId, id) =>
  changeCustomerAutoOrderStatus(customerId, id, "CANCELLED", "Auto Order cancelled");

async function listAdminAutoOrders(query = {}) {
  const where = {
    status: query.status ? String(query.status).toUpperCase() : undefined,
    nextOrderDate: query.due === "today" ? { lte: new Date() } : undefined,
  };
  const rows = await prisma.autoOrder.findMany({
    where,
    include: {
      customer: true,
      product: true,
      executions: { orderBy: { scheduledDate: "desc" }, take: 3 },
    },
    orderBy: [{ nextOrderDate: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(publicAutoOrder);
}

async function getAdminAutoOrder(id) {
  const autoOrder = await prisma.autoOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      product: true,
      executions: { include: { order: true }, orderBy: { scheduledDate: "desc" } },
    },
  });
  if (!autoOrder) throw new ApiError(404, "Auto order not found");
  return publicAutoOrder(autoOrder);
}

async function updateAdminAutoOrder(id, payload) {
  await getAdminAutoOrder(id);
  const data = {};
  if (payload.nextOrderDate !== undefined) data.nextOrderDate = normalizeDate(payload.nextOrderDate);
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.failureReason !== undefined) data.failureReason = payload.failureReason || null;
  const updated = await prisma.autoOrder.update({
    where: { id },
    data,
    include: { customer: true, product: true, executions: { orderBy: { scheduledDate: "desc" } } },
  });
  return publicAutoOrder(updated);
}

async function getAutoOrderMetrics() {
  const [active, paused, cancelled, paymentFailed, dueToday, outOfStock, prescriptionBlocked] =
    await Promise.all([
      prisma.autoOrder.count({ where: { status: "ACTIVE" } }),
      prisma.autoOrder.count({ where: { status: "PAUSED" } }),
      prisma.autoOrder.count({ where: { status: "CANCELLED" } }),
      prisma.autoOrder.count({ where: { status: "PAYMENT_FAILED" } }),
      prisma.autoOrder.count({ where: { status: "ACTIVE", nextOrderDate: { lte: new Date() } } }),
      prisma.autoOrder.count({ where: { status: "OUT_OF_STOCK" } }),
      prisma.autoOrder.count({ where: { status: "PRESCRIPTION_REQUIRED" } }),
    ]);
  return { active, paused, cancelled, paymentFailed, dueToday, outOfStock, prescriptionBlocked };
}

async function processDueAutoOrders(db = prisma, options = {}) {
  const now = options.now || new Date();
  let due;
  try {
    due = await db.autoOrder.findMany({
      where: { status: "ACTIVE", autoRenew: true, nextOrderDate: { lte: now } },
      include: { customer: true, product: true },
      orderBy: { nextOrderDate: "asc" },
      take: options.limit || 25,
    });
  } catch (error) {
    if (isMissingAutoOrderTableError(error)) {
      console.warn("[AutoOrderJob] AutoOrder table is missing. Run tenant migrations before enabling auto orders.");
      return [];
    }
    throw error;
  }

  const results = [];
  for (const autoOrder of due) {
    results.push(await processAutoOrder(autoOrder, db).catch((error) => ({
      autoOrderId: autoOrder.id,
      success: false,
      error: error.message,
    })));
  }
  return results;
}

function isMissingAutoOrderTableError(error) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    String(error.meta?.table || "").includes("AutoOrder")
  );
}

async function processAutoOrder(autoOrder, db = prisma) {
  const scheduledDate = autoOrder.nextOrderDate;
  let execution;

  try {
    execution = await db.autoOrderExecution.create({
      data: {
        autoOrderId: autoOrder.id,
        scheduledDate,
        status: "PROCESSING",
        retryCount: autoOrder.retryCount,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { autoOrderId: autoOrder.id, duplicate: true };
    }
    throw error;
  }

  try {
    const payload = await buildOrderPayload(autoOrder, db);

    if (!autoOrder.paymentMethodReference || !autoOrder.stripeCustomerId) {
      throw statusError("PAYMENT_FAILED", "Saved automatic payment method is not configured");
    }

    const quote = await customerPanelService.getCheckoutQuote(payload);
    const intent = await stripeService.createOffSessionPaymentIntent(
      quote.total,
      process.env.STRIPE_CURRENCY || "usd",
      autoOrder.paymentMethodReference,
      autoOrder.stripeCustomerId,
      buildStripeMetadata(autoOrder, execution),
    );
    if (intent.status !== "succeeded") {
      throw statusError("PAYMENT_FAILED", `Stripe payment status is ${intent.status}`);
    }

    const order = await customerPanelService.createOrder(autoOrder.customer, {
      ...payload,
      paymentMethod: "stripe",
      stripePaymentIntentId: intent.id,
    });

    const nextOrderDate = addDays(scheduledDate, autoOrder.frequencyValue);
    await db.$transaction([
      db.autoOrderExecution.update({
        where: { id: execution.id },
        data: {
          orderId: order.id,
          processedAt: new Date(),
          status: "SUCCESS",
          paymentStatus: "PAID",
          orderStatus: order.orderStatus,
          stripePaymentIntentId: intent.id,
        },
      }),
      db.autoOrder.update({
        where: { id: autoOrder.id },
        data: {
          status: "ACTIVE",
          failureReason: null,
          retryCount: 0,
          lastOrderDate: scheduledDate,
          nextOrderDate,
        },
      }),
    ]);
    await createNotification(autoOrder.customerId, "Auto Order created", `${autoOrder.product.name} was reordered successfully.`);
    return { autoOrderId: autoOrder.id, orderId: order.id, success: true };
  } catch (error) {
    const status = error.autoOrderStatus || inferAutoOrderFailureStatus(error);
    const paymentStatus = status === "PAYMENT_FAILED" ? "FAILED" : "NOT_ATTEMPTED";
    const retryCount = autoOrder.retryCount + 1;
    const shouldRetry = status === "PAYMENT_FAILED" && retryCount <= MAX_RETRIES;
    const nextOrderDate = shouldRetry ? addDays(new Date(), RETRY_DELAY_DAYS) : autoOrder.nextOrderDate;

    await db.$transaction([
      db.autoOrderExecution.update({
        where: { id: execution.id },
        data: {
          processedAt: new Date(),
          status,
          paymentStatus,
          retryCount,
          failureReason: error.message,
        },
      }),
      db.autoOrder.update({
        where: { id: autoOrder.id },
        data: {
          status: shouldRetry ? "ACTIVE" : status,
          retryCount,
          nextOrderDate,
          failureReason: error.message,
        },
      }),
    ]);
    await createNotification(autoOrder.customerId, "Auto Order needs attention", error.message);
    return { autoOrderId: autoOrder.id, success: false, status, error: error.message };
  }
}

function inferAutoOrderFailureStatus(error) {
  const message = String(error?.message || "");
  if (/out of stock|only \d+ left|no longer available/i.test(message)) return "OUT_OF_STOCK";
  if (/prescription|vet verification|verified veterinarians/i.test(message)) return "PRESCRIPTION_REQUIRED";
  return "FAILED";
}

async function buildOrderPayload(autoOrder, db) {
  const customer = await db.customer.findUnique({ where: { id: autoOrder.customerId } });
  if (!customer || customer.status !== "Active") {
    throw statusError("FAILED", "Customer account is not active");
  }
  autoOrder.customer = customer;

  const product = await db.product.findFirst({ where: { id: autoOrder.productId, status: "Active" } });
  if (!product) throw statusError("FAILED", "Product is no longer available");
  autoOrder.product = product;

  if (product.prescriptionRequired) {
    throw statusError("PRESCRIPTION_REQUIRED", "A valid prescription is required before this auto order can run");
  }
  if (product.vetOnly && !customer.isVetVerified) {
    throw statusError("PRESCRIPTION_REQUIRED", "Vet verification is required before this auto order can run");
  }

  const address = getCustomerAddress(customer, autoOrder.shippingAddressIndex);
  return {
    items: [
      {
        productId: product.id,
        variantId: autoOrder.variantId,
        variantLabel: autoOrder.variantLabel,
        name: product.name,
        quantity: autoOrder.quantity,
        price: product.price,
      },
    ],
    shippingAddress: address,
    paymentMethod: "stripe",
  };
}

function buildStripeMetadata(autoOrder, execution) {
  const store = getCurrentStore();
  return {
    integration: "auto-order",
    autoOrderId: autoOrder.id,
    autoOrderExecutionId: execution.id,
    customerId: autoOrder.customerId,
    ...(store ? { storeId: store.id } : {}),
  };
}

function statusError(status, message) {
  const error = new ApiError(status === "PAYMENT_FAILED" ? 402 : 400, message);
  error.autoOrderStatus = status;
  return error;
}

async function createNotification(userId, title, message) {
  try {
    await notificationService.createNotification({
      recipient: "customer",
      userId,
      title,
      message,
      type: "auto_order",
    });
  } catch (error) {
    console.error("[AutoOrder] Notification failed", { userId, title, message: error.message });
  }
}

module.exports = {
  cancelCustomerAutoOrder,
  createPaymentSetupIntent,
  createCustomerAutoOrder,
  getAdminAutoOrder,
  getAutoOrderMetrics,
  getCustomerAutoOrder,
  listAdminAutoOrders,
  listCustomerAutoOrders,
  pauseCustomerAutoOrder,
  processDueAutoOrders,
  resumeCustomerAutoOrder,
  savePaymentMethodFromSetupIntent,
  updateAdminAutoOrder,
  updateCustomerAutoOrder,
};
