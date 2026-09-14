const Stripe = require("stripe");
const ApiError = require("../utils/apiError");

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

let stripeClient;
const localPaymentIntents = new Map();

function allowLocalPaymentFallback() {
  return process.env.NODE_ENV !== "production";
}

function isStripeConnectionError(error) {
  return (
    error?.type === "StripeConnectionError" ||
    error?.raw?.detail?.code === "EACCES" ||
    error?.detail?.code === "EACCES"
  );
}

function createLocalPaymentIntent(amount, currency = "usd", metadata = {}) {
  const normalizedCurrency = String(currency || "usd").toLowerCase();
  const minorAmount = toMinorUnit(amount, normalizedCurrency);
  const id = `pi_local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const intent = {
    id,
    client_secret: `${id}_secret_local`,
    amount: minorAmount,
    currency: normalizedCurrency,
    status: "succeeded",
    metadata,
    livemode: false,
    localFallback: true,
  };
  localPaymentIntents.set(id, intent);
  return intent;
}

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new ApiError(500, "Stripe secret key is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

function toMinorUnit(amount, currency = "usd") {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than zero");
  }

  const normalizedCurrency = String(currency || "usd").toLowerCase();
  const multiplier = ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency) ? 1 : 100;
  return Math.round(numericAmount * multiplier);
}

async function createPaymentIntent(amount, currency = "usd", metadata = {}, options = {}) {
  const normalizedCurrency = String(currency || "usd").toLowerCase();
  if (allowLocalPaymentFallback() && options.localFallback) {
    return createLocalPaymentIntent(amount, normalizedCurrency, metadata);
  }
  try {
    return await getStripe().paymentIntents.create({
      amount: toMinorUnit(amount, normalizedCurrency),
      currency: normalizedCurrency,
      automatic_payment_methods: { enabled: true },
      metadata,
    });
  } catch (error) {
    if (allowLocalPaymentFallback() && isStripeConnectionError(error)) {
      console.warn("[Stripe] Using local payment fallback because Stripe is unreachable", {
        message: error.message,
        code: error?.raw?.detail?.code || error?.detail?.code,
      });
      return createLocalPaymentIntent(amount, normalizedCurrency, metadata);
    }
    throw error;
  }
}

async function createOffSessionPaymentIntent(
  amount,
  currency = "usd",
  paymentMethod,
  customerId,
  metadata = {},
) {
  if (!paymentMethod || !customerId) {
    throw new ApiError(400, "A saved Stripe payment method and customer reference are required");
  }

  const normalizedCurrency = String(currency || "usd").toLowerCase();
  return getStripe().paymentIntents.create({
    amount: toMinorUnit(amount, normalizedCurrency),
    currency: normalizedCurrency,
    customer: customerId,
    payment_method: paymentMethod,
    off_session: true,
    confirm: true,
    metadata,
  });
}

async function createCustomer({ email, name, phone, metadata = {} } = {}) {
  return getStripe().customers.create({
    email: email || undefined,
    name: name || undefined,
    phone: phone || undefined,
    metadata,
  });
}

async function createSetupIntent(customerId, metadata = {}) {
  if (!customerId) {
    throw new ApiError(400, "Stripe customer reference is required");
  }

  return getStripe().setupIntents.create({
    customer: customerId,
    usage: "off_session",
    payment_method_types: ["card"],
    metadata,
  });
}

async function retrieveSetupIntent(setupIntentId) {
  if (!setupIntentId) {
    throw new ApiError(400, "Setup intent reference is required");
  }
  return getStripe().setupIntents.retrieve(setupIntentId);
}

async function updatePaymentIntentAmount(paymentIntentId, amount, currency = "usd", metadata = {}) {
  const intent = await retrievePaymentIntent(paymentIntentId);
  if (["succeeded", "processing", "canceled"].includes(intent.status)) {
    return intent;
  }

  const normalizedCurrency = String(currency || intent.currency || "usd").toLowerCase();
  if (intent.currency !== normalizedCurrency) {
    throw new ApiError(400, "Payment currency cannot be changed after the payment is created");
  }

  try {
    return await getStripe().paymentIntents.update(paymentIntentId, {
      amount: toMinorUnit(amount, normalizedCurrency),
      metadata: { ...intent.metadata, ...metadata },
    });
  } catch (error) {
    if (error?.type === "StripeInvalidRequestError" && /status of succeeded/i.test(error.message || "")) {
      return retrievePaymentIntent(paymentIntentId);
    }
    throw error;
  }
}

async function retrievePaymentIntent(paymentIntentId) {
  if (localPaymentIntents.has(paymentIntentId)) {
    return localPaymentIntents.get(paymentIntentId);
  }
  return getStripe().paymentIntents.retrieve(paymentIntentId);
}

function constructWebhookEvent(rawBody, signature) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError(500, "Stripe webhook secret is not configured");
  }
  return getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

module.exports = {
  createCustomer,
  createOffSessionPaymentIntent,
  createPaymentIntent,
  createSetupIntent,
  updatePaymentIntentAmount,
  retrievePaymentIntent,
  retrieveSetupIntent,
  constructWebhookEvent,
  toMinorUnit,
};
