import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORE_KEY = import.meta.env.VITE_STORE_KEY || "STORE_5";
const STORE_DOMAIN = import.meta.env.VITE_STORE_DOMAIN || "";

export const CUSTOMER_SESSION_KEY = "happypetrx_customer_session";
export const CUSTOMER_USER_KEY = "happypetrx_auth_user";
export const CUSTOMER_BLOCKED_REASON_KEY = "happypetrx_blocked_reason";
export const CUSTOMER_SESSION_EXPIRED_KEY = "happypetrx_session_expired";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const getToken = () => {
  try {
    const session = localStorage.getItem(CUSTOMER_SESSION_KEY);
    return session ? JSON.parse(session)?.token : null;
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (STORE_KEY) config.headers["x-store-key"] = STORE_KEY;
  if (STORE_DOMAIN) config.headers["x-store-domain"] = STORE_DOMAIN;
  return config;
});

export const isUserBlockedError = (error) => {
  if (!error?.response) return false;
  if (Boolean(error.response?.data?.isBlocked)) return true;
  const status = error.response?.status;
  const msg = typeof error.response?.data?.message === "string" ? error.response.data.message.toLowerCase() : "";
  const token = getToken();
  const url = error.config?.url || "";
  const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register");
  const hasBlockedKeyword =
    msg.includes("blocked") ||
    msg.includes("account has been") ||
    msg.includes("deactivated") ||
    msg.includes("suspended");
  return (Boolean(token) || isAuthRoute) && status === 403 && hasBlockedKeyword;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isBlocked = isUserBlockedError(error);
    const token = getToken();

    if (isBlocked) {
      const rawReason = error.response?.data?.message;
      const reason =
        typeof rawReason === "string" && rawReason.trim().length > 3
          ? rawReason.trim()
          : "Your account has been blocked. Please contact support.";
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
      localStorage.removeItem(CUSTOMER_USER_KEY);
      localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
      window.dispatchEvent(new Event("happypetrx-auth-change"));
    } else {
      if (!token) {
        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      }
      const requestHadToken = Boolean(error.config?.headers?.Authorization);
      const url = error.config?.url || "";
      const isAuthRoute =
        url.includes("/auth/login") ||
        url.includes("/auth/login/request-otp") ||
        url.includes("/auth/login/verify-otp") ||
        url.includes("/auth/checkout-otp") ||
        url.includes("/auth/register");
      const isPublicRoute =
        url.includes("/reviews/") ||
        url.includes("/catalog/") ||
        url.includes("/store/content");

      if (status === 401 && requestHadToken && !isAuthRoute && !isPublicRoute) {
        const session = localStorage.getItem(CUSTOMER_SESSION_KEY);
        if (session) {
          localStorage.removeItem(CUSTOMER_SESSION_KEY);
          localStorage.removeItem(CUSTOMER_USER_KEY);
          localStorage.setItem(CUSTOMER_SESSION_EXPIRED_KEY, "true");
          window.dispatchEvent(new Event("happypetrx-auth-change"));
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
