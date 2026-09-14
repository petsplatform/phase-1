const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORE_KEY = import.meta.env.VITE_STORE_KEY || "STORE_3";
const STORE_DOMAIN = import.meta.env.VITE_STORE_DOMAIN || "";
export const TOKEN_KEY = "healthyPaws.auth.token";
export const AUTH_USER_KEY = "healthyPaws.auth.user";
export const CUSTOMER_BLOCKED_REASON_KEY = "healthyPaws.auth.blocked_reason";
export const CUSTOMER_SESSION_EXPIRED_KEY = "healthyPaws.auth.session_expired";
export const AUTH_CHANGE_EVENT = "healthyPawsAuthChange";

function parseJwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

export function isUsableCustomerToken(token) {
  const payload = parseJwtPayload(token);
  if (!payload) return false;
  if (payload.exp && payload.exp * 1000 <= Date.now()) return false;
  return true;
}

export function getCustomerToken() {
  if (typeof window === "undefined") return "";
  const token =
    window.localStorage.getItem(TOKEN_KEY) ||
    window.sessionStorage.getItem(TOKEN_KEY) ||
    "";

  if (!token) return "";
  if (isUsableCustomerToken(token)) return token;

  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.sessionStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  return "";
}

export function setCustomerToken(token, remember = true) {
  if (typeof window === "undefined" || !token) return;
  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;
  storage.setItem(TOKEN_KEY, token);
  otherStorage.removeItem(TOKEN_KEY);
}

export function clearCustomerToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

function buildHeaders(headers = {}, body, { skipAuth = false } = {}) {
  const nextHeaders = { ...headers };
  const token = skipAuth ? "" : getCustomerToken();

  if (!(body instanceof FormData) && !nextHeaders["Content-Type"]) {
    nextHeaders["Content-Type"] = "application/json";
  }
  if (token) nextHeaders.Authorization = `Bearer ${token}`;
  if (STORE_KEY) nextHeaders["x-store-key"] = STORE_KEY;
  if (STORE_DOMAIN) nextHeaders["x-store-domain"] = STORE_DOMAIN;

  return nextHeaders;
}

export async function apiRequest(path, options = {}) {
  const { skipAuth = false, ...requestOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: buildHeaders(requestOptions.headers, requestOptions.body, { skipAuth }),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok || payload.success === false) {
    const rawReason = payload.message || payload.error || "";
    const rawMsg = typeof rawReason === "string" ? rawReason.toLowerCase() : "";
    const token = getCustomerToken();
    const isExplicitlyBlocked = Boolean(payload?.isBlocked);
    const hasBlockedKeyword =
      rawMsg.includes("blocked") ||
      rawMsg.includes("deactivated") ||
      rawMsg.includes("suspended");

    const isBlocked =
      Boolean(token) &&
      (isExplicitlyBlocked || (response.status === 403 && hasBlockedKeyword));

    if (isBlocked) {
      const reason =
        typeof rawReason === "string" && rawReason.trim().length > 3
          ? rawReason.trim()
          : "Your account has been blocked. Please contact support.";
      window.localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
      clearCustomerToken();
      window.localStorage.removeItem(AUTH_USER_KEY);
      window.sessionStorage.removeItem(AUTH_USER_KEY);
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    } else {
      if (!token) {
        window.localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      }
      if (response.status === 401 && token) {
        window.localStorage.setItem(CUSTOMER_SESSION_EXPIRED_KEY, "true");
        clearCustomerToken();
        window.localStorage.removeItem(AUTH_USER_KEY);
        window.sessionStorage.removeItem(AUTH_USER_KEY);
        window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      }
    }
    const error = new Error(payload.message || payload.error || "API request failed.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  if (window.localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY)) {
    window.localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }

  return payload.data ?? payload;
}
