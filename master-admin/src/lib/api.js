import { showToast } from "./toast";
import {
  clearSelectedSuperAdminStore,
  getSelectedSuperAdminStore,
  isAllStoresSelected,
} from "./superAdminStore";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "admin_admin_token";
const USER_KEY = "admin_admin_user";

export function getAdminToken() {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        clearAdminSession();
        localStorage.setItem("admin_session_expired", "true");
        return null;
      }
    }
  } catch {
    // ignore
  }
  
  return token;
}

export function getAdminUser() {
  const raw =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAdminStoreKey() {
  const admin = getAdminUser();
  if (String(admin?.role || "").toUpperCase() === "SUPER_ADMIN") {
    const selectedStore = getSelectedSuperAdminStore();
    return isAllStoresSelected(selectedStore) ? "" : selectedStore;
  }
  return admin?.store?.storeKey || admin?.storeKey || "";
}

export function isSuperAdmin() {
  const admin = getAdminUser();
  return String(admin?.role || "").toUpperCase() === "SUPER_ADMIN";
}

export function getAdminProfile() {
  const admin = getAdminUser() || {};
  const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(" ");
  const name =
    fullName ||
    admin.name ||
    admin.fullName ||
    admin.username ||
    admin.email?.split("@")[0] ||
    "Admin";
  const email = admin.email || "";
  const role = admin.role || "Admin";
  const initialsSource = name || email || "Admin";
  const initials =
    initialsSource
      .trim()
      .charAt(0)
      .toUpperCase() || "A";

  return {
    ...admin,
    name,
    email,
    role,
    initials,
  };
}

export function setAdminSession({ token, admin }, remember = true) {
  const storage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;

  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(admin));
  otherStorage.removeItem(TOKEN_KEY);
  otherStorage.removeItem(USER_KEY);
  if (String(admin?.role || "").toUpperCase() === "SUPER_ADMIN") {
    clearSelectedSuperAdminStore();
  }
  window.dispatchEvent(new Event("admin-auth-change"));
}

export function updateAdminUser(admin) {
  if (!admin) return;

  const storage = localStorage.getItem(TOKEN_KEY)
    ? localStorage
    : sessionStorage.getItem(TOKEN_KEY)
      ? sessionStorage
      : null;

  storage?.setItem(USER_KEY, JSON.stringify(admin));
  window.dispatchEvent(new Event("admin-auth-change"));
}

export function clearAdminSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  clearSelectedSuperAdminStore();
  window.dispatchEvent(new Event("admin-auth-change"));
}

function getErrorMessage(payload, fallback) {
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    return payload.errors
      .map((error) => error.message || error.msg || error)
      .filter(Boolean)
      .join(", ");
  }
  return fallback;
}

function getToastTitleForStatus() {
  return "Error";
}

function withCacheBust(path) {
  const [pathWithoutHash, hash = ""] = path.split("#");
  const separator = pathWithoutHash.includes("?") ? "&" : "?";
  const nextPath = `${pathWithoutHash}${separator}_cb=${Date.now()}`;
  return hash ? `${nextPath}#${hash}` : nextPath;
}

