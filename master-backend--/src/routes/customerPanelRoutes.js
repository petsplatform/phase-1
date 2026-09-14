const express = require("express");
const controller = require("../controllers/customerPanelController");
const inquiryController = require("../controllers/inquiryController");
const { createCloudinaryUpload } = require("../config/cloudinary");
const { requireCustomerAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const rateLimiter = require("../middleware/rateLimiter");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const {
  addressIndexParam,
  addressSchema,
  addCollectionItemSchema,
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
  syncCollectionSchema,
  updateAddressSchema,
  updateCartItemSchema,
  updateCustomerProfileSchema,
  updatePetSchema,
  updatePaymentIntentSchema,
} = require("../validations/customerPanelSchemas");
const { inquirySchema } = require("../validations/adminSchemas");

const router = express.Router();
function tokenQueryToHeader(req, res, next) {
  if (!req.headers.authorization && req.query?.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}

router.use(tokenQueryToHeader);
const avatarUpload = createCloudinaryUpload({
  folder: "e-commerce/customer-avatars",
  allowedFormats: ["jpg", "jpeg", "png", "webp"],
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxFileSize: 5 * 1024 * 1024,
});
const prescriptionUpload = createCloudinaryUpload({
  folder: "e-commerce/prescriptions",
  allowedFormats: ["jpg", "jpeg", "png", "webp", "pdf"],
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  maxFileSize: 5 * 1024 * 1024,
});

// Public routes
router.post("/auth/register", rateLimiter({ action: "customer-register", accountLimit: 5, windowMs: 60 * 60 * 1000 }), validate(customerRegisterSchema), controller.register);
router.post("/auth/check-login-method", rateLimiter({ action: "customer-login-method", accountLimit: 20, windowMs: 15 * 60 * 1000 }), validate(customerLoginMethodSchema), controller.checkLoginMethod);
router.post("/auth/login", rateLimiter({ action: "customer-login" }), validate(customerLoginSchema), controller.login);
router.get("/auth/social/:provider/config", controller.getSocialAuthConfig);
router.get("/auth/social/:provider/start", rateLimiter({ action: "customer-social-start", accountLimit: 30, windowMs: 15 * 60 * 1000 }), controller.startSocialAuth);
router.get("/auth/social/:provider/callback", controller.socialAuthProviderCallback);
router.post("/auth/social/callback", rateLimiter({ action: "customer-social-callback", accountLimit: 30, windowMs: 15 * 60 * 1000 }), controller.completeSocialAuth);
router.post("/auth/login/request-otp", rateLimiter({ action: "customer-login-otp-request", isOtpRequest: true }), validate(customerLoginOtpRequestSchema), controller.requestLoginOtp);
router.post("/auth/login/verify-otp", rateLimiter({ action: "customer-login-otp-verify", accountLimit: 5, windowMs: 10 * 60 * 1000 }), validate(customerLoginOtpVerifySchema), controller.verifyLoginOtp);
router.post("/auth/forgot-password", rateLimiter({ action: "customer-forgot-password", isOtpRequest: true }), validate(customerLoginOtpRequestSchema), controller.forgotPassword);
router.post("/auth/reset-password", rateLimiter({ action: "customer-reset-password", accountLimit: 5, windowMs: 10 * 60 * 1000 }), validate(resetPasswordSchema), controller.resetPassword);
router.post("/auth/checkout-otp/request", rateLimiter({ action: "checkout-otp-request", isOtpRequest: true }), validate(checkoutOtpRequestSchema), controller.requestCheckoutOtp);
router.post("/auth/checkout-otp/verify", rateLimiter({ action: "checkout-otp-verify", accountLimit: 5, windowMs: 10 * 60 * 1000 }), validate(checkoutOtpVerifySchema), controller.verifyCheckoutOtp);
router.post("/auth/checkout-contact", validate(checkoutContactSchema), controller.checkoutContact);
router.get("/auth/password-status", requireCustomerAuth, controller.getPasswordStatus);
router.post("/auth/set-password", requireCustomerAuth, validate(setPasswordSchema), controller.setPassword);
router.post("/auth/change-password", requireCustomerAuth, validate(changeCustomerPasswordSchema), controller.changePassword);
router.post("/subscribe", rateLimiter({ action: "newsletter-subscribe", accountLimit: 10, windowMs: 60 * 60 * 1000 }), validate(newsletterSubscribeSchema), controller.subscribeNewsletter);
router.get("/geocode/reverse", rateLimiter({ action: "reverse-geocode", accountLimit: 60, windowMs: 60 * 60 * 1000 }), validate(reverseGeocodeSchema), controller.reverseGeocode);

// Public catalog routes (no auth required)
router.get("/catalog/products", controller.listProducts);
router.get("/catalog/products/:productSlug/variants/:variantSlug", controller.getProductVariant);
router.get("/catalog/products/:id", validate(idParam), controller.getProduct);
router.get("/catalog/categories", controller.listCategories);
router.get("/store/content", controller.getContent);
router.get("/coupons", controller.listCoupons);
router.post("/coupons/validate", controller.validateCoupon);
router.post("/inquiries", validate(inquirySchema), inquiryController.create);

// Public reviews route (no auth required to read)
router.get("/reviews/:productId", validate(productIdParam), controller.getProductReviews);

router.use(requireCustomerAuth);

router.get("/dashboard", controller.getDashboard);
router.get("/overview", controller.getDashboard);
router.get("/rewards", controller.getRewards);

router.get("/cart", controller.getCart);
router.put("/cart", validate(syncCollectionSchema), controller.syncCart);
router.post("/cart/items", validate(addCollectionItemSchema), controller.addCartItem);
router.patch("/cart/items/:id", validate(updateCartItemSchema), controller.updateCartItem);
router.delete("/cart/items/:id", validate(idParam), controller.removeCartItem);
router.delete("/cart", controller.clearCartItems);

router.get("/wishlist", controller.getWishlist);
router.put("/wishlist", validate(syncCollectionSchema), controller.syncWishlist);
router.post("/wishlist/items", validate(addCollectionItemSchema), controller.addWishlistItem);
router.delete("/wishlist/items/:id", validate(idParam), controller.removeWishlistItem);
router.delete("/wishlist", controller.clearWishlistItems);

router.get("/profile", controller.getProfile);
router.patch("/profile", validate(updateCustomerProfileSchema), controller.updateProfile);
router.post("/profile/avatar", avatarUpload.single("avatar"), controller.uploadAvatar);
router.delete("/profile/avatar", controller.removeAvatar);

router.get("/addresses", controller.listAddresses);
router.post("/addresses", validate(addressSchema), controller.addAddress);
router.put("/addresses/:index", validate(updateAddressSchema), controller.updateAddress);
router.delete("/addresses/:index", validate(addressIndexParam), controller.removeAddress);

router.get("/pets", controller.listPets);
router.post("/pets", validate(petSchema), controller.addPet);
router.put("/pets/:id", validate(updatePetSchema), controller.updatePet);
router.delete("/pets/:id", validate(idParam), controller.deletePet);

router.post("/checkout/prescription", prescriptionUpload.single("prescription"), controller.uploadPrescription);

router.get("/orders", controller.listOrders);
router.post("/orders/quote", validate(checkoutQuoteSchema), controller.getCheckoutQuote);
router.post("/orders", validate(createCustomerOrderSchema), controller.createOrder);
router.get("/orders/:id/invoice", validate(idParam), controller.getOrderInvoice);
router.get("/orders/:id", validate(idParam), controller.getOrder);
router.patch("/orders/:id/cancel", asyncHandler(async () => {
  throw new ApiError(403, "Orders can only be cancelled by an admin.");
}));
router.post("/payments/create-intent", validate(createPaymentIntentSchema), controller.createPaymentIntent);
router.patch("/payments/:id", validate(updatePaymentIntentSchema), controller.updatePaymentIntent);

// Authenticated review submission
router.post("/reviews", validate(createReviewSchema), controller.submitReview);

module.exports = router;
