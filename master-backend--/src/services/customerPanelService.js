const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { prisma } = require("../config/db");
const { getCurrentStore } = require("../config/tenantContext");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");
const { withCategoryThemeImage } = require("../utils/categoryThemeImages");
const {
  getEmailBrand,
  renderPrintableInvoicePage,
  sendOrderConfirmationEmail,
  sendRegistrationConfirmationEmail,
} = require("./emailService");
const { getRawSettings } = require("./settingsService");
const stripeService = require("./stripeService");
const taxService = require("./taxService");
const {
  findVariant,
  normalizeProduct,
  toMoney,
} = require("../utils/productCatalog");
const rewardService = require("./rewardService");

const SOCIAL_PROVIDERS = new Set(["google", "apple"]);
const googleOAuthClient = new OAuth2Client();

function base64UrlEncodeJson(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function base64UrlDecodeJson(value) {
  try {
    return JSON.parse(Buffer.from(String(value), "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

function decodeJwtPayload(token) {
  const payload = String(token || "").split(".")[1];
  if (!payload) return {};
  return base64UrlDecodeJson(payload);
}

function requireSocialProvider(provider) {
  const normalized = String(provider || "").trim().toLowerCase();
  if (!SOCIAL_PROVIDERS.has(normalized)) {
    throw new ApiError(400, "Unsupported social login provider");
  }
  return normalized;
}

function socialConfig(provider) {
  const prefix = provider.toUpperCase();
  return {
    clientId: process.env[`${prefix}_CLIENT_ID`],
    clientSecret: process.env[`${prefix}_CLIENT_SECRET`],
  };
}

function getSocialAuthRedirectUrl({ provider, redirectUri, frontendRedirectUri, mode = "login", storeKey, storeDomain }) {
  const normalizedProvider = requireSocialProvider(provider);
  if (!redirectUri) throw new ApiError(400, "Social auth redirectUri is required");

  const config = socialConfig(normalizedProvider);
  if (!config.clientId) {
    throw new ApiError(400, `${normalizedProvider} social login is not configured. Add ${normalizedProvider.toUpperCase()}_CLIENT_ID and ${normalizedProvider.toUpperCase()}_CLIENT_SECRET in backend .env.`);
  }

  const state = base64UrlEncodeJson({
    provider: normalizedProvider,
    frontendRedirectUri,
    mode,
    storeKey,
    storeDomain,
    nonce: generateId("oauth"),
  });

  if (normalizedProvider === "google") {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    return url.toString();
  }

  const url = new URL("https://appleid.apple.com/auth/authorize");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", "name email");
  url.searchParams.set("state", state);
  return url.toString();
}

async function postForm(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(400, data.error_description || data.error || "Social login token exchange failed");
  }
  return data;
}

async function exchangeGoogleCode({ code, redirectUri }) {
  const config = socialConfig("google");
  if (!config.clientId || !config.clientSecret) {
    throw new ApiError(400, "Google social login is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend .env.");
  }

  const tokenData = await postForm("https://oauth2.googleapis.com/token", {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  if (!tokenData.id_token) throw new ApiError(400, "Google did not return an identity token");
  let profile;
  try {
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokenData.id_token,
      audience: config.clientId,
    });
    profile = ticket.getPayload();
  } catch (error) {
    throw new ApiError(401, "Google identity token could not be verified");
  }

  if (!profile.email || profile.email_verified === false) {
    throw new ApiError(400, "Google account email is not verified");
  }

  return {
    providerId: profile.sub,
    email: String(profile.email).toLowerCase(),
    name: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ") || profile.email,
    avatar: profile.picture || null,
  };
}

async function exchangeAppleCode({ code, redirectUri }) {
  const config = socialConfig("apple");
  if (!config.clientId || !config.clientSecret) {
    throw new ApiError(400, "Apple social login is not configured. Add APPLE_CLIENT_ID and APPLE_CLIENT_SECRET in backend .env.");
  }

  const tokenData = await postForm("https://appleid.apple.com/auth/token", {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  if (!tokenData.id_token) throw new ApiError(400, "Apple did not return an identity token");
  const profile = decodeJwtPayload(tokenData.id_token);
  if (!profile.email) throw new ApiError(400, "Apple account email is required");

  return {
    email: String(profile.email).toLowerCase(),
    name: profile.name || String(profile.email).split("@")[0],
    avatar: null,
  };
}

async function findOrCreateSocialCustomer(profile) {
  let customer = await prisma.customer.findUnique({
    where: { email: profile.email },
    include: { _count: { select: { orders: true } } },
  });

  if (customer) {
    if (customer.status !== "Active") {
      const reason = customer.blockedReason || "Your account has been blocked. Please contact support.";
      const err = new ApiError(403, reason);
      err.blockedReason = reason;
      err.isBlocked = true;
      throw err;
    }

    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: customer.name || profile.name,
        avatar: customer.avatar || profile.avatar,
      },
      include: { _count: { select: { orders: true } } },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        id: generateId("customer"),
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        passwordHash: null,
        addresses: [],
      },
      include: { _count: { select: { orders: true } } },
    });
    await rewardService.grantSignupReward(customer.id).catch(() => null);
  }

  return {
    token: signCustomerToken(customer),
    customer: publicCustomer(customer),
  };
}

async function completeSocialAuth({ provider, code, state, redirectUri }) {
  const stateData = base64UrlDecodeJson(state);
  const normalizedProvider = requireSocialProvider(provider || stateData.provider);
  if (!code) throw new ApiError(400, "Social login code is required");
  if (!redirectUri) throw new ApiError(400, "Social auth redirectUri is required");

  const profile = normalizedProvider === "google"
    ? await exchangeGoogleCode({ code, redirectUri })
    : await exchangeAppleCode({ code, redirectUri });

  return findOrCreateSocialCustomer(profile);
}

function getFrontendSocialRedirectUri(state, fallback) {
  const stateData = base64UrlDecodeJson(state);
  return stateData.frontendRedirectUri || fallback;
}

function publicCustomer(customer) {
  const [firstName, ...rest] = customer.name.split(" ");
  const totalOrders = customer._count?.orders ?? undefined;
  const tier =
    totalOrders === undefined
      ? customer.tier || "Customer"
      : totalOrders >= 20
        ? "Premium Customer"
        : totalOrders >= 5
          ? "Regular Customer"
          : "New Customer";
  return {
    id: customer.id,
    name: customer.name,
    firstName,
    lastName: rest.join(" "),
    email: customer.email,
    phone: customer.phone,
    avatar: customer.avatar,
    addresses: parseAddresses(customer.addresses),
    status: customer.status,
    isVetVerified: Boolean(customer.isVetVerified),
    vetVerifiedAt: customer.vetVerifiedAt,
    vetVerification: customer.vetVerification || undefined,
    joined: customer.joined,
    tier,
    hasPassword: Boolean(customer.passwordHash),
    rewardPoints: Math.max(0, Number(customer.rewardPoints || 0)),
  };
}

function signCustomerToken(customer) {
  const store = getCurrentStore();
  return jwt.sign(
    {
      id: customer.id,
      email: customer.email,
      type: "customer",
      ...(store ? { storeId: store.id } : {}),
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

async function register(payload) {
  const emailBrand = getEmailBrand();
  const existing = await prisma.customer.findUnique({
    where: { email: payload.email },
  });
  if (existing)
    throw new ApiError(409, "Registration could not be completed. If you already have an account, please log in.");

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const customer = await prisma.customer.create({
    data: {
      id: generateId("customer"),
      name: payload.name,
      email: payload.email,
      passwordHash,
      phone: payload.phone,
      avatar: payload.avatar,
      addresses: serializeAddresses(payload.addresses),
    },
    include: { _count: { select: { orders: true } } },
  });
  await rewardService.grantSignupReward(customer.id).catch(() => null);
  const registrationEmail = await deliverRegistrationConfirmationEmail(customer, emailBrand);

  return {
    token: signCustomerToken(customer),
    customer: publicCustomer(customer),
    registrationEmail,
  };
}

async function login({ email, password }) {
  const customer = await prisma.customer.findUnique({
    where: { email },
    include: { _count: { select: { orders: true } } },
  });
  if (!customer || !customer.passwordHash) {
    throw new ApiError(401, "Invalid email or password");
  }

  const matches = await bcrypt.compare(password, customer.passwordHash);
  if (!matches) throw new ApiError(401, "Invalid email or password");
  if (customer.status !== "Active") {
    const reason = customer.blockedReason || "Your account has been blocked. Please contact support.";
    const err = new ApiError(403, reason);
    err.blockedReason = reason;
    err.isBlocked = true;
    throw err;
  }

  return {
    token: signCustomerToken(customer),
    customer: publicCustomer(customer),
  };
}

async function checkoutContact({ name, email, phone }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  const normalizedPhone = phone.trim();

  let customer = await prisma.customer.findUnique({
    where: { email: normalizedEmail },
    include: { _count: { select: { orders: true } } },
  });

  if (customer) {
    if (customer.status !== "Active") {
      throw new ApiError(403, "Customer account is inactive");
    }

    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: customer.name || normalizedName,
        phone: customer.phone || normalizedPhone,
      },
      include: { _count: { select: { orders: true } } },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        id: generateId("customer"),
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash: null,
        addresses: [],
      },
      include: { _count: { select: { orders: true } } },
    });
    await rewardService.grantSignupReward(customer.id).catch(() => null);
  }

  return {
    token: signCustomerToken(customer),
    customer: publicCustomer(customer),
  };
}

async function getProfile(customer) {
  const freshCustomer = await prisma.customer.findUnique({
    where: { id: customer.id },
    include: { vetVerification: true, _count: { select: { orders: true } } },
  });
  return publicCustomer(freshCustomer || customer);
}

async function getCart(customer) {
  return getCustomerCollection(customer.id, "cartItems");
}

async function syncCart(customer, items = []) {
  return updateCustomerCollection(
    customer.id,
    "cartItems",
    normalizeCollectionItems(items).map((item) => ({
      ...item,
      quantity: clampCartQuantity(item.quantity || 1, item),
    })),
  );
}

async function addCartItem(customer, item) {
  const nextItems = mergeCartItems(
    await getCart(customer),
    normalizeCollectionItem(item),
  );
  return updateCustomerCollection(customer.id, "cartItems", nextItems);
}

async function updateCartItem(customer, itemId, payload) {
  const items = await getCart(customer);
  const nextItems = items.map((item) =>
    item.id === itemId || item.slug === itemId || item.productId === itemId
      ? { ...item, quantity: clampCartQuantity(payload.quantity, item) }
      : item,
  );
  return updateCustomerCollection(customer.id, "cartItems", nextItems);
}

async function removeCartItem(customer, itemId) {
  const items = await getCart(customer);
  const nextItems = items.filter(
    (item) =>
      item.id !== itemId && item.slug !== itemId && item.productId !== itemId,
  );
  return updateCustomerCollection(customer.id, "cartItems", nextItems);
}

async function clearCartItems(customer) {
  return updateCustomerCollection(customer.id, "cartItems", []);
}

async function getWishlist(customer) {
  return getCustomerCollection(customer.id, "wishlistItems");
}

async function syncWishlist(customer, items = []) {
  return updateCustomerCollection(
    customer.id,
    "wishlistItems",
    normalizeCollectionItems(items),
  );
}

async function addWishlistItem(customer, item) {
  const normalizedItem = normalizeCollectionItem(item);
  const items = await getWishlist(customer);
  const exists = items.some(
    (wishlistItem) =>
      wishlistItem.id === normalizedItem.id ||
      wishlistItem.slug === normalizedItem.slug ||
      wishlistItem.productId === normalizedItem.productId,
  );
  const nextItems = exists ? items : [normalizedItem, ...items];
  return updateCustomerCollection(customer.id, "wishlistItems", nextItems);
}

async function removeWishlistItem(customer, itemId) {
  const items = await getWishlist(customer);
  const nextItems = items.filter(
    (item) =>
      item.id !== itemId && item.slug !== itemId && item.productId !== itemId,
  );
  return updateCustomerCollection(customer.id, "wishlistItems", nextItems);
}

async function clearWishlistItems(customer) {
  return updateCustomerCollection(customer.id, "wishlistItems", []);
}

async function getDashboard(customer) {
  const [orders, rewards, petCount, repeatDeliveryCount] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { orderDate: "desc" },
    }),
    rewardService.getRewardOverview(customer.id).catch(() => null),
    prisma.pet.count({ where: { customerId: customer.id } }).catch(() => 0),
    prisma.autoOrder.count({ where: { customerId: customer.id, status: { notIn: ["CANCELLED", "COMPLETED"] } } }).catch(() => 0),
  ]);

  const statusSummary = buildStatusSummary(orders);
  const pendingOrders = orders.filter((order) =>
    ["Pending", "Processing", "Confirmed"].includes(order.orderStatus),
  ).length;
  const deliveredOrders = statusSummary.Delivered || 0;

  return {
    customer: publicCustomer(customer),
    stats: {
      totalOrders: orders.length,
      pendingOrders,
      deliveredOrders,
      savedAddresses: customer.addresses.length,
      rewardPoints: rewards?.balance || Math.max(0, Number(customer.rewardPoints || 0)),
      petCount,
      repeatDeliveryCount,
    },
    rewards,
    recentOrders: orders.slice(0, 6).map(formatDashboardOrder),
    statusSummary,
  };
}

