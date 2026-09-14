import axios from "axios";
const baseURL = import.meta.env.VITE_API_URL;
export const AUTH_SESSION_KEY = "pet_meds_user_session";
export const AUTH_TOKEN_KEY = "pet_meds_user_token";
export const CUSTOMER_SESSION_KEY = AUTH_SESSION_KEY;
export const CUSTOMER_BLOCKED_REASON_KEY = "petmedsdirect_blocked_reason";
export const CUSTOMER_SESSION_EXPIRED_KEY = "petmedsdirect_session_expired";

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const getStoredToken = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const session = localStorage.getItem(AUTH_SESSION_KEY);

  if (session) {
    try {
      const parsedSession = JSON.parse(session);
      return parsedSession?.token || parsedSession?.accessToken || token || "";
    } catch (error) {
      return token || "";
    }
  }

  return token || "";
};

export const saveAuthSession = (user, token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ ...user, token }));
};

export const saveAuthToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

export const clearAuthCredentials = () => {
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const clearAuthStorage = () => {
  clearAuthCredentials();
  localStorage.removeItem("pet_meds_cart");
  localStorage.removeItem("pet_meds_wishlist");
  localStorage.removeItem("pet_meds_applied_coupon");
  localStorage.removeItem("pet_meds_discount_percent");
  localStorage.removeItem("pet_meds_promo_discount");
};

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "x-store-key": import.meta.env.VITE_STORE_KEY,
    "x-store-domain": import.meta.env.VITE_STORE_DOMAIN,
  },
});

console.log("|axiosInstance", axiosInstance);
// Request Interceptor: Automatically injects Authorization header if token exists
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    // Return standard response data directly if preferred, or the full response
    return response;
  },
  (error) => {
    // Handle specific HTTP error status codes globally
    if (error.response) {
      const { status } = error.response;
      const token = getToken();
      const rawReason = error.response?.data?.message || "";
      const rawMsg = typeof rawReason === "string" ? rawReason.toLowerCase() : "";
      const isExplicitlyBlocked = Boolean(error.response?.data?.isBlocked);
      const hasBlockedKeyword =
        rawMsg.includes("blocked") ||
        rawMsg.includes("deactivated") ||
        rawMsg.includes("suspended");

      const isBlocked =
        Boolean(token) &&
        (isExplicitlyBlocked || (status === 403 && hasBlockedKeyword));

      if (isBlocked) {
        const reason =
          typeof rawReason === "string" && rawReason.trim().length > 3
            ? rawReason.trim()
            : "Your account has been blocked. Please contact support.";
        clearAuthStorage();
        localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
        if (typeof unauthorizedHandler === "function") {
          unauthorizedHandler();
        }
        window.dispatchEvent(new Event("petmedsdirect-auth-change"));
      } else {
        if (!token) {
          localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
        }
        switch (status) {
          case 401: {
            console.warn("Unauthorized access! User session may have expired:", error.config?.url);
            const requestHadToken = Boolean(error.config?.headers?.Authorization);
            const isAuthRoute = error.config?.url?.includes("/customer-panel/auth/");
            const isPublicRoute =
              error.config?.url?.includes("/catalog/") ||
              error.config?.url?.includes("/reviews/");

            // If a public or catalog route failed because of a stale token, retry once cleanly without Authorization
            if (requestHadToken && !error.config?._retry && isPublicRoute) {
              error.config._retry = true;
              clearAuthCredentials();
              if (error.config.headers) {
                delete error.config.headers.Authorization;
              }
              window.dispatchEvent(new Event("petmedsdirect-auth-change"));
              return axiosInstance(error.config);
            }

            if (!isAuthRoute) {
              clearAuthCredentials();
              if (typeof unauthorizedHandler === "function") {
                unauthorizedHandler();
              }
              window.dispatchEvent(new Event("petmedsdirect-auth-change"));

              // Only redirect to /login if user is currently visiting an explicitly protected route
              const isProtectedRoute =
                window.location.pathname.startsWith("/profile") ||
                window.location.pathname.startsWith("/account");

              if (isProtectedRoute && window.location.pathname !== "/login") {
                localStorage.setItem(CUSTOMER_SESSION_EXPIRED_KEY, "true");
                window.location.replace("/login");
              }
            }
            break;
          }
          case 500:
            console.error("Internal Server Error occurred on the API backend.");
            break;
          default:
            console.error(`API Error (${status}):`, error.response.data);
        }
      }
    } else if (error.request) {
      // Request was made but no response was received
      console.error(
        "No response received from the API server. Please check your network connection.",
      );
    } else {
      // Something happened in setting up the request
      console.error("Error setting up API request:", error.message);
    }

    return Promise.reject(error);
  },
);

