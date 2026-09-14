const crypto = require("crypto");
const { prisma } = require("../config/db");
const { getCurrentStore } = require("../config/tenantContext");
const { generateId } = require("../utils/ids");
const { getRawSettings } = require("./settingsService");
const { getEmailBrand, sendAbandonedCartEmail } = require("./emailService");

const DEFAULT_SETTINGS = {
  abandonedCartEmailEnabled: false,
  abandonedCartDelayHours: 24,
  abandonedCartDiscountPercent: 10,
  abandonedCartMinimumAmount: 25,
  abandonedCartMaxEmails: 2,
};

async function processAbandonedCarts(db = prisma, options = {}) {
  await ensureAbandonedCartColumns(db);
  const settings = normalizeSettings(await getRawSettings(db).catch(() => null));
  if (!settings.abandonedCartEmailEnabled) {
    return { checked: 0, sent: 0, skipped: 0, failed: 0, reason: "disabled" };
  }

  const now = options.now || new Date();
  const cutoff = new Date(now.getTime() - settings.abandonedCartDelayHours * 60 * 60 * 1000);
  const candidates = await db.customer.findMany({
    where: {
      status: "Active",
      email: { not: "" },
      updatedAt: options.force ? undefined : { lte: cutoff },
      abandonedCartEmailCount: { lt: settings.abandonedCartMaxEmails },
    },
    orderBy: { updatedAt: "asc" },
    take: Number(options.limit || process.env.ABANDONED_CART_BATCH_SIZE || 50),
  });

  const coupon = await ensureRecoveryCoupon(db, settings);
  const brand = getEmailBrand(getCurrentStore());
  const checkoutUrl = buildCheckoutUrl(coupon.code);
  const result = { checked: candidates.length, sent: 0, skipped: 0, failed: 0, skipReasons: {} };

  for (const customer of candidates) {
    try {
      const items = normalizeCartItems(customer.cartItems);
      if (!items.length) {
        recordSkip(result, "empty_cart");
        result.skipped += 1;
        continue;
      }

      const cartTotal = cartSubtotal(items);
      if (cartTotal < settings.abandonedCartMinimumAmount) {
        recordSkip(result, "below_minimum");
        result.skipped += 1;
        continue;
      }

      const latestOrder = await db.order.findFirst({
        where: {
          customerId: customer.id,
          orderDate: { gte: customer.updatedAt },
        },
        select: { id: true },
      });
      if (latestOrder) {
        recordSkip(result, "order_after_cart_update");
        result.skipped += 1;
        continue;
      }

      const cartHash = hashCart(items);
      if (customer.abandonedCartEmailCartHash === cartHash && customer.abandonedCartEmailSentAt) {
        recordSkip(result, "already_sent_for_same_cart");
        result.skipped += 1;
        continue;
      }

      await sendAbandonedCartEmail({
        customer,
        items,
        coupon,
        cartTotal,
        checkoutUrl,
        brand,
      });

      await db.customer.update({
        where: { id: customer.id },
        data: {
          abandonedCartEmailSentAt: now,
          abandonedCartEmailCartHash: cartHash,
          abandonedCartEmailCount: { increment: 1 },
        },
      });
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      console.error("[AbandonedCart] Customer failed", {
        customerId: customer.id,
        email: customer.email,
        message: error.message,
      });
    }
  }

  return result;
}

function recordSkip(result, reason) {
  result.skipReasons[reason] = (result.skipReasons[reason] || 0) + 1;
}