async function getRewards(customer) {
  return rewardService.getRewardOverview(customer.id);
}

async function updateProfile(customerId, payload) {
  const data = {};
  const name =
    payload.name ||
    [payload.firstName, payload.lastName].filter(Boolean).join(" ");

  if (name) data.name = name;
  if (payload.email !== undefined) data.email = payload.email;
  if (payload.phone !== undefined)
    data.phone = payload.phone === "" ? null : payload.phone;
  if (payload.avatar !== undefined) data.avatar = payload.avatar;

  try {
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data,
      include: { _count: { select: { orders: true } } },
    });
    return publicCustomer(customer);
  } catch (error) {
    if (error.code === "P2002") {
      throw new ApiError(409, "Customer with this email already exists");
    }
    throw error;
  }
}

async function updateAvatar(customer, avatarUrl, db = prisma) {
  const updated = await db.customer.update({
    where: { id: customer.id },
    data: { avatar: avatarUrl },
    include: { _count: { select: { orders: true } } },
  });
  return publicCustomer(updated);
}

function listAddresses(customer) {
  return parseAddresses(customer.addresses);
}

async function listPets(customer) {
  return prisma.pet.findMany({
    where: { customerId: customer.id },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
}

async function addPet(customer, payload) {
  return prisma.pet.create({
    data: {
      customerId: customer.id,
      ...normalizePetPayload(payload),
    },
  });
}

async function updatePet(customer, id, payload) {
  const pet = await prisma.pet.findFirst({ where: { id, customerId: customer.id } });
  if (!pet) throw new ApiError(404, "Pet not found");

  return prisma.pet.update({
    where: { id },
    data: normalizePetPayload(payload),
  });
}

async function deletePet(customer, id) {
  const pet = await prisma.pet.findFirst({ where: { id, customerId: customer.id } });
  if (!pet) throw new ApiError(404, "Pet not found");
  await prisma.pet.delete({ where: { id } });
  return pet;
}

async function addAddress(customer, address) {
  const addresses = [...customer.addresses, serializeAddress(address)];
  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: { addresses },
  });
  return parseAddresses(updated.addresses);
}

