const customerPanelService = require("../services/customerPanelService");
const checkoutOtpService = require("../services/checkoutOtpService");
const geocodingService = require("../services/geocodingService");
const newsletterService = require("../services/newsletterService");
const asyncHandler = require("../utils/asyncHandler");
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { deleteImage } = require("../config/cloudinary");

async function cancelCustomerOrder(customerId, id) {
  const order = await prisma.order.findFirst({ where: { id, customerId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.orderStatus === "Cancelled") {
    throw new ApiError(400, "Order is already cancelled");
  }
  if (order.orderStatus === "Delivered") {
    throw new ApiError(400, "Delivered orders cannot be cancelled");
  }
  if (order.orderStatus === "Shipped") {
    throw new ApiError(400, "Shipped orders cannot be cancelled. Please contact support.");
  }

  return prisma.order.update({
    where: { id: order.id },
    data: {
      orderStatus: "Cancelled",
      paymentStatus: order.paymentStatus === "Paid" ? "Refunded" : order.paymentStatus,
      timeline: [...(order.timeline || []), "Order cancelled by customer"],
    },
  });
}

const register = asyncHandler(async (req, res) => {
  const data = await customerPanelService.register(req.validated.body);
  res.status(201).json({ success: true, data });
});

const login = asyncHandler(async (req, res) => {
  const data = await customerPanelService.login(req.validated.body);
  res.json({ success: true, data });
});

const getOAuthApiBaseUrl = (req) => (
  process.env.OAUTH_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "production" ? process.env.PUBLIC_API_BASE_URL : "") ||
  `${req.protocol}://${req.get("host")}`
).replace(/\/$/, "");

const getOAuthProviderRedirectUri = (req, provider) => {
  const normalizedProvider = String(provider || "").trim().toUpperCase();
  const configured =
    process.env[`${normalizedProvider}_REDIRECT_URI`] ||
    process.env.OAUTH_REDIRECT_URI;
  if (configured) return configured;
  return `${getOAuthApiBaseUrl(req)}/api/customer-panel/auth/social/${provider}/callback`;
};

const startSocialAuth = asyncHandler(async (req, res) => {
  const redirectUrl = customerPanelService.getSocialAuthRedirectUrl({
    provider: req.params.provider,
    redirectUri: getOAuthProviderRedirectUri(req, req.params.provider),
    frontendRedirectUri: req.query.redirectUri,
    mode: req.query.mode,
    storeKey: req.query.storeKey,
    storeDomain: req.query.storeDomain,
  });
  if (req.query.format === "json") {
    return res.json({ success: true, data: { authUrl: redirectUrl } });
  }
  res.redirect(302, redirectUrl);
});

const getSocialAuthConfig = asyncHandler(async (req, res) => {
  const provider = String(req.params.provider || "").trim().toLowerCase();
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`] || "";
  res.json({
    success: true,
    data: {
      provider,
      clientId,
      hasClientSecret: Boolean(process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]),
      redirectUri: getOAuthProviderRedirectUri(req, provider),
    },
  });
});

const socialAuthProviderCallback = asyncHandler(async (req, res) => {
  const data = await customerPanelService.completeSocialAuth({
    provider: req.params.provider,
    code: req.query.code,
    state: req.query.state,
    redirectUri: getOAuthProviderRedirectUri(req, req.params.provider),
  });
  const frontendRedirectUri = customerPanelService.getFrontendSocialRedirectUri(
    req.query.state,
    process.env.STORE_PUBLIC_URL
      ? `${process.env.STORE_PUBLIC_URL.replace(/\/$/, "")}/auth/social/callback`
      : "http://localhost:5173/auth/social/callback",
  );
  const url = new URL(frontendRedirectUri);
  url.searchParams.set("provider", req.params.provider);
  url.searchParams.set("token", data.token);
  url.searchParams.set("customer", encodeURIComponent(JSON.stringify(data.customer)));
  res.redirect(302, url.toString());
});

const completeSocialAuth = asyncHandler(async (req, res) => {
  const data = await customerPanelService.completeSocialAuth(req.body);
  res.json({ success: true, data });
});

const checkLoginMethod = asyncHandler(async (req, res) => {
  const data = await customerPanelService.checkLoginMethod(req.validated.body);
  res.json({ success: true, data });
});

const requestLoginOtp = asyncHandler(async (req, res) => {
  const data = await checkoutOtpService.requestLoginOtp(req.validated.body);
  res.json({ success: true, message: "OTP sent to your email", data });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await checkoutOtpService.requestLoginOtp(req.validated.body);
  res.json({ success: true, message: "OTP sent to your email", data });
});

const resetPassword = asyncHandler(async (req, res) => {
  const verified = await checkoutOtpService.verifyLoginOtp({
    otpToken: req.validated.body.otpToken,
    code: req.validated.body.code,
  });
  const data = await customerPanelService.resetPassword(verified.customer.id, req.validated.body);
  res.json({ success: true, data });
});

const verifyLoginOtp = asyncHandler(async (req, res) => {
  const data = await checkoutOtpService.verifyLoginOtp(req.validated.body);
  res.json({ success: true, data });
});

const requestCheckoutOtp = asyncHandler(async (req, res) => {
  const data = await checkoutOtpService.requestOtp(req.validated.body);
  res.json({ success: true, message: "OTP sent to your email", data });
});

const verifyCheckoutOtp = asyncHandler(async (req, res) => {
  const data = await checkoutOtpService.verifyOtp(req.validated.body);
  res.json({ success: true, data });
});

const checkoutContact = asyncHandler(async (req, res) => {
  const data = await customerPanelService.checkoutContact(req.validated.body);
  res.json({ success: true, data });
});

const subscribeNewsletter = asyncHandler(async (req, res) => {
  const data = await newsletterService.subscribe(req.validated.body);
  res.status(201).json({ success: true, data });
});

const reverseGeocode = asyncHandler(async (req, res) => {
  const data = await geocodingService.reverseGeocode(req.validated.query);
  res.json({ success: true, data });
});

const changePassword = asyncHandler(async (req, res) => {
  const data = await customerPanelService.changePassword(req.customer, req.validated?.body || req.body);
  res.json({ success: true, data });
});

const setPassword = asyncHandler(async (req, res) => {
  const data = await customerPanelService.setPassword(req.customer, req.validated.body);
  res.json({ success: true, data });
});

const getPasswordStatus = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getPasswordStatus(req.customer);
  res.json({ success: true, data });
});

const getProfile = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getProfile(req.customer);
  res.json({ success: true, data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const data = await customerPanelService.updateProfile(req.customer.id, req.validated.body);
  res.json({ success: true, data });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Avatar image is required");
  const avatarUrl = req.file.path;
  const previousAvatar = req.customer.avatar;
  let data;
  try {
    data = await customerPanelService.updateAvatar(req.customer, avatarUrl, req.tenantDb);
  } catch (error) {
    await deleteImage(avatarUrl);
    throw error;
  }
  if (previousAvatar && previousAvatar !== avatarUrl) {
    await deleteImage(previousAvatar);
  }
  res.json({ success: true, data });
});

const uploadPrescription = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Prescription file is required");
  res.status(201).json({ success: true, data: { url: req.file.path } });
});

const removeAvatar = asyncHandler(async (req, res) => {
  const previousAvatar = req.customer.avatar;
  const data = await customerPanelService.updateAvatar(req.customer, null, req.tenantDb);
  if (previousAvatar) await deleteImage(previousAvatar);
  res.json({ success: true, data });
});

const getDashboard = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getDashboard(req.customer);
  res.json({ success: true, data });
});

const getRewards = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getRewards(req.customer);
  res.json({ success: true, data });
});

const getCart = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getCart(req.customer);
  res.json({ success: true, data });
});

const syncCart = asyncHandler(async (req, res) => {
  const data = await customerPanelService.syncCart(req.customer, req.validated.body.items);
  res.json({ success: true, data });
});

const addCartItem = asyncHandler(async (req, res) => {
  const data = await customerPanelService.addCartItem(req.customer, req.validated.body.item);
  res.status(201).json({ success: true, data });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const data = await customerPanelService.updateCartItem(
    req.customer,
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ success: true, data });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const data = await customerPanelService.removeCartItem(req.customer, req.validated.params.id);
  res.json({ success: true, data });
});

const clearCartItems = asyncHandler(async (req, res) => {
  const data = await customerPanelService.clearCartItems(req.customer);
  res.json({ success: true, data });
});

const getWishlist = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getWishlist(req.customer);
  res.json({ success: true, data });
});

const syncWishlist = asyncHandler(async (req, res) => {
  const data = await customerPanelService.syncWishlist(req.customer, req.validated.body.items);
  res.json({ success: true, data });
});

const addWishlistItem = asyncHandler(async (req, res) => {
  const data = await customerPanelService.addWishlistItem(req.customer, req.validated.body.item);
  res.status(201).json({ success: true, data });
});

const removeWishlistItem = asyncHandler(async (req, res) => {
  const data = await customerPanelService.removeWishlistItem(req.customer, req.validated.params.id);
  res.json({ success: true, data });
});

const clearWishlistItems = asyncHandler(async (req, res) => {
  const data = await customerPanelService.clearWishlistItems(req.customer);
  res.json({ success: true, data });
});

const listAddresses = asyncHandler(async (req, res) => {
  res.json({ success: true, data: customerPanelService.listAddresses(req.customer) });
});

const listPets = asyncHandler(async (req, res) => {
  const data = await customerPanelService.listPets(req.customer);
  res.json({ success: true, data });
});

const addPet = asyncHandler(async (req, res) => {
  const data = await customerPanelService.addPet(req.customer, req.validated.body);
  res.status(201).json({ success: true, data });
});

const updatePet = asyncHandler(async (req, res) => {
  const data = await customerPanelService.updatePet(req.customer, req.validated.params.id, req.validated.body);
  res.json({ success: true, data });
});

const deletePet = asyncHandler(async (req, res) => {
  const data = await customerPanelService.deletePet(req.customer, req.validated.params.id);
  res.json({ success: true, data });
});

const addAddress = asyncHandler(async (req, res) => {
  const data = await customerPanelService.addAddress(req.customer, req.validated.body.address);
  res.status(201).json({ success: true, data });
});

const updateAddress = asyncHandler(async (req, res) => {
  const data = await customerPanelService.updateAddress(
    req.customer,
    req.validated.params.index,
    req.validated.body.address,
  );
  res.json({ success: true, data });
});

const removeAddress = asyncHandler(async (req, res) => {
  const data = await customerPanelService.removeAddress(req.customer, req.validated.params.index);
  res.json({ success: true, data });
});

const listOrders = asyncHandler(async (req, res) => {
  const data = await customerPanelService.listOrders(req.customer.id);
  res.json({ success: true, data });
});

const getOrder = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getOrder(req.customer.id, req.validated.params.id);
  res.json({ success: true, data });
});

const getOrderInvoice = asyncHandler(async (req, res) => {
  const html = await customerPanelService.getOrderInvoice(req.customer.id, req.validated.params.id);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `inline; filename=invoice-${req.validated.params.id}.html`);
  res.send(html);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const data = await cancelCustomerOrder(req.customer.id, req.validated.params.id);
  res.json({ success: true, data });
});

const createOrder = asyncHandler(async (req, res) => {
  const data = await customerPanelService.createOrder(req.customer, req.validated.body);
  res.status(201).json({ success: true, data });
});

const getCheckoutQuote = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getCheckoutQuote(req.validated.body, req.customer);
  res.json({ success: true, data });
});

const createPaymentIntent = asyncHandler(async (req, res) => {
  const data = await customerPanelService.createPaymentIntent(
    req.customer,
    req.validated.body.amount,
    req.validated.body.currency,
    { localFallback: req.validated.body.localFallback },
  );
  res.status(201).json({ success: true, data });
});

const updatePaymentIntent = asyncHandler(async (req, res) => {
  const data = await customerPanelService.updatePaymentIntent(
    req.customer,
    req.validated.params.id,
    req.validated.body.amount,
    req.validated.body.currency,
  );
  res.json({ success: true, data });
});

const listProducts = asyncHandler(async (req, res) => {
  const data = await customerPanelService.listCatalogProducts(req.query);
  res.json({ success: true, data });
});

const getProduct = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getCatalogProduct(req.validated.params.id);
  res.json({ success: true, data });
});

const getProductVariant = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getCatalogProductVariant(
    req.params.productSlug,
    req.params.variantSlug,
  );
  res.json({ success: true, data });
});

const listCategories = asyncHandler(async (req, res) => {
  const data = await customerPanelService.listCatalogCategories();
  res.json({ success: true, data });
});

const getContent = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getStoreContent();
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.json({ success: true, data });
});

const validateCoupon = asyncHandler(async (req, res) => {
  const data = await customerPanelService.validateCoupon(req.body);
  res.json({ success: true, data });
});

const listCoupons = asyncHandler(async (req, res) => {
  const data = await customerPanelService.listCoupons();
  res.json({ success: true, data });
});

const submitReview = asyncHandler(async (req, res) => {
  const data = await customerPanelService.submitReview(req.customer, req.validated.body);
  res.status(201).json({ success: true, data });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const data = await customerPanelService.getProductReviews(req.validated.params.productId);
  res.json({ success: true, data });
});

module.exports = {
  addAddress,
  addCartItem,
  addPet,
  addWishlistItem,
  cancelOrder,
  changePassword,
  checkLoginMethod,
  clearCartItems,
  clearWishlistItems,
  completeSocialAuth,
  checkoutContact,
  createOrder,
  createPaymentIntent,
  deletePet,
  getCart,
  getContent,
  getDashboard,
  getOrder,
  getOrderInvoice,
  getPasswordStatus,
  getSocialAuthConfig,
  getCheckoutQuote,
  getProduct,
  getProductVariant,
  getProductReviews,
  getProfile,
  getRewards,
  getWishlist,
  listAddresses,
  listCategories,
  listCoupons,
  listOrders,
  listPets,
  listProducts,
  login,
  forgotPassword,
  register,
  removeAddress,
  removeAvatar,
  removeCartItem,
  removeWishlistItem,
  requestCheckoutOtp,
  requestLoginOtp,
  resetPassword,
  reverseGeocode,
  setPassword,
  socialAuthProviderCallback,
  startSocialAuth,
  subscribeNewsletter,
  submitReview,
  syncCart,
  syncWishlist,
  updateAddress,
  uploadAvatar,
  updateCartItem,
  updatePet,
  updatePaymentIntent,
  updateProfile,
  uploadPrescription,
  validateCoupon,
  verifyCheckoutOtp,
  verifyLoginOtp,
};
