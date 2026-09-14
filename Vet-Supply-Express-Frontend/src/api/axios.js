import axios from "axios";
import {
  clearAuthStorage,
  CUSTOMER_BLOCKED_REASON_KEY,
  CUSTOMER_SESSION_EXPIRED_KEY,
  CUSTOMER_SESSION_KEY,
  CUSTOMER_USER_KEY,
  getStoredSession,
} from "./authStorage";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORE_KEY = import.meta.env.VITE_STORE_KEY || "STORE_5";
const STORE_DOMAIN = import.meta.env.VITE_STORE_DOMAIN || "";

export {
  CUSTOMER_SESSION_KEY,
  CUSTOMER_USER_KEY,
  CUSTOMER_BLOCKED_REASON_KEY,
  CUSTOMER_SESSION_EXPIRED_KEY,
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const getToken = () => {
  return getStoredSession()?.token || null;
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (STORE_KEY) config.headers["x-store-key"] = STORE_KEY;
  if (STORE_DOMAIN) config.headers["x-store-domain"] = STORE_DOMAIN;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = getToken();
    const rawReason =
      error.response?.data?.message || error.response?.data?.error;
    const rawMessage = typeof rawReason === "string" ? rawReason.toLowerCase() : "";

    // An account can ONLY be marked as blocked if:
    // 1. A valid customer auth token is present (guests cannot be blocked)
    // 2. The backend explicitly returns isBlocked: true OR error message specifically contains "blocked", "deactivated", or "suspended"
    // Generic 403 errors (like "Admin access required", "forbidden", etc.) MUST NOT block the customer account!
    const isExplicitlyBlocked = Boolean(error.response?.data?.isBlocked);
    const hasBlockedKeyword =
      rawMessage.includes("blocked") ||
      rawMessage.includes("deactivated") ||
      rawMessage.includes("suspended");

    const isCustomerBlocked =
      Boolean(token) &&
      (isExplicitlyBlocked || (error.response?.status === 403 && hasBlockedKeyword));

    if (isCustomerBlocked) {
      const reason =
        typeof rawReason === "string" && rawReason.trim().length > 3
          ? rawReason.trim()
          : "Your account has been blocked. Please contact support.";
      localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
      clearAuthStorage({ reason: "blocked" });
    } else {
      if (!token) {
        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      }
      const requestHadToken = Boolean(error.config?.headers?.Authorization);
      const isAuthRoute = error.config?.url?.includes("/auth/");
      const isCustomerPanelRoute = error.config?.url?.includes("/customer-panel/");
      const isAuthFailure = error.response?.status === 401;

      if (isAuthFailure && requestHadToken && isCustomerPanelRoute && !isAuthRoute) {
        localStorage.setItem(CUSTOMER_SESSION_EXPIRED_KEY, "true");
        clearAuthStorage({ reason: "expired" });
      }
    }

    return Promise.reject(error);
  },
);

export default api;