async function updateAddress(customer, index, address) {
  ensureAddressIndex(customer.addresses, index);
  const addresses = [...customer.addresses];
  addresses[index] = serializeAddress(address);

  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: { addresses },
  });
  return parseAddresses(updated.addresses);
}

async function removeAddress(customer, index) {
  ensureAddressIndex(customer.addresses, index);
  const addresses = customer.addresses.filter(
    (_, itemIndex) => itemIndex !== index,
  );
  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: { addresses },
  });
  return parseAddresses(updated.addresses);
}

async function listOrders(customerId) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { orderDate: "desc" },
  });
}

async function getOrder(customerId, id) {
  const order = await prisma.order.findFirst({ where: { id, customerId } });
  if (!order) throw new ApiError(404, "Order not found");
  return order;
}

async function getOrderInvoice(customerId, id) {
  const order = await getOrder(customerId, id);
  return renderPrintableInvoicePage(order, getEmailBrand());
}

async function cancelOrder(customerId, id) {
  const order = await getOrder(customerId, id);
  if (order.orderStatus === "Cancelled") {
    throw new ApiError(400, "Order is already cancelled");
  }
  if (order.orderStatus === "Delivered") {
    throw new ApiError(400, "Delivered orders cannot be cancelled");
  }
  if (order.orderStatus === "Shipped") {
    throw new ApiError(
      400,
      "Shipped orders cannot be cancelled. Please contact support.",
    );
  }
  if (order.shipmentStatus === "OutForDelivery") {
    throw new ApiError(
      400,
      "Order is out for delivery and cannot be cancelled. Please contact support.",
    );
  }

  return prisma.order.update({
    where: { id: order.id },
    data: {
      orderStatus: "Cancelled",
      paymentStatus:
        order.paymentStatus === "Paid" ? "Refunded" : order.paymentStatus,
      timeline: [...(order.timeline || []), "Order cancelled by customer"],
    },
  });
}

async function createOrder(customer, payload) {
  const emailBrand = getEmailBrand();
  const shippingAddress = payload.shippingAddress || {};
  const shippingPhone = getAddressField(shippingAddress, [
    "phone",
    "phoneNumber",
    "mobile",
  ]);
  const shippingName = getAddressField(shippingAddress, ["fullName", "name"]);
  const customerName = String(
    customer?.name || payload.fullName || shippingName || "",
  ).trim();
  const customerEmail = String(customer?.email || payload.email || "").trim();
  const contactPhone = String(
    payload.phone || shippingPhone || customer?.phone || "",
  ).trim();

  if (!customer?.id) {
    throw new ApiError(401, "Customer session is required to create an order");
  }
  if (!customerName) {
    throw new ApiError(400, "Customer name is required to create an order");
  }
  if (!customerEmail) {
    throw new ApiError(400, "Customer email is required to create an order");
  }
  if (!contactPhone) {
    throw new ApiError(400, "Shipping phone is required");
  }

  if (payload.paymentMethod === "stripe" && payload.stripePaymentIntentId) {
    const existingOrder = await prisma.order.findUnique({
      where: { stripePaymentIntentId: payload.stripePaymentIntentId },
    });
    if (existingOrder) {
      if (existingOrder.customerId !== customer.id) {
        throw new ApiError(403, "This payment belongs to another customer");
      }
      const confirmationEmail =
        await deliverOrderConfirmationEmail(existingOrder, emailBrand);
      return withConfirmationEmail(existingOrder, confirmationEmail);
    }
  }

  const {
    resolvedOrder,
    subtotal,
    shipping,
    tax,
    total,
    discount,
    appliedCouponId,
    rewardRedemption,
    rewardEarnPoints,
  } = await calculateCheckoutPricing(payload, customer);

  const needsPrescription = resolvedOrder.items.some((item) => item.prescriptionRequired);
  const needsVetVerification = resolvedOrder.items.some((item) => item.vetOnly);
  if (needsVetVerification && !customer.isVetVerified) {
    throw new ApiError(403, "This product is available only for verified veterinarians.");
  }
  const hasPrescription =
    (Array.isArray(payload.prescriptions) && payload.prescriptions.some((p) => p.url)) ||
    Boolean(payload.prescriptionUrl);
  if (needsPrescription && !hasPrescription) {
    throw new ApiError(400, "Please upload a prescription to continue with this order");
  }

  let paymentStatus = "Pending";

  if (payload.paymentMethod === "stripe") {
    if (!payload.stripePaymentIntentId) {
      throw new ApiError(400, "Missing Stripe payment confirmation");
    }

    const existingOrder = await prisma.order.findUnique({
      where: { stripePaymentIntentId: payload.stripePaymentIntentId },
    });
    if (existingOrder) {
      if (existingOrder.customerId !== customer.id) {
        throw new ApiError(403, "This payment belongs to another customer");
      }
      const confirmationEmail =
        await deliverOrderConfirmationEmail(existingOrder, emailBrand);
      return withConfirmationEmail(existingOrder, confirmationEmail);
    }

    let intent;
    try {
      intent = await stripeService.retrievePaymentIntent(
        payload.stripePaymentIntentId,
      );
    } catch (error) {
      throw new ApiError(
        400,
        "Payment could not be verified. Please complete payment again.",
      );
    }
    const expectedAmount = toStripeMinorUnit(total);
    const expectedCurrency = getStripeCurrency();
    const amountDifference = Math.abs(intent.amount - expectedAmount);
    const verificationFailures = [];

    if (intent.status !== "succeeded") {
      verificationFailures.push(`status is ${intent.status}`);
    }
    if (intent.currency !== expectedCurrency) {
      verificationFailures.push(
        `currency is ${intent.currency}, expected ${expectedCurrency}`,
      );
    }
    if (amountDifference > 1) {
      verificationFailures.push(
        `amount is ${intent.amount}, expected ${expectedAmount}`,
      );
    }

    if (verificationFailures.length) {
      throw new ApiError(
        400,
        `Payment could not be verified: ${verificationFailures.join("; ")}`,
      );
    }
    paymentStatus = "Paid";
  }

  const order = await prisma.$transaction(async (tx) => {
    await reserveStockForOrderItems(tx, resolvedOrder.items);
    const orderId = generateId("order");

    const createdOrder = await tx.order.create({
      data: {
        id: orderId,
        customerId: customer.id,
        customerName,
        email: customerEmail,
        phone: contactPhone,
        subtotal,
        shipping,
        tax,
        discount,
        total,
        paymentStatus,
        paymentMethod: payload.paymentMethod,
        stripePaymentIntentId: payload.stripePaymentIntentId || null,
        shippingAddress: serializeAddress(shippingAddress),
        prescriptionUrl: payload.prescriptionUrl || (Array.isArray(payload.prescriptions) && payload.prescriptions[0]?.url) || null,
        prescriptions: Array.isArray(payload.prescriptions) && payload.prescriptions.length ? payload.prescriptions : undefined,
        items: resolvedOrder.items,
        timeline: ["Order placed by customer"],
      },
    });

    if (appliedCouponId) {
      await tx.coupon.update({
        where: { id: appliedCouponId },
        data: { usageCount: { increment: 1 } },
      });
    }

    if (rewardRedemption.points > 0) {
      await rewardService.redeemPoints({
        customerId: customer.id,
        points: rewardRedemption.points,
        orderId,
        amount: rewardRedemption.amount,
      }, tx);
    }

    if (rewardEarnPoints > 0) {
      await rewardService.addPoints({
        customerId: customer.id,
        points: rewardEarnPoints,
        type: "purchase",
        orderId,
        description: `Earned ${rewardEarnPoints} reward points from order ${orderId}`,
        metadata: { orderTotal: total, taxableAmount: Math.max(0, subtotal - discount) },
      }, tx);
    }

    return createdOrder;
  });

  const confirmationEmail = await deliverOrderConfirmationEmail(order, emailBrand);

  return withConfirmationEmail(order, confirmationEmail);
}