export async function apiRequest(path, options = {}) {
  const token = getAdminToken();
  const method = String(options.method || "GET").toUpperCase();
  const storeKey = getAdminStoreKey();
  const requestPath = method === "GET" ? withCacheBust(path) : path;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (storeKey) headers["x-store-key"] = storeKey;
  if (method === "GET") {
    headers["Cache-Control"] = "no-cache";
    headers.Pragma = "no-cache";
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${requestPath}`, {
      cache: method === "GET" ? "no-store" : options.cache,
      ...options,
      headers,
      credentials: "include",
    });
  } catch (error) {
    const message =
      error instanceof TypeError
        ? `Unable to connect to backend at ${API_BASE_URL}. Please make sure the backend server is running.`
        : error.message || "Unable to connect to backend. Please try again.";
    if (!options.suppressToast) {
      showToast({
        type: "error",
        title: "Error",
        message,
      });
    }
    const apiError = new Error(message);
    apiError.toastShown = !options.suppressToast;
    throw apiError;
  }

  const responseText = await response.text();
  let payload = {};
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { message: responseText };
    }
  }

  if (!response.ok || payload.success === false) {
    const message = getErrorMessage(
      payload,
      `API request failed: ${response.status}`,
    );

    if (!options.suppressToast) {
      showToast({ type: "error", title: getToastTitleForStatus(response.status), message });
    }

    if (response.status === 401 || response.status === 403) {
      const hadToken = Boolean(token);
      clearAdminSession();
      if (hadToken) {
        localStorage.setItem("admin_session_expired", "true");
      }
      
      if (
        !path.includes("/auth/login") &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
    }

    const apiError = new Error(message);
    apiError.status = response.status;
    apiError.payload = payload;
    apiError.toastShown = !options.suppressToast;
    throw apiError;
  }

  return payload.data ?? payload;
}

function withQuery(path, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const normalized = String(value).trim();
    if (!normalized || normalized.toLowerCase() === "all") return;
    searchParams.set(key, normalized);
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function withApiQuery(path, options = {}) {
  const { query, ...requestOptions } = options;
  return [withQuery(path, query), requestOptions];
}

export const adminApi = {
  login: (body) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      suppressToast: true,
    }),
  me: () => apiRequest("/auth/me"),
  changePassword: (body) =>
    apiRequest("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  stores: () => apiRequest("/super-admin/stores"),
  dashboard: (params) =>
    apiRequest(withQuery(isSuperAdmin() ? "/super-admin/overview" : "/dashboard/summary", params), {
      cache: "no-store",
    }),
  products: () => {
    const path = isSuperAdmin() ? "/super-admin/products" : "/products";
    return apiRequest(
      isSuperAdmin() ? withQuery(path, { storeKey: getAdminStoreKey() }) : path,
      { cache: "no-store" },
    );
  },
  product: (id) => apiRequest(`/products/${id}`, { cache: "no-store" }),
  createProduct: (body) =>
    apiRequest("/products", {
      method: "POST",
      body: JSON.stringify(body),
      // ProductForm presents the rejected request once with its own context.
      suppressToast: true,
    }),
  updateProduct: (id, body) =>
    apiRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patchProduct: (id, body) =>
    apiRequest(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteProduct: (id) => apiRequest(`/products/${id}`, { method: "DELETE" }),
  categories: () => apiRequest(isSuperAdmin() ? "/super-admin/categories" : "/categories"),
  createCategory: (body) =>
    apiRequest("/categories", { method: "POST", body: JSON.stringify(body) }),
  deleteCategory: (id) => apiRequest(`/categories/${id}`, { method: "DELETE" }),
  orders: (params) =>
    apiRequest(withQuery(isSuperAdmin() ? "/super-admin/orders" : "/orders", params), { cache: "no-store" }),
  updateOrderStatus: (id, orderStatus) =>
    apiRequest(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ orderStatus }),
    }),
  customers: (options = {}) => apiRequest(isSuperAdmin() ? "/super-admin/customers" : "/customers", options),
  createCustomer: (body) =>
    apiRequest("/customers", { method: "POST", body: JSON.stringify(body) }),
  updateCustomer: (id, body) =>
    apiRequest(`/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  updateCustomerStatus: (id, status) =>
    apiRequest(`/customers/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  blockCustomer: (id, reason) =>
    apiRequest(`/customers/${id}/block`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),
  unblockCustomer: (id) =>
    apiRequest(`/customers/${id}/unblock`, { method: "PATCH" }),
  deleteOrder: (id) => apiRequest(`/orders/${id}`, { method: "DELETE" }),
  deleteCustomer: (id) => apiRequest(`/customers/${id}`, { method: "DELETE" }),
  banners: () => apiRequest("/content/banners"),
  popup: () => apiRequest("/content/popup"),
  announcement: () => apiRequest("/content/announcement"),
  updateAnnouncement: (body) =>
    apiRequest("/content/announcement", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  settings: () => apiRequest("/settings"),
  updateSettings: (body) =>
    apiRequest("/settings", { method: "PUT", body: JSON.stringify(body) }),
  testEmail: (to) =>
    apiRequest("/settings/test-email", { method: "POST", body: JSON.stringify({ to }) }),
  runAbandonedCartEmails: (body = {}) =>
    apiRequest("/settings/abandoned-cart/run", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  removeSmtpSettings: (body) =>
    apiRequest("/settings", {
      method: "PUT",
      body: JSON.stringify({ ...(body || {}), clearSmtpCredentials: true }),
    }),
  coupons: () => apiRequest("/coupons"),
  createCoupon: (body) =>
    apiRequest("/coupons", { method: "POST", body: JSON.stringify(body) }),
  updateCoupon: (id, body) =>
    apiRequest(`/coupons/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCoupon: (id) => apiRequest(`/coupons/${id}`, { method: "DELETE" }),
  taxes: () => apiRequest("/taxes"),
  createTax: (body) =>
    apiRequest("/taxes", { method: "POST", body: JSON.stringify(body) }),
  updateTax: (id, body) =>
    apiRequest(`/taxes/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTax: (id) => apiRequest(`/taxes/${id}`, { method: "DELETE" }),
  inquiries: () => apiRequest("/inquiries"),
  updateInquiryStatus: (id, status) =>
    apiRequest(`/inquiries/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteInquiry: (id) => apiRequest(`/inquiries/${id}`, { method: "DELETE" }),
  supportConversations: (params, options = {}) =>
    apiRequest(withQuery("/admin/support", params), { cache: "no-store", ...options }),
  supportConversation: (id) =>
    apiRequest(`/admin/support/${encodeURIComponent(id)}`, { cache: "no-store" }),
  sendSupportMessage: (id, body) =>
    apiRequest(`/admin/support/${encodeURIComponent(id)}/messages`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  markSupportRead: (id) =>
    apiRequest(`/admin/support/${encodeURIComponent(id)}/read`, { method: "POST" }),
  assignSupportConversation: (id, assignedAgentId) =>
    apiRequest(`/admin/support/${encodeURIComponent(id)}/assign`, {
      method: "POST",
      body: JSON.stringify({ assignedAgentId }),
    }),
  updateSupportStatus: (id, body) =>
    apiRequest(`/admin/support/${encodeURIComponent(id)}/status`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  addSupportInternalNote: (id, note) =>
    apiRequest(`/admin/support/${encodeURIComponent(id)}/internal-note`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  aiCallingDashboard: (options = {}) => {
    const [path, requestOptions] = withApiQuery("/ai-calling/dashboard", options);
    return apiRequest(path, { cache: "no-store", ...requestOptions });
  },
  aiCallingConfig: (options = {}) => apiRequest("/ai-calling/config", { cache: "no-store", ...options }),
  aiCallingAgents: (options = {}) => {
    const [path, requestOptions] = withApiQuery("/ai-calling/agents", options);
    return apiRequest(path, { cache: "no-store", ...requestOptions });
  },
  createAiCallingAgent: (body) =>
    apiRequest("/ai-calling/agents", { method: "POST", body: JSON.stringify(body) }),
  updateAiCallingAgent: (id, body) =>
    apiRequest(`/ai-calling/agents/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteAiCallingAgent: (id) =>
    apiRequest(`/ai-calling/agents/${encodeURIComponent(id)}`, { method: "DELETE" }),
  aiCallingCalls: (params, options = {}) => apiRequest(withQuery("/ai-calling/calls", { ...(params || {}), ...(options.query || {}) }), { cache: "no-store", ...Object.fromEntries(Object.entries(options).filter(([key]) => key !== "query")) }),
  aiCallingCall: (id, options = {}) => {
    const [path, requestOptions] = withApiQuery(`/ai-calling/calls/${encodeURIComponent(id)}`, options);
    return apiRequest(path, { cache: "no-store", ...requestOptions });
  },
  createAiCallingTestCall: (body) =>
    apiRequest("/ai-calling/test-call", { method: "POST", body: JSON.stringify(body) }),
  quickStartAiCalling: (body, options = {}) =>
    apiRequest("/ai-calling/quick-start", { method: "POST", body: JSON.stringify(body), ...options }),
};
