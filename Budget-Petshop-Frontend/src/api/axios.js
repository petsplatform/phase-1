import axios from "axios";
import {
  AUTH_CHANGE_EVENT,
  CUSTOMER_BLOCKED_REASON_KEY,
  CUSTOMER_SESSION_KEY,
  CUSTOMER_USER_KEY,
  clearSession,
  loadSession,
} from "./sessionStorage";

const BASE_URL = import.meta.env.VITE_API_URL;
const STORE_KEY = import.meta.env.VITE_STORE_KEY;
const STORE_DOMAIN = import.meta.env.VITE_STORE_DOMAIN || "";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let unauthorizedHandler = null;
let isHandlingUnauthorized = false;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

api.interceptors.request.use((config) => {
  const token = loadSession()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (STORE_KEY) config.headers["x-store-key"] = STORE_KEY;
  if (STORE_DOMAIN) config.headers["x-store-domain"] = STORE_DOMAIN;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const rawReason = error.response?.data?.message;
    const msgLower = typeof rawReason === "string" ? rawReason.toLowerCase() : "";
    const isBlocked =
      Boolean(error.response?.data?.isBlocked) ||
      (status === 403 &&
        (msgLower.includes("block") ||
         msgLower.includes("banned") ||
         msgLower.includes("deactivat")));

    if (isBlocked) {
      const reason =
        typeof rawReason === "string" && rawReason.trim().length > 3
          ? rawReason.trim()
          : "Your account has been blocked. Please contact support.";
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
      localStorage.removeItem(CUSTOMER_USER_KEY);
      localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    } else {
      const requestHadToken = Boolean(error.config?.headers?.Authorization);
      const isAuthRoute = error.config?.url?.includes("/auth/");

      if (
        status === 401 &&
        requestHadToken &&
        !isAuthRoute &&
        !isHandlingUnauthorized
      ) {
        isHandlingUnauthorized = true;
        clearSession();
        unauthorizedHandler?.();
        queueMicrotask(() => {
          isHandlingUnauthorized = false;
        });
      }
    }

    return Promise.reject(error);
  },
);

export default api;