async function deliverOrderConfirmationEmail(order, brand = getEmailBrand()) {
  try {
    return await sendOrderConfirmationEmail(order, brand);
  } catch (error) {
    console.error(`[${brand.name}] Order confirmation email failed`, {
      orderId: order.id,
      to: order.email,
      message: error.message,
    });

    return {
      delivered: false,
      error: "Order email could not be sent. Please check SMTP configuration.",
    };
  }
}

async function deliverRegistrationConfirmationEmail(customer, brand = getEmailBrand()) {
  try {
    return await sendRegistrationConfirmationEmail(customer, brand);
  } catch (error) {
    console.error(`[${brand.name}] Registration confirmation email failed`, {
      customerId: customer.id,
      to: customer.email,
      message: error.message,
    });

    return {
      delivered: false,
      error: "Registration email could not be sent. Please check SMTP configuration.",
    };
  }
}

function withConfirmationEmail(order, confirmationEmail) {
  return {
    ...order,
    confirmationEmail,
  };
}

async function createPaymentIntent(customer, amount, currency, options = {}) {
  const paymentCurrency = getStripeCurrency();
  const store = getCurrentStore();
  const intent = await stripeService.createPaymentIntent(
    amount,
    paymentCurrency,
    {
      customerId: customer.id,
      customerEmail: customer.email,
      integration: "customer-panel-checkout",
      ...(store ? { storeId: store.id } : {}),
    },
    { localFallback: options.localFallback },
  );
  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    status: intent.status,
    localFallback: Boolean(intent.localFallback),
  };
}

async function calculateCheckoutPricing(payload, customer = null) {
  const resolvedOrder = await resolveOrderItems(payload.items);
  const { resolveShippingCharge } = require("./shipmentChargeService");
  const autoShipping = await resolveShippingCharge(resolvedOrder.subtotal).catch(() => 0);
  const shipping = toMoney(payload.shipping ?? payload.shippingCost ?? autoShipping);
  const cartDiscount = toMoney(payload.discount ?? 0);
  const requestedCouponDiscount = toMoney(
    payload.couponDiscount ?? payload.promoDiscount ?? 0,
  );
  const subtotal = resolvedOrder.subtotal;
  const activeTax = await taxService.getActive();
  const taxRate = Number(activeTax?.rate || 0);

  const effectiveCartDiscount =
    payload.couponCode &&
    requestedCouponDiscount > 0 &&
    Math.abs(cartDiscount - requestedCouponDiscount) <= 0.02
      ? 0
      : cartDiscount;
  let discount = effectiveCartDiscount;
  let appliedCouponId = null;
  let couponDiscount = 0;
  const couponBaseAmount = toMoney(Math.max(0, subtotal - effectiveCartDiscount));

  if (payload.couponCode) {
    const coupon = await getValidCoupon(payload.couponCode, couponBaseAmount);
    couponDiscount = calculateCouponDiscount(coupon, couponBaseAmount);

    if (
      requestedCouponDiscount > 0 &&
      Math.abs(requestedCouponDiscount - couponDiscount) > 0.02
    ) {
      throw new ApiError(
        400,
        "Coupon discount changed. Please refresh checkout and apply the coupon again.",
      );
    }

    discount = toMoney(effectiveCartDiscount + couponDiscount);
    appliedCouponId = coupon.id;
  } else if (requestedCouponDiscount > 0) {
    throw new ApiError(400, "Coupon code is required for the applied discount");
  }

  const preRewardTaxableAmount = toMoney(Math.max(0, subtotal - discount));
  const rewardSettings = await rewardService.getRewardSettings();
  const rewardBalance = customer?.id
    ? await rewardService.getCustomerBalance(customer.id).catch(() => 0)
    : 0;
  const rewardRedemption = rewardService.calculateRedemption({
    requestedPoints: payload.rewardPointsToRedeem,
    balance: rewardBalance,
    eligibleAmount: preRewardTaxableAmount,
    settings: rewardSettings,
  });
  const rewardDiscount = rewardRedemption.amount;

  discount = toMoney(discount + rewardDiscount);
  const taxableAmount = toMoney(Math.max(0, subtotal - discount));
  const tax = toMoney((taxableAmount * taxRate) / 100);
  const total = toMoney(Math.max(0, taxableAmount + shipping + tax));
  const rewardEarnPoints = rewardService.calculateEarnPoints(taxableAmount, rewardSettings);

  return {
    resolvedOrder,
    items: resolvedOrder.items,
    subtotal,
    shipping,
    taxRate,
    tax,
    taxableAmount,
    total,
    discount,
    couponDiscount,
    rewardDiscount,
    rewardRedemption,
    rewardEarnPoints,
    rewardBalance,
    rewardSettings,
    cartDiscount: effectiveCartDiscount,
    appliedCouponId,
  };
}

async function getCheckoutQuote(payload, customer) {
  const quote = await calculateCheckoutPricing(payload, customer);
  return {
    items: quote.items,
    subtotal: quote.subtotal,
    shipping: quote.shipping,
    discount: quote.discount,
    couponDiscount: quote.couponDiscount,
    taxRate: quote.taxRate,
    tax: quote.tax,
    taxableAmount: quote.taxableAmount,
    total: quote.total,
    rewardDiscount: quote.rewardDiscount,
    rewardRedemption: quote.rewardRedemption,
    rewardEarnPoints: quote.rewardEarnPoints,
    rewardBalance: quote.rewardBalance,
    rewardSettings: quote.rewardSettings,
  };
}

async function updatePaymentIntent(
  customer,
  paymentIntentId,
  amount,
  currency,
) {
  const currentIntent =
    await stripeService.retrievePaymentIntent(paymentIntentId);
  if (
    currentIntent.metadata?.customerId &&
    currentIntent.metadata.customerId !== customer.id
  ) {
    throw new ApiError(403, "This payment belongs to another customer");
  }

  const paymentCurrency = getStripeCurrency();
  if (currentIntent.currency !== paymentCurrency) {
    throw new ApiError(
      400,
      "Payment currency does not match USD checkout. Please refresh checkout and try again",
    );
  }

  const store = getCurrentStore();
  const intent = await stripeService.updatePaymentIntentAmount(
    paymentIntentId,
    amount,
    paymentCurrency,
    {
      customerId: customer.id,
      customerEmail: customer.email,
      integration: "customer-panel-checkout",
      ...(store ? { storeId: store.id } : {}),
    },
  );
  return {
    paymentIntentId: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    status: intent.status,
  };
}

