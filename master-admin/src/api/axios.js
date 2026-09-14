import axios from "axios";
import { getAdminToken, getAdminStoreKey, clearAdminSession } from "../lib/api";
import { showToast } from "../lib/toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach token if available
api.interceptors.request.use(
  (config) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const storeKey = getAdminStoreKey();
    if (storeKey) {
      config.headers["x-store-key"] = storeKey;
    }
    if (String(config.method || "get").toLowerCase() === "get") {
      config.headers["Cache-Control"] = "no-cache";
      config.headers.Pragma = "no-cache";
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle auth errors globally
api.interceptors.response.use(
  (response) => {
    const suppressToast = response.config?.suppressToast;
    if (!suppressToast && response.data?.success === false) {
      const message = response.data?.message || "Something went wrong.";
      showToast({ type: "error", title: "Error", message });
    }
    return response;
  },
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/login');
    const suppressToast = error.config?.suppressToast;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (Array.isArray(error.response?.data?.errors)
        ? error.response.data.errors
            .map((item) => item.message || item.msg || item)
            .filter(Boolean)
            .join(", ")
        : "") ||
      error.message ||
      "Unable to connect to backend. Please try again.";

    if (!suppressToast) {
      showToast({
        type: "error",
        title: "Error",
        message,
      });
      error.toastShown = true;
    }

    if (error.response?.status === 401 && !isAuthRoute) {
      clearAdminSession();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
