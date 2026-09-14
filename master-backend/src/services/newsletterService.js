const { prisma } = require("../config/db");
const { getCurrentStore } = require("../config/tenantContext");
const ApiError = require("../utils/apiError");
const {
  getEmailBrand,
  sendNewsletterUpdateEmail,
  sendSubscriptionConfirmationEmail,
} = require("./emailService");

const DEFAULT_TOPICS = ["pet_essentials", "pet_care_tips", "offers"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function publicSubscriber(subscriber) {
  return {
    id: subscriber.id,
    email: subscriber.email,
    name: subscriber.name,
    status: subscriber.status,
    topics: subscriber.topics,
    confirmedAt: subscriber.confirmedAt,
    lastConfirmationEmailAt: subscriber.lastConfirmationEmailAt,
  };
}

async function subscribe({ email, name, source = "website" }) {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();
  let subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalizedEmail },
  });

  if (subscriber) {
    subscriber = await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        name: name?.trim() || subscriber.name,
        source: String(source || subscriber.source || "website").trim().slice(0, 80),
        status: "Active",
        topics: subscriber.topics?.length ? subscriber.topics : DEFAULT_TOPICS,
        confirmedAt: subscriber.confirmedAt || now,
        lastConfirmationEmailAt: now,
      },
    });
  } else {
    subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        source: String(source || "website").trim().slice(0, 80),
        topics: DEFAULT_TOPICS,
        confirmedAt: now,
        lastConfirmationEmailAt: now,
      },
    });
  }

  try {
    const confirmationEmail = await sendSubscriptionConfirmationEmail(subscriber, getEmailBrand());
    return {
      subscriber: publicSubscriber(subscriber),
      confirmationEmail,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(502, "Subscription saved, but the confirmation email could not be sent. Please check email settings.");
    }
    throw new ApiError(502, "Subscription saved, but the confirmation email could not be sent. Please try again.");
  }
}

async function sendUpdateToSubscribers({ subject, title, body, ctaText, ctaUrl }) {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { status: "Active" },
    orderBy: { createdAt: "asc" },
  });
  const brand = getEmailBrand();
  const results = [];

  for (const subscriber of subscribers) {
    try {
      const delivery = await sendNewsletterUpdateEmail({
        subscriber,
        subject,
        title,
        body,
        ctaText,
        ctaUrl,
      }, brand);
      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: { lastUpdateEmailAt: new Date() },
      });
      results.push({ id: subscriber.id, email: subscriber.email, delivered: true, messageId: delivery.messageId });
    } catch (error) {
      results.push({ id: subscriber.id, email: subscriber.email, delivered: false, error: error.message });
    }
  }

  return {
    total: subscribers.length,
    delivered: results.filter((item) => item.delivered).length,
    failed: results.filter((item) => !item.delivered).length,
    results,
  };
}

async function notifySubscribersOfNewProduct(product) {
  if (!product || product.status !== "Active") {
    return {
      total: 0,
      delivered: 0,
      failed: 0,
      results: [],
      skipped: true,
    };
  }

  const priceText = formatProductPrice(product);
  const categoryText = product.category?.name ? ` in ${product.category.name}` : "";
  return sendUpdateToSubscribers({
    subject: `New at ${getEmailBrand().name}: ${product.name}`,
    title: `New arrival${categoryText}: ${product.name}`,
    body: [
      `${product.name} is now available${categoryText}.`,
      priceText ? `Price: ${priceText}` : null,
      product.description ? stripHtml(product.description).slice(0, 220) : null,
    ].filter(Boolean).join("\n\n"),
    ctaText: "View product",
    ctaUrl: buildProductUrl(product),
  });
}

function buildProductUrl(product) {
  const store = getCurrentStore();
  const storeKey = String(store?.storeKey || "").trim().toUpperCase();
  const configured = String(
    (storeKey && process.env[`${storeKey}_PUBLIC_URL`]) ||
      process.env.STORE_PUBLIC_URL ||
      process.env.PUBLIC_STORE_BASE_URL ||
      process.env.FRONTEND_URL ||
      "",
  ).trim();
  const domain = configured || store?.primaryDomain || "";
  const base = domain
    ? (/^https?:\/\//i.test(domain) ? domain : `https://${domain}`)
    : "";
  const productId = encodeURIComponent(product.id);
  return base ? `${base.replace(/\/$/, "")}/product/${productId}` : `/product/${productId}`;
}

function formatProductPrice(product) {
  const value = Number(product.price);
  if (!Number.isFinite(value)) return "";
  return `$${value.toFixed(2)}`;
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

module.exports = {
  notifySubscribersOfNewProduct,
  sendUpdateToSubscribers,
  subscribe,
};