async function validateCoupon({ code, subtotal, discount }) {
  const normalizedSubtotal = toMoney(subtotal ?? 0);
  const normalizedDiscount = toMoney(discount ?? 0);
  const couponBaseAmount = Math.max(0, normalizedSubtotal - normalizedDiscount);
  const coupon = await getValidCoupon(code, couponBaseAmount);
  const discountAmount = calculateCouponDiscount(coupon, couponBaseAmount);

  return {
    code: coupon.code,
    discountAmount,
    discount: discountAmount,
    type: coupon.type,
    value: coupon.value,
    minOrder: coupon.minOrder,
    expiry: coupon.expiry,
    subtotal: normalizedSubtotal,
    eligibleSubtotal: couponBaseAmount,
  };
}

async function listCoupons() {
  const timezone = await getCouponTimezone();
  const coupons = await prisma.coupon.findMany({
    where: {
      status: "Active",
    },
    orderBy: { createdAt: "desc" },
  });

  const expiredCoupons = coupons.filter((coupon) => isCouponExpired(coupon.expiry, timezone));
  if (expiredCoupons.length) {
    await prisma.coupon.updateMany({
      where: { id: { in: expiredCoupons.map((coupon) => coupon.id) } },
      data: { status: "Inactive" },
    });
  }

  return coupons
    .filter((coupon) => coupon.usageCount < coupon.maxUses && !expiredCoupons.some((expired) => expired.id === coupon.id))
    .map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder,
      expiry: coupon.expiry,
      remainingUses: Math.max(0, coupon.maxUses - coupon.usageCount),
    }));
}

const CATALOG_SORT_OPTIONS = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
};

function getCatalogDisplayPrice(product = {}) {
  const activeVariantPrices = (product.optionVariants || [])
    .filter((variant) => variant.status === "Active" && variant.inventory?.isInStock)
    .map((variant) => Number(variant.pricing?.finalPrice ?? variant.price))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (activeVariantPrices.length) return Math.min(...activeVariantPrices);

  const price = Number(product.pricing?.finalPrice ?? product.price);
  return Number.isFinite(price) ? price : 0;
}

function isWithinCatalogPriceRange(product, minPrice, maxPrice) {
  const price = getCatalogDisplayPrice(product);
  const min = minPrice !== undefined && minPrice !== "" ? Number(minPrice) : null;
  const max = maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : null;

  if (min !== null && Number.isFinite(min) && price < min) return false;
  if (max !== null && Number.isFinite(max) && price > max) return false;
  return true;
}

function isWithinCatalogAvailability(product, inStock) {
  if (inStock === "true") return product.inventory?.isInStock === true;
  if (inStock === "false") return product.inventory?.isInStock === false;
  return true;
}

function isWithinCatalogSearch(product, q) {
  const term = String(q || "").trim().toLowerCase();
  if (!term) return true;
  const values = [
    product.name,
    product.slug,
    product.sku,
    product.petType,
    product.description,
    product.category?.name,
    ...(product.optionVariants || []).flatMap((variant) => [
      variant.label,
      variant.sku,
      variant.familyVariantName,
      variant.packLabel,
      variant.size,
      variant.weightRange,
      variant.dose,
    ]),
    ...(product.familyVariants || []).flatMap((variant) => [
      variant.name,
      variant.displayName,
      variant.slug,
      variant.strength,
      variant.weightRange,
      variant.packColor,
      ...(variant.skus || []).flatMap((sku) => [sku.packLabel, sku.sku]),
    ]),
  ];
  return values.some((value) => String(value || "").toLowerCase().includes(term));
}

function sortCatalogProducts(products, sort) {
  if (sort === "price_asc") {
    return products.sort((a, b) => getCatalogDisplayPrice(a) - getCatalogDisplayPrice(b));
  }
  if (sort === "price_desc") {
    return products.sort((a, b) => getCatalogDisplayPrice(b) - getCatalogDisplayPrice(a));
  }
  return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function addCatalogReviewStats(items = []) {
  const ids = items.map((p) => p.id);
  const reviewAggs = ids.length
    ? await prisma.productReview.groupBy({
        by: ["productId"],
        where: { productId: { in: ids } },
        _avg: { rating: true },
        _count: { id: true },
      })
    : [];
  const aggMap = Object.fromEntries(reviewAggs.map((a) => [a.productId, a]));

  return items.map((product) => {
    const normalized = product.pricing ? product : normalizeProduct(product);
    const agg = aggMap[normalized.id];
    normalized.reviewCount = agg?._count.id ?? 0;
    normalized.averageRating = agg?._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0;
    return normalized;
  });
}

function catalogVisibilityWhere(inStock) {
  if (inStock === "true") {
    return { status: "Active" };
  }
  if (inStock === "false") {
    return { status: "Active" };
  }
  return { status: "Active" };
}

function validatePassword(value) {
  const password = String(value || "");
  if (password.length < 8) throw new ApiError(400, "Password must contain at least 8 characters");
  if (password.length > 72) throw new ApiError(400, "Password must not exceed 72 characters");
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new ApiError(400, "Password must include uppercase, lowercase, and number characters");
  }
  return password;
}

async function checkLoginMethod({ email }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const customer = await prisma.customer.findUnique({
    where: { email: normalizedEmail },
    select: { passwordHash: true },
  });
  return { hasPassword: Boolean(customer?.passwordHash) };
}

async function getPasswordStatus(customer) {
  const freshCustomer = await prisma.customer.findUnique({
    where: { id: customer.id },
    select: { passwordHash: true },
  });
  return { hasPassword: Boolean(freshCustomer?.passwordHash) };
}

async function setPassword(customer, payload) {
  const password = validatePassword(payload.password);
  if (password !== payload.confirmPassword) throw new ApiError(400, "Passwords do not match");

  const freshCustomer = await prisma.customer.findUnique({ where: { id: customer.id } });
  if (!freshCustomer) throw new ApiError(404, "Customer not found");
  if (freshCustomer.passwordHash) throw new ApiError(400, "Password is already set. Use change password instead.");

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.customer.update({ where: { id: customer.id }, data: { passwordHash } });
  return { hasPassword: true };
}

async function changePassword(customer, payload) {
  const newPassword = validatePassword(payload.newPassword || payload.password);
  const confirmPassword = payload.confirmPassword || payload.newPasswordConfirm;
  if (newPassword !== confirmPassword) throw new ApiError(400, "Passwords do not match");

  const freshCustomer = await prisma.customer.findUnique({ where: { id: customer.id } });
  if (!freshCustomer) throw new ApiError(404, "Customer not found");

  if (!freshCustomer.passwordHash) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.customer.update({ where: { id: customer.id }, data: { passwordHash } });
    return { hasPassword: true };
  }

  const matches = await bcrypt.compare(String(payload.currentPassword || ""), freshCustomer.passwordHash);
  if (!matches) throw new ApiError(400, "Current password is incorrect");
  const reusesCurrentPassword = await bcrypt.compare(newPassword, freshCustomer.passwordHash);
  if (reusesCurrentPassword) throw new ApiError(400, "New password must be different from the current password");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.customer.update({ where: { id: customer.id }, data: { passwordHash } });
  return { hasPassword: true };
}