// Function to fetch products from backend API
export const getProductsApi = async (params) => {
  try {
    const response = await axiosInstance.get(
      "/customer-panel/catalog/products",
      {
        params,
      },
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Auth / Public Routes
export const registerApi = async (userData) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/auth/register",
      userData,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const loginApi = async (credentials) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/auth/login",
      credentials,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const requestLoginOtpApi = async (data) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/auth/login/request-otp",
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const verifyLoginOtpApi = async (data) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/auth/login/verify-otp",
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const requestCheckoutOtpApi = async (data) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/auth/checkout-otp/request",
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const verifyCheckoutOtpApi = async (data) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/auth/checkout-otp/verify",
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const checkoutContactApi = async (data) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/auth/checkout-contact",
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const uploadPrescriptionApi = async (file) => {
  try {
    const formData = new FormData();
    formData.append("prescription", file);

    const response = await axiosInstance.post(
      "/customer-panel/checkout/prescription",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Prescription upload error:", error);
    throw error.response?.data?.message || "Failed to upload prescription";
  }
};

export const changePasswordApi = async (data) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/auth/change-password",
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Catalog / Public Routes
export const getProductByIdApi = async (id) => {
  try {
    const response = await axiosInstance.get(
      `/customer-panel/catalog/products/${id}`,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const getProductVariantApi = async (productSlug, variantSlug) => {
  return null;
};

export const productApi = {
  getProducts: async (params = {}) => {
    const res = await axiosInstance.get("/customer-panel/catalog/products", {
      params,
    });
    return res.data?.data || res.data;
  },
  getProductById: async (id) => {
    const res = await axiosInstance.get(
      `/customer-panel/catalog/products/${encodeURIComponent(id)}`,
    );
    return res.data?.data || res.data;
  },
  getProductVariant: async (productSlug, variantSlug) => {
    return null;
  },
  getCategories: async () => {
    const res = await axiosInstance.get("/customer-panel/catalog/categories");
    return res.data?.data || res.data;
  },
};

export const getCategoriesApi = async () => {
  try {
    const response = await axiosInstance.get(
      "/customer-panel/catalog/categories",
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const getStoreContentApi = async () => {
  try {
    const response = await axiosInstance.get("/customer-panel/store/content");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const getBannersApi = async () => {
  try {
    const response = await axiosInstance.get("/customer-panel/store/content");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const validateCouponApi = async (data) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/coupons/validate",
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const getCouponsApi = async () => {
  try {
    const response = await axiosInstance.get("/customer-panel/coupons");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Dashboard / Overview
export const getDashboardApi = async () => {
  try {
    const response = await axiosInstance.get("/customer-panel/dashboard");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const getOverviewApi = async () => {
  try {
    const response = await axiosInstance.get("/customer-panel/overview");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Cart Routes
export const getCartApi = async () => {
  try {
    const response = await axiosInstance.get("/customer-panel/cart");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const syncCartApi = async (data) => {
  try {
    const response = await axiosInstance.put("/customer-panel/cart", data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const addCartItemApi = async (data) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/cart/items",
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const updateCartItemApi = async (id, data) => {
  try {
    const response = await axiosInstance.patch(
      `/customer-panel/cart/items/${id}`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const removeCartItemApi = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/customer-panel/cart/items/${id}`,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const clearCartApi = async () => {
  try {
    const response = await axiosInstance.delete("/customer-panel/cart");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Wishlist Routes
export const getWishlistApi = async () => {
  try {
    const response = await axiosInstance.get("/customer-panel/wishlist");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const syncWishlistApi = async (data) => {
  try {
    const response = await axiosInstance.put("/customer-panel/wishlist", data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const addWishlistItemApi = async (data) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/wishlist/items",
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const removeWishlistItemApi = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/customer-panel/wishlist/items/${id}`,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const clearWishlistApi = async () => {
  try {
    const response = await axiosInstance.delete("/customer-panel/wishlist");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Profile Routes
export const getProfileApi = async () => {
  try {
    const response = await axiosInstance.get("/customer-panel/profile");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const updateProfileApi = async (data) => {
  try {
    const response = await axiosInstance.patch("/customer-panel/profile", data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Address Routes
export const getAddressesApi = async () => {
  try {
    const response = await axiosInstance.get("/customer-panel/addresses");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const addAddressApi = async (data) => {
  try {
    const response = await axiosInstance.post("/customer-panel/addresses", {
      address: data,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const updateAddressApi = async (id, data) => {
  try {
    const response = await axiosInstance.put(
      `/customer-panel/addresses/${id}`,
      { address: data },
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const removeAddressApi = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/customer-panel/addresses/${id}`,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Orders Routes
export const getOrdersApi = async () => {
  try {
    const response = await axiosInstance.get("/customer-panel/orders");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const createOrderApi = async (data) => {
  try {
    const response = await axiosInstance.post("/customer-panel/orders", data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const getOrderByIdApi = async (id) => {
  try {
    const response = await axiosInstance.get(`/customer-panel/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const cancelOrderApi = async (id) => {
  try {
    const response = await axiosInstance.patch(
      `/customer-panel/orders/${id}/cancel`,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Payments
export const createPaymentIntentApi = async (data) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/payments/create-intent",
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const updatePaymentIntentApi = async (id, data) => {
  try {
    const response = await axiosInstance.patch(
      `/customer-panel/payments/${id}`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Tax Configuration
export const getActiveTaxApi = async () => {
  try {
    const response = await axiosInstance.get(
      `/customer-panel/taxes/active?_=${Date.now()}`,
    );
    return response.data?.data ?? null;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Avatar Upload
export const uploadAvatarApi = async (formData) => {
  try {
    const response = await axiosInstance.post(
      "/customer-panel/profile/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

// Transform raw backend product data into frontend compatible schema
export const transformProduct = (apiProduct) => {
  if (!apiProduct) return null;

  const pricing = apiProduct.pricing || {};
  const inventory = apiProduct.inventory || {};

  // pricing.finalPrice is the selling price (price to charge)
  // pricing.price is the regular/actual price before discount
  const sellingPrice = Number(
    pricing.finalPrice || apiProduct.salePrice || apiProduct.price || 0,
  );
  const actualPrice = Number(
    pricing.price ||
      pricing.regularPrice ||
      apiProduct.regularPrice ||
      apiProduct.originalPrice ||
      apiProduct.oldPrice ||
      apiProduct.comparePrice ||
      sellingPrice,
  );
  const hasDiscount =
    Boolean(pricing.hasDiscount) || actualPrice > sellingPrice;
  const discountPercentage =
    pricing.discountPercentage ||
    (hasDiscount && actualPrice > sellingPrice
      ? Math.round(((actualPrice - sellingPrice) / actualPrice) * 100)
      : 0);
  // Parse petCompanion array safely
  let petCompanion = [];
  if (Array.isArray(apiProduct.petCompanion)) {
    petCompanion = apiProduct.petCompanion.map((p) => String(p).toLowerCase());
  } else if (apiProduct.petType) {
    const rawPetType = Array.isArray(apiProduct.petType)
      ? apiProduct.petType.join(" ").toLowerCase()
      : String(apiProduct.petType).toLowerCase();

    if (rawPetType.includes("dog")) petCompanion.push("dog");
    if (rawPetType.includes("cat")) petCompanion.push("cat");
    if (rawPetType.includes("bird")) petCompanion.push("bird");
    if (rawPetType.includes("rabbit")) petCompanion.push("rabbit");
    if (rawPetType.includes("fish")) petCompanion.push("fish");
  }

  // Fallback: If petCompanion is empty (e.g. petType was null in backend), infer from name/description/category
  if (petCompanion.length === 0) {
    const fullText =
      `${apiProduct.name || ""} ${apiProduct.description || ""} ${apiProduct.category?.name || apiProduct.category || ""}`.toLowerCase();
    if (fullText.includes("dog")) petCompanion.push("dog");
    if (fullText.includes("cat")) petCompanion.push("cat");
    if (fullText.includes("bird")) petCompanion.push("bird");
    if (fullText.includes("rabbit")) petCompanion.push("rabbit");
    if (fullText.includes("fish")) petCompanion.push("fish");
  }

  // Collect and merge all image sources to prevent image loss
  const primaryCandidates = [
    typeof apiProduct.mainImage === "string" ? apiProduct.mainImage.trim() : apiProduct.mainImage?.url || apiProduct.mainImage?.src,
    typeof apiProduct.image === "string" ? apiProduct.image.trim() : apiProduct.image?.url || apiProduct.image?.src,
    typeof apiProduct.thumbnail === "string" ? apiProduct.thumbnail.trim() : apiProduct.thumbnail?.url || apiProduct.thumbnail?.src,
    typeof apiProduct.imageUrl === "string" ? apiProduct.imageUrl.trim() : null,
  ].filter(Boolean);

  const galleryList = (Array.isArray(apiProduct.gallery) ? apiProduct.gallery : [])
    .map((img) => (typeof img === "string" ? img.trim() : img?.url || img?.src))
    .filter(Boolean);

  const colorVariantImages = (Array.isArray(apiProduct.colorVariants) ? apiProduct.colorVariants : [])
    .flatMap((v) => {
      if (!v) return [];
      const vMain = typeof v.mainImage === "string" ? v.mainImage.trim() : v.mainImage?.url || v.mainImage?.src;
      const vImg = typeof v.image === "string" ? v.image.trim() : v.image?.url || v.image?.src;
      const vUrl = typeof v.imageUrl === "string" ? v.imageUrl.trim() : null;
      const vGal = Array.isArray(v.gallery) ? v.gallery.map((g) => (typeof g === "string" ? g.trim() : g?.url || g?.src)) : [];
      return [vMain, vImg, vUrl, ...vGal];
    })
    .filter(Boolean);

  const variantImages = (Array.isArray(apiProduct.optionVariants) ? apiProduct.optionVariants : [])
    .flatMap((v) => {
      if (!v) return [];
      const vMain = typeof v.mainImage === "string" ? v.mainImage.trim() : v.mainImage?.url || v.mainImage?.src;
      const vImg = typeof v.image === "string" ? v.image.trim() : v.image?.url || v.image?.src;
      const vUrl = typeof v.imageUrl === "string" ? v.imageUrl.trim() : null;
      const vGal = Array.isArray(v.gallery) ? v.gallery.map((g) => (typeof g === "string" ? g.trim() : g?.url || g?.src)) : [];
      const vImgs = Array.isArray(v.images) ? v.images.map((g) => (typeof g === "string" ? g.trim() : g?.url || g?.src)) : [];
      return [vMain, vImg, vUrl, ...vGal, ...vImgs];
    })
    .filter(Boolean);

  const familyImages = (Array.isArray(apiProduct.familyVariants) ? apiProduct.familyVariants : [])
    .flatMap((fv) => {
      if (!fv) return [];
      const fMain = typeof fv.mainImage === "string" ? fv.mainImage.trim() : fv.mainImage?.url || fv.mainImage?.src;
      const fImg = typeof fv.image === "string" ? fv.image.trim() : fv.image?.url || fv.image?.src;
      const fUrl = typeof fv.imageUrl === "string" ? fv.imageUrl.trim() : null;
      const fGal = Array.isArray(fv.gallery) ? fv.gallery.map((g) => (typeof g === "string" ? g.trim() : g?.url || g?.src)) : [];
      return [fMain, fImg, fUrl, ...fGal];
    })
    .filter(Boolean);

  const mergedImages = Array.from(
    new Set([...primaryCandidates, ...galleryList, ...colorVariantImages, ...variantImages, ...familyImages])
  ).filter(Boolean);

  const finalImages = mergedImages.length > 0 ? mergedImages : [apiProduct.image || ""];

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    category: apiProduct.category?.name || apiProduct.category || "General",
    description: apiProduct.description || "",
    image: finalImages[0] || apiProduct.image,
    images: finalImages,
    gallery: finalImages,
    actualPrice: actualPrice,
    sellingPrice: sellingPrice,
    discount: hasDiscount ? `${discountPercentage}% OFF` : null,
    inStock:
      apiProduct.isInStock !== undefined
        ? apiProduct.isInStock
        : inventory.isInStock !== undefined
          ? inventory.isInStock
          : apiProduct.stock > 0,
    petCompanion: petCompanion,
    formType: apiProduct.optionType || "medicine",
    rating:
      apiProduct.rating ??
      apiProduct.averageRating ??
      apiProduct.avgRating ??
      apiProduct.ratings ??
      0,
    reviewsCount:
      apiProduct.reviewsCount ??
      apiProduct.numReviews ??
      apiProduct.totalReviews ??
      (Array.isArray(apiProduct.reviews) ? apiProduct.reviews.length : 0),
    productType: apiProduct.productType
      ? String(apiProduct.productType).trim().toUpperCase()
      : (Array.isArray(apiProduct.familyVariants) && apiProduct.familyVariants.length > 0)
        ? "FAMILY"
        : "SIMPLE",
    brand: apiProduct.brand?.name || apiProduct.brand || "",
    baseProductId:
      apiProduct.baseProductId ||
      apiProduct.parentId ||
      apiProduct.parentProductId ||
      null,
    familyVariants: Array.isArray(apiProduct.familyVariants) ? apiProduct.familyVariants : [],
    productDetails: apiProduct.productDetails || {},
    parentContent: apiProduct.parentContent || "",
    content:
      apiProduct.content ||
      apiProduct.htmlContent ||
      apiProduct.detailedContent ||
      apiProduct.contentHtml ||
      apiProduct.longDescription ||
      "",
    optionVariants: apiProduct.optionVariants || [],
    capacities: apiProduct.capacities || [],
    shippingReturns: apiProduct.shippingReturns || "",
    returnPolicies: apiProduct.returnPolicies || "",
    prescriptionRequired:
      apiProduct.prescriptionRequired ??
      apiProduct.isPrescriptionRequired ??
      apiProduct.prescription_required ??
      apiProduct.requiresPrescription ??
      false,
    vetOnly: Boolean(
      apiProduct.vetOnly ??
      apiProduct.isVetOnly ??
      apiProduct.vet_only ??
      apiProduct.is_vet_only ??
      apiProduct.requiresVet ??
      apiProduct.vetRequired ??
      apiProduct.isVetRequired ??
      apiProduct.isVet ??
      apiProduct.vet ??
      apiProduct.vetProduct ??
      apiProduct.isVetProduct ??
      apiProduct.is_vet_product ??
      apiProduct.vet_product ??
      false,
    ),
    isVetOnly: Boolean(
      apiProduct.isVetOnly ??
      apiProduct.vetOnly ??
      apiProduct.vet_only ??
      apiProduct.is_vet_only ??
      apiProduct.requiresVet ??
      apiProduct.vetRequired ??
      apiProduct.isVetRequired ??
      apiProduct.isVet ??
      apiProduct.vet ??
      apiProduct.vetProduct ??
      apiProduct.isVetProduct ??
      apiProduct.is_vet_product ??
      apiProduct.vet_product ??
      false,
    ),
    requiresVet: Boolean(
      apiProduct.requiresVet ??
      apiProduct.vetOnly ??
      apiProduct.isVetOnly ??
      apiProduct.vet_only ??
      apiProduct.is_vet_only ??
      apiProduct.vetRequired ??
      apiProduct.isVetRequired ??
      apiProduct.isVet ??
      apiProduct.vet ??
      apiProduct.vetProduct ??
      apiProduct.isVetProduct ??
      apiProduct.is_vet_product ??
      apiProduct.vet_product ??
      false,
    ),
    colorVariants: apiProduct.colorVariants || null,
    optionType: apiProduct.optionType || null,
    optionLabel: apiProduct.optionLabel || null,
    petType: apiProduct.petType || null,
  };
};

export const createInquiryApi = async (data) => {
  try {
    const response = await axiosInstance.post("/inquiries", data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data?.message || "Check Network Connection";
  }
};

export const reviewApi = {
  submitReview: async ({ productId, orderId, rating, comment }) => {
    const res = await axiosInstance.post("/customer-panel/reviews", {
      productId,
      orderId,
      rating,
      comment,
    });
    return res.data?.data || res.data;
  },

  getProductReviews: async (productId) => {
    const res = await axiosInstance.get(
      `/customer-panel/reviews/${encodeURIComponent(productId)}`,
    );
    return res.data?.data || res.data || [];
  },
};

export default axiosInstance;
