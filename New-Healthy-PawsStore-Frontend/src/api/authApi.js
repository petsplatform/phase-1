import {
  apiRequest,
  AUTH_USER_KEY,
  CUSTOMER_BLOCKED_REASON_KEY,
  clearCustomerToken,
  getCustomerToken,
  isUsableCustomerToken,
  setCustomerToken,
  TOKEN_KEY,
} from "./client";

export { AUTH_USER_KEY };

export function normalizeUser(data = {}, fallbackEmail = "") {
  const user = data.user || data.customer || data.account || data.profile || data;

  return {
    name:
      user.name ||
      user.fullName ||
      user.firstName ||
      fallbackEmail.split("@")[0] ||
      "Pet Parent",
    email: user.email || fallbackEmail,
    phone: user.phone || "",
    avatar: user.avatar || user.image || "",
  };
}

export function getStoredAuthUser() {
  try {
    const rawUser =
      window.localStorage.getItem(AUTH_USER_KEY) ||
      window.sessionStorage.getItem(AUTH_USER_KEY);

    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function getTokenStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY)
    ? window.localStorage
    : window.sessionStorage.getItem(TOKEN_KEY)
      ? window.sessionStorage
      : null;
}

function saveVerifiedUser(user) {
  const storage = getTokenStorage();
  if (!storage) return null;

  window.localStorage.removeItem(AUTH_USER_KEY);
  window.sessionStorage.removeItem(AUTH_USER_KEY);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("healthyPawsAuthChange"));
  return user;
}

export function updateStoredAuthUser(profile) {
  return saveVerifiedUser(normalizeUser(profile));
}

export function saveAuthSession(data, { email, remember }) {
  const token = data.token || data.accessToken || data.authToken || "";
  const user = normalizeUser(data.customer ? data : data.data || data, email);
  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;

  window.localStorage.removeItem(AUTH_USER_KEY);
  window.sessionStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);

  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  otherStorage.removeItem(AUTH_USER_KEY);
  if (token) setCustomerToken(token, remember);

  window.dispatchEvent(new Event("healthyPawsAuthChange"));
  return user;
}

export function logout() {
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.sessionStorage.removeItem(AUTH_USER_KEY);
  clearCustomerToken();
  window.dispatchEvent(new Event("healthyPawsAuthChange"));
}

export async function verifyAuthSession() {
  const token = getCustomerToken();
  if (!token || !isUsableCustomerToken(token)) {
    logout();
    return null;
  }

  try {
    const profile = await apiRequest("/customer-panel/profile");
    window.localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    return saveVerifiedUser(normalizeUser(profile));
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      logout();
    }
    throw error;
  }
}

export const authApi = {
  verifyAuthSession,

  requestLoginOtp({ email }) {
    return apiRequest("/customer-panel/auth/login/request-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async verifyLoginOtp({ otpToken, code, email, remember = true }) {
    const data = await apiRequest("/customer-panel/auth/login/verify-otp", {
      method: "POST",
      body: JSON.stringify({ otpToken, code }),
    });
    saveAuthSession(data, { email, remember });
    return data;
  },

  async login({ email, password, remember }) {
    const data = await apiRequest("/customer-panel/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveAuthSession(data, { email, remember });
    return data;
  },

  async register(payload, remember = true) {
    const data = await apiRequest("/customer-panel/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    saveAuthSession(data, { email: payload.email, remember });
    return data;
  },

  async checkoutContact(payload, remember = true) {
    const data = await apiRequest("/customer-panel/auth/checkout-contact", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    saveAuthSession(data, { email: payload.email, remember });
    return data;
  },
};