async function resetPassword(customerId, payload) {
  const password = validatePassword(payload.password);
  if (password !== payload.confirmPassword) throw new ApiError(400, "Passwords do not match");
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.customer.update({ where: { id: customerId }, data: { passwordHash } });
  return { hasPassword: true };
}

async function listCatalogProducts({
  q,
  category,
  categoryId,
  page,
  limit,
  sort,
  minPrice,
  maxPrice,
  inStock,
  petType,
} = {}) {
  const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * take;

  const searchWhere = undefined;
  const where = {
    AND: [catalogVisibilityWhere(inStock), searchWhere].filter(Boolean),
    categoryId: categoryId || undefined,
    category: category ? { name: category } : undefined,
    petType: petType ? { equals: petType, mode: "insensitive" } : undefined,
  };
  const usesDisplayPrice =
    Boolean(q) ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    sort === "price_asc" ||
    sort === "price_desc" ||
    inStock === "true" ||
    inStock === "false";

  if (!usesDisplayPrice) {
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: CATALOG_SORT_OPTIONS[sort] || CATALOG_SORT_OPTIONS.newest,
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: await addCatalogReviewStats(items.map((product) => normalizeProduct(product))),
      total,
      page: currentPage,
      limit: take,
      totalPages: Math.max(Math.ceil(total / take), 1),
    };
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: CATALOG_SORT_OPTIONS[sort] || CATALOG_SORT_OPTIONS.newest,
  });
  const normalizedItems = sortCatalogProducts(
    products
      .map((product) => normalizeProduct(product))
      .filter((product) => isWithinCatalogSearch(product, q))
      .filter((product) => isWithinCatalogAvailability(product, inStock))
      .filter((product) => isWithinCatalogPriceRange(product, minPrice, maxPrice)),
    sort,
  );
  const total = normalizedItems.length;
  const pagedItems = normalizedItems.slice(skip, skip + take);

  return {
    items: await addCatalogReviewStats(pagedItems),
    total,
    page: currentPage,
    limit: take,
    totalPages: Math.max(Math.ceil(total / take), 1),
  };
}

async function getCatalogProduct(id) {
  const product = await prisma.product.findFirst({
    where: {
      AND: [
        { OR: [{ id }, { slug: id }] },
        {
          OR: [
            { status: "Active" },
            { stock: { lte: 0 } },
          ],
        },
      ],
    },
    include: { category: true },
  });
  if (!product) throw new ApiError(404, "Product not found");
  const reviewAgg = await prisma.productReview.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { id: true },
  });
  const normalized = normalizeProduct(product);
  normalized.reviewCount = reviewAgg._count.id;
  normalized.averageRating = reviewAgg._avg.rating ? Math.round(reviewAgg._avg.rating * 10) / 10 : 0;
  return normalized;
}

async function getCatalogProductVariant(productSlug, variantSlug) {
  const product = await getCatalogProduct(productSlug);
  const variant = (product.familyVariants || []).find(
    (item) => item.slug === variantSlug || item.id === variantSlug,
  );
  if (!variant) throw new ApiError(404, "Variant not found");
  return { product, variant };
}

