import { getCustomerToken } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORE_KEY = import.meta.env.VITE_STORE_KEY || "STORE_3";
const STORE_DOMAIN = import.meta.env.VITE_STORE_DOMAIN || "";

async function request(path, options = {}) {
  const token = getCustomerToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (STORE_KEY) headers["x-store-key"] = STORE_KEY;
  if (STORE_DOMAIN) headers["x-store-domain"] = STORE_DOMAIN;

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (!response.ok || json.success === false) {
    const rawReason = json.message || json.error || "";
    const rawMsg = typeof rawReason === "string" ? rawReason.toLowerCase() : "";
    const isExplicitlyBlocked = Boolean(json?.isBlocked);
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
      window.localStorage.setItem("healthyPaws.auth.blocked_reason", reason);
      window.localStorage.removeItem("healthyPaws.auth.token");
      window.sessionStorage.removeItem("healthyPaws.auth.token");
      window.localStorage.removeItem("healthyPaws.auth.user");
      window.sessionStorage.removeItem("healthyPaws.auth.user");
      window.dispatchEvent(new Event("healthyPawsAuthChange"));
    } else {
      if (!token) {
        window.localStorage.removeItem("healthyPaws.auth.blocked_reason");
      }
      if (response.status === 401 && token) {
        window.localStorage.setItem("healthyPaws.auth.session_expired", "true");
        window.localStorage.removeItem("healthyPaws.auth.token");
        window.sessionStorage.removeItem("healthyPaws.auth.token");
        window.localStorage.removeItem("healthyPaws.auth.user");
        window.sessionStorage.removeItem("healthyPaws.auth.user");
        window.dispatchEvent(new Event("healthyPawsAuthChange"));
      }
    }
    const error = new Error(json.message || json.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.response = { data: json, status: response.status };
    throw error;
  }

  return {
    data: json,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
}

const api = {
  get: (url, config = {}) => request(url, { ...config, method: "GET" }),
  post: (url, body, config = {}) => request(url, { ...config, method: "POST", body: JSON.stringify(body) }),
  put: (url, body, config = {}) => request(url, { ...config, method: "PUT", body: JSON.stringify(body) }),
  patch: (url, body, config = {}) => request(url, { ...config, method: "PATCH", body: JSON.stringify(body) }),
  delete: (url, config = {}) => request(url, { ...config, method: "DELETE" }),
};

export default api;