async function ensureAbandonedCartColumns(db = prisma) {
  if (typeof db.$executeRawUnsafe !== "function") return;
  await db.$executeRawUnsafe(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "abandonedCartEmailSentAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "abandonedCartEmailCartHash" TEXT,
      ADD COLUMN IF NOT EXISTS "abandonedCartEmailCount" INTEGER NOT NULL DEFAULT 0
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "StoreSettings"
      ADD COLUMN IF NOT EXISTS "abandonedCartEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "abandonedCartDelayHours" DOUBLE PRECISION NOT NULL DEFAULT 24,
      ADD COLUMN IF NOT EXISTS "abandonedCartDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
      ADD COLUMN IF NOT EXISTS "abandonedCartMinimumAmount" DOUBLE PRECISION NOT NULL DEFAULT 25,
      ADD COLUMN IF NOT EXISTS "abandonedCartMaxEmails" INTEGER NOT NULL DEFAULT 2
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Customer_abandonedCartEmailSentAt_idx"
      ON "Customer"("abandonedCartEmailSentAt")
  `);
}

async function ensureRecoveryCoupon(db, settings) {
  const value = Math.max(1, Math.min(100, Math.floor(settings.abandonedCartDiscountPercent)));
  const code = `CARTSAVE${value}`;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  expiry.setHours(23, 59, 59, 999);

  const existing = await db.coupon.findUnique({ where: { code } }).catch(() => null);
  if (existing) {
    if (
      existing.status !== "Active" ||
      existing.type !== "percentage" ||
      Number(existing.value) !== value ||
      Number(existing.minOrder) !== settings.abandonedCartMinimumAmount
    ) {
      return db.coupon.update({
        where: { id: existing.id },
        data: {
          type: "percentage",
          value,
          minOrder: settings.abandonedCartMinimumAmount,
          maxUses: Math.max(existing.maxUses || 0, 1000),
          expiry,
          status: "Active",
        },
      });
    }
    return existing;
  }

  return db.coupon.create({
    data: {
      id: generateId("coupon"),
      code,
      type: "percentage",
      value,
      minOrder: settings.abandonedCartMinimumAmount,
      maxUses: 1000,
      expiry,
      status: "Active",
    },
  });
}

function normalizeSettings(settings = {}) {
  return {
    abandonedCartEmailEnabled: settings.abandonedCartEmailEnabled === true,
    abandonedCartDelayHours: Math.max(0.05, Number(settings.abandonedCartDelayHours ?? DEFAULT_SETTINGS.abandonedCartDelayHours) || DEFAULT_SETTINGS.abandonedCartDelayHours),
    abandonedCartDiscountPercent: Math.min(100, Math.max(0, Number(settings.abandonedCartDiscountPercent ?? DEFAULT_SETTINGS.abandonedCartDiscountPercent) || 0)),
    abandonedCartMinimumAmount: Math.max(0, Number(settings.abandonedCartMinimumAmount ?? DEFAULT_SETTINGS.abandonedCartMinimumAmount) || 0),
    abandonedCartMaxEmails: Math.max(0, Math.floor(Number(settings.abandonedCartMaxEmails ?? DEFAULT_SETTINGS.abandonedCartMaxEmails) || 0)),
  };
}

function normalizeCartItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      ...item,
      id: String(item.id || item.productId || item.slug || item.name || ""),
      name: item.name || item.productName || item.title || "Cart item",
      quantity: Math.max(1, Number(item.quantity) || 1),
      price: Math.max(0, Number(item.price) || 0),
    }))
    .filter((item) => item.id && item.quantity > 0);
}

function cartSubtotal(items) {
  return Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
}

function hashCart(items) {
  const stable = items
    .map((item) => ({
      id: item.id,
      variantId: item.variantId || item.selectedSize?.id || "",
      quantity: item.quantity,
      price: item.price,
    }))
    .sort((a, b) => `${a.id}:${a.variantId}`.localeCompare(`${b.id}:${b.variantId}`));
  return crypto.createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}

function buildCheckoutUrl(couponCode) {
  const store = getCurrentStore();
  const baseUrl = (
    process.env.STORE_PUBLIC_URL ||
    process.env.PUBLIC_STORE_URL ||
    (store?.primaryDomain ? `https://${store.primaryDomain}` : "")
  ).replace(/\/$/, "");

  if (!baseUrl) return "";
  const url = new URL("/checkout", baseUrl);
  if (couponCode) url.searchParams.set("coupon", couponCode);
  if (store?.storeKey) url.searchParams.set("storeKey", store.storeKey);
  return url.toString();
}

module.exports = {
  processAbandonedCarts,
  _test: {
    cartSubtotal,
    ensureAbandonedCartColumns,
    hashCart,
    normalizeCartItems,
    normalizeSettings,
  },
};