async function listCatalogCategories() {
  const categories = await prisma.category.findMany({
    where: { status: "Active" },
    include: {
      _count: {
        select: {
          products: { where: { status: "Active" } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return categories.map(withCategoryThemeImage);
}

async function getStoreContent() {
  const [banners, popup, announcement] = await Promise.all([
    prisma.banner.findMany({
      where: { status: "Active" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.popup.findFirst({ where: { id: "default", status: "Active" } }),
    prisma.announcement.findFirst({
      where: {
        id: "default",
        status: "Active",
      },
    }),
  ]);

  return { banners, popup, announcement };
}

async function getValidCoupon(code, subtotal) {
  const normalizedCode = String(code || "")
    .trim()
    .toUpperCase();
  if (!normalizedCode) throw new ApiError(400, "Coupon code is required");

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon) throw new ApiError(400, "Invalid coupon code");
  if (coupon.status !== "Active") throw new ApiError(400, "Coupon is inactive");
  const timezone = await getCouponTimezone();
  if (isCouponExpired(coupon.expiry, timezone)) {
    if (coupon.status === "Active") {
      await prisma.coupon.update({ where: { id: coupon.id }, data: { status: "Inactive" } });
    }
    throw new ApiError(400, "Coupon has expired");
  }
  if (coupon.usageCount >= coupon.maxUses) {
    throw new ApiError(400, "Coupon usage limit reached");
  }
  if (subtotal < coupon.minOrder) {
    throw new ApiError(
      400,
      `Minimum order amount $${coupon.minOrder} required for this coupon`,
    );
  }

  return coupon;
}

async function getCouponTimezone() {
  const settings = await getRawSettings().catch(() => null);
  return getSafeTimezone(process.env.TZ || process.env.STORE_TIMEZONE || settings?.timezone);
}

function getSafeTimezone(timezone) {
  const fallback = "Asia/Kolkata";
  if (!timezone) return fallback;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return fallback;
  }
}

function dateKeyInTimeZone(value, timezone) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function isCouponExpired(expiry, timezone) {
  if (!expiry) return false;
  return dateKeyInTimeZone(expiry, timezone) < dateKeyInTimeZone(new Date(), timezone);
}

function calculateCouponDiscount(coupon, subtotal) {
  if (coupon.type === "percentage") {
    const percentage = Math.min(Math.max(Number(coupon.value) || 0, 0), 100);
    const finalAmount = toMoney(subtotal * (1 - percentage / 100));
    return toMoney(Math.max(0, subtotal - finalAmount));
  }

  const discount = coupon.value;

  return toMoney(Math.min(discount, subtotal));
}

async function reserveStockForOrderItems(tx, items = []) {
  for (const item of items) {
    if (!item.productId) continue;
    const quantity = Math.max(1, Number(item.quantity) || 1);

    await lockProductRow(tx, item.productId);

    const product = await tx.product.findUnique({
      where: { id: item.productId },
    });
    if (!product) continue;

    const familyVariants = Array.isArray(product.familyVariants)
      ? product.familyVariants
      : [];
    const familyVariantIndex = familyVariants.findIndex((variant) =>
      (variant.skus || []).some((sku) => String(sku.id) === String(item.variantId || item.selectedSize?.id)),
    );

    if (familyVariantIndex >= 0) {
      let selectedSkuStock = 0;
      const nextFamilyVariants = familyVariants.map((variant, variantIndex) => {
        if (variantIndex !== familyVariantIndex) return variant;
        const nextSkus = (variant.skus || []).map((sku) => {
          if (String(sku.id) !== String(item.variantId || item.selectedSize?.id)) return sku;
          const currentStock = Math.max(0, Number(sku.stock) || 0);
          selectedSkuStock = currentStock;
          return { ...sku, stock: currentStock - quantity };
        });
        return { ...variant, skus: nextSkus };
      });

      if (selectedSkuStock < quantity) {
        throw new ApiError(
          400,
          selectedSkuStock > 0
            ? `Only ${selectedSkuStock} left in stock for ${product.name}. Please update the quantity in your cart.`
            : `${product.name} is out of stock.`,
        );
      }

      const nextOptionVariants = Array.isArray(product.optionVariants)
        ? product.optionVariants.map((variant) =>
            String(variant.id) === String(item.variantId || item.selectedSize?.id)
              ? { ...variant, stock: selectedSkuStock - quantity }
              : variant,
          )
        : product.optionVariants;
      const nextStock = nextFamilyVariants.reduce((total, variant) => {
        if (String(variant.status || "Active").toLowerCase() !== "active") return total;
        return total + (variant.skus || []).reduce((skuTotal, sku) => {
          if (String(sku.status || "Active").toLowerCase() !== "active") return skuTotal;
          return skuTotal + (Number(sku.stock) || 0);
        }, 0);
      }, 0);

      await tx.product.update({
        where: { id: item.productId },
        data: {
          familyVariants: nextFamilyVariants,
          optionVariants: nextOptionVariants,
          stock: nextStock,
          sold: { increment: quantity },
        },
      });
      continue;
    }

    const optionVariants = Array.isArray(product.optionVariants)
      ? product.optionVariants
      : [];
    const variantIndex = optionVariants.findIndex((variant) => {
      const selectedId = item.variantId || item.selectedSize?.id;
      const selectedLabel = item.variantLabel || item.selectedSize?.label;
      return (
        (selectedId && String(variant.id) === String(selectedId)) ||
        (selectedLabel && String(variant.label) === String(selectedLabel))
      );
    });

    if (variantIndex >= 0) {
      const selectedVariant = optionVariants[variantIndex];
      const currentStock = Math.max(0, Number(selectedVariant.stock) || 0);

      if (currentStock < quantity) {
        throw new ApiError(
          400,
          currentStock > 0
            ? `Only ${currentStock} left in stock for ${product.name}. Please update the quantity in your cart.`
            : `${product.name} is out of stock.`,
        );
      }

      const nextVariants = optionVariants.map((variant, index) =>
        index === variantIndex
          ? { ...variant, stock: currentStock - quantity }
          : variant,
      );
      const nextStock = nextVariants.reduce((total, variant) => {
        if (String(variant.status || "Active").toLowerCase() !== "active") {
          return total;
        }
        return total + (Number(variant.stock) || 0);
      }, 0);

      await tx.product.update({
        where: { id: item.productId },
        data: {
          optionVariants: nextVariants,
          stock: nextStock,
          sold: { increment: quantity },
        },
      });
      continue;
    }

    const result = await tx.product.updateMany({
      where: { id: item.productId, stock: { gte: quantity } },
      data: {
        stock: { decrement: quantity },
        sold: { increment: quantity },
      },
    });

    if (result.count === 0) {
      throw new ApiError(
        400,
        product.stock > 0
          ? `Only ${product.stock} left in stock for ${product.name}. Please update the quantity in your cart.`
          : `${product.name} is out of stock.`,
      );
    }
  }
}

async function lockProductRow(tx, productId) {
  if (typeof tx.$queryRawUnsafe !== "function") return;
  await tx.$queryRawUnsafe(
    'SELECT id FROM "Product" WHERE id = $1 FOR UPDATE',
    productId,
  );
}

async function resolveOrderItems(items = [], db = prisma) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const resolvedItems = [];

  for (const item of items) {
    const productId = item.productId || item.id;
    if (!productId) throw new ApiError(400, "Cart item is missing a product");

    const product = await db.product.findFirst({
      where: { id: productId, status: "Active" },
      include: { category: true },
    });

    if (!product) {
      throw new ApiError(
        400,
        `${item.name || "A product"} is no longer available.`,
      );
    }

    const variantId =
      item.variantId || item.selectedVariantId || item.selectedSize?.id;
    const variantLabel = item.variantLabel || item.selectedSize?.label;
    const variant = findVariant(product, variantId, variantLabel);
    const catalogProduct = normalizeProduct(product);
    const productHasVariants = Array.isArray(catalogProduct.optionVariants) && catalogProduct.optionVariants.length > 0;
    if (productHasVariants && !variant) {
      throw new ApiError(400, `Please select a valid variant for ${product.name}.`);
    }
    const pricing = variant?.pricing || catalogProduct.pricing;
    const inventory = variant?.inventory || catalogProduct.inventory;
    const quantity = Math.max(1, Number(item.quantity) || 1);

    if (variant && !variant.isAvailable) {
      throw new ApiError(400, `${product.name} is out of stock.`);
    }

    if (!inventory.isInStock) {
      throw new ApiError(400, `${product.name} is out of stock.`);
    }

    if (quantity > inventory.stockQuantity) {
      throw new ApiError(
        400,
        `Only ${inventory.stockQuantity} left in stock for ${product.name}. Please update the quantity in your cart.`,
      );
    }

    resolvedItems.push({
      productId: product.id,
      variantId: variant?.id || null,
      variantLabel: variant?.familyVariantName || variant?.label || null,
      packLabel: variant?.packLabel || item.packLabel || item.selectedSize?.label || null,
      name: product.name,
      sku: variant?.sku || product.sku,
      image: variant?.image || item.image || product.image,
      price: pricing.finalPrice,
      regularPrice: pricing.price,
      salePrice: pricing.salePrice,
      pricing,
      stockQuantity: inventory.stockQuantity,
      quantity,
      selectedSize: variant
        ? {
            id: variant.id,
            label: variant.label,
            size: variant.size,
            weightRange: variant.weightRange,
            dose: variant.dose,
            packSize: variant.packSize,
            sku: variant.sku,
            packLabel: variant.packLabel,
            familyVariantId: variant.familyVariantId,
            familyVariantName: variant.familyVariantName,
            familyVariantSlug: variant.familyVariantSlug,
            image: variant.image,
            description: variant.description || variant.details || "",
            price: pricing.finalPrice,
          }
        : item.selectedSize || null,
      selectedColor: item.selectedColor || null,
      optionLabel: product.optionLabel,
      prescriptionRequired: Boolean(product.prescriptionRequired),
      vetOnly: Boolean(product.vetOnly),
    });
  }

  return {
    items: resolvedItems,
    subtotal: toMoney(
      resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    ),
  };
}

function toStripeMinorUnit(value) {
  return stripeService.toMinorUnit(toMoney(value), getStripeCurrency());
}

function getStripeCurrency() {
  return normalizeCurrency(process.env.STRIPE_CURRENCY || "usd");
}

function normalizeCurrency(currency) {
  return String(currency || "usd")
    .trim()
    .toLowerCase();
}

const CUSTOMER_COLLECTION_COLUMNS = new Set(["cartItems", "wishlistItems"]);

function ensureCustomerCollectionColumn(column) {
  if (!CUSTOMER_COLLECTION_COLUMNS.has(column)) {
    throw new ApiError(500, "Invalid customer collection");
  }
}

function normalizeCollectionItem(item = {}) {
  return {
    ...item,
    id: String(
      item.id ||
        item.cartId ||
        item.productId ||
        item.slug ||
        generateId("item"),
    ),
    productId: item.productId
      ? String(item.productId)
      : item.id
        ? String(item.id)
        : undefined,
    slug: item.slug ? String(item.slug) : undefined,
    quantity:
      item.quantity === undefined
        ? undefined
        : Math.max(1, Number(item.quantity) || 1),
  };
}

function normalizeCollectionItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === "object")
    .map(normalizeCollectionItem);
}

function mergeCartItems(existingItems = [], incomingItem) {
  const items = normalizeCollectionItems(existingItems);
  const index = items.findIndex((item) => item.id === incomingItem.id);
  if (index === -1)
    return [
      {
        ...incomingItem,
        quantity: clampCartQuantity(incomingItem.quantity || 1, incomingItem),
      },
      ...items,
    ];

  return items.map((item, itemIndex) =>
    itemIndex === index
      ? {
          ...item,
          ...incomingItem,
          quantity: clampCartQuantity(
            (Number(item.quantity) || 1) + (Number(incomingItem.quantity) || 1),
            { ...item, ...incomingItem },
          ),
        }
      : item,
  );
}

function getCartItemMaxQuantity(item = {}) {
  const candidates = [
    item.maxQuantity,
    item.variantStock,
    item.stock,
    item.stockQuantity,
  ];
  for (const value of candidates) {
    const quantity = Number(value);
    if (Number.isFinite(quantity) && quantity > 0) return Math.floor(quantity);
  }
  return null;
}

function clampCartQuantity(quantity, item = {}) {
  const requestedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
  const maxQuantity = getCartItemMaxQuantity(item);
  return maxQuantity
    ? Math.min(requestedQuantity, maxQuantity)
    : requestedQuantity;
}

async function getCustomerCollection(customerId, column) {
  ensureCustomerCollectionColumn(column);
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "${column}" FROM "Customer" WHERE id = $1`,
    customerId,
  );
  return normalizeCollectionItems(rows[0]?.[column] || []);
}

async function updateCustomerCollection(customerId, column, items) {
  ensureCustomerCollectionColumn(column);
  if (column === "cartItems") {
    await ensureAbandonedCartTrackingColumns();
  }
  const normalizedItems = normalizeCollectionItems(items);
  const cartRecoveryResetSql = column === "cartItems"
    ? ', "abandonedCartEmailCartHash" = NULL, "abandonedCartEmailSentAt" = NULL, "abandonedCartEmailCount" = CASE WHEN jsonb_array_length($1::jsonb) = 0 THEN 0 ELSE "abandonedCartEmailCount" END'
    : "";
  await prisma.$executeRawUnsafe(
    `UPDATE "Customer" SET "${column}" = $1::jsonb, "updatedAt" = NOW()${cartRecoveryResetSql} WHERE id = $2`,
    JSON.stringify(normalizedItems),
    customerId,
  );
  return normalizedItems;
}

async function ensureAbandonedCartTrackingColumns() {
  if (typeof prisma.$executeRawUnsafe !== "function") return;
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "abandonedCartEmailSentAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "abandonedCartEmailCartHash" TEXT,
      ADD COLUMN IF NOT EXISTS "abandonedCartEmailCount" INTEGER NOT NULL DEFAULT 0
  `);
}

function ensureAddressIndex(addresses, index) {
  if (index < 0 || index >= addresses.length) {
    throw new ApiError(404, "Address not found");
  }
}

function serializeAddresses(addresses = []) {
  return addresses.map(serializeAddress);
}

function serializeAddress(address) {
  if (typeof address === "string") return address;
  return JSON.stringify({
    ...address,
    phone: typeof address.phone === "string" ? address.phone.trim() : address.phone,
  });
}

function normalizePetPayload(payload = {}) {
  const data = {};
  [
    "name",
    "species",
    "breed",
    "age",
    "weight",
    "gender",
    "vaccinationInfo",
  ].forEach((key) => {
    if (payload[key] !== undefined) {
      const value = String(payload[key] || "").trim();
      data[key] = value || null;
    }
  });

  if (payload.neuteredSpayed !== undefined) {
    data.neuteredSpayed = payload.neuteredSpayed === null ? null : Boolean(payload.neuteredSpayed);
  }

  ["medicalConditions", "allergies", "currentMedications"].forEach((key) => {
    if (payload[key] !== undefined) {
      data[key] = Array.isArray(payload[key])
        ? payload[key].map((item) => String(item).trim()).filter(Boolean)
        : [];
    }
  });

  return data;
}

function getAddressField(address, keys = []) {
  if (!address || typeof address !== "object") return "";

  for (const key of keys) {
    const value = address[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function parseAddresses(addresses = []) {
  return addresses.map((address, index) => {
    if (typeof address !== "string") return { index, ...address };
    try {
      const parsed = JSON.parse(address);
      return { index, ...parsed };
    } catch (error) {
      return { index, address };
    }
  });
}

function buildStatusSummary(orders) {
  return ["Delivered", "Processing", "Pending", "Cancelled"].reduce(
    (summary, status) => {
      summary[status] = orders.filter(
        (order) => order.orderStatus === status,
      ).length;
      return summary;
    },
    {},
  );
}

function formatDashboardOrder(order) {
  return {
    id: order.id,
    date: order.orderDate,
    total: order.total,
    paymentStatus: order.paymentStatus,
    status: order.orderStatus,
    shippingAddress: order.shippingAddress,
    items: order.items,
  };
}

async function submitReview(customer, { productId, orderId, rating, title, comment }) {
  // Verify the order belongs to this customer and is delivered
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: customer.id },
  });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.orderStatus !== "Delivered") {
    throw new ApiError(400, "You can only review products from delivered orders");
  }

  // Verify the product was in the order
  const items = Array.isArray(order.items) ? order.items : [];
  const hasProduct = items.some(
    (item) => item.productId === productId || item.id === productId,
  );
  if (!hasProduct) throw new ApiError(400, "Product not found in this order");

  const review = await prisma.productReview.upsert({
    where: { orderId_productId: { orderId, productId } },
    create: {
      id: generateId("review"),
      productId,
      orderId,
      customerId: customer.id,
      customerName: customer.name,
      rating,
      title: title || null,
      comment,
      isVerified: true,
    },
    update: { rating, title: title || null, comment },
  });

  return review;
}

async function getProductReviews(productId) {
  const reviews = await prisma.productReview.findMany({
    where: { productId, status: "Active" },
    orderBy: { createdAt: "desc" },
  });
  return reviews.map((r) => ({
    id: r.id,
    author: r.customerName,
    rating: r.rating,
    title: r.title || "",
    comment: r.comment,
    verified: r.isVerified,
    helpfulCount: r.helpfulCount,
    date: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(r.createdAt),
  }));
}

module.exports = {
  addAddress,
  addCartItem,
  addWishlistItem,
  changePassword,
  checkLoginMethod,
  clearCartItems,
  clearWishlistItems,
  checkoutContact,
  cancelOrder,
  createOrder,
  createPaymentIntent,
  getCart,
  getCatalogProduct,
  getCatalogProductVariant,
  getDashboard,
  getCheckoutQuote,
  getOrder,
  getOrderInvoice,
  getPasswordStatus,
  getProductReviews,
  getProfile,
  getStoreContent,
  getRewards,
  getWishlist,
  listAddresses,
  listPets,
  listCatalogCategories,
  listCatalogProducts,
  listCoupons,
  listOrders,
  login,
  completeSocialAuth,
  getSocialAuthRedirectUrl,
  getFrontendSocialRedirectUri,
  publicCustomer,
  register,
  removeAddress,
  addPet,
  removeCartItem,
  deletePet,
  removeWishlistItem,
  resetPassword,
  setPassword,
  signCustomerToken,
  submitReview,
  syncCart,
  syncWishlist,
  updateAddress,
  updateAvatar,
  updateCartItem,
  updatePet,
  updatePaymentIntent,
  updateProfile,
  validateCoupon,
};
