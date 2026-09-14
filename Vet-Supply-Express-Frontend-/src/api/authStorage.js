export const CUSTOMER_SESSION_KEY = "vetsupplyexpress_customer_session";
export const CUSTOMER_USER_KEY = "vetsupplyexpress_auth_user";
export const CUSTOMER_BLOCKED_REASON_KEY = "vetsupplyexpress_blocked_reason";
export const CUSTOMER_SESSION_EXPIRED_KEY = "vetsupplyexpress_session_expired";
export const AUTH_CHANGE_EVENT = "vetsupplyexpress-auth-change";

const LEGACY_AUTH_KEYS = [
  "vet_user",
  "happypetrx_customer_session",
  "happypetrx_auth_user",
];

export const getStoredSession = () => {
  try {
    const session = localStorage.getItem(CUSTOMER_SESSION_KEY);
    if (!session) return null;

    const parsed = JSON.parse(session);
    return parsed?.token && parsed?.customer ? parsed : null;
  } catch {
    return null;
  }
};

export const hasStoredAuthToken = () => Boolean(getStoredSession()?.token);

export const dispatchAuthChange = (detail = {}) => {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail }));
};

export const storeCustomerSession = (token, customer, detail = {}) => {
  const session = { token, customer };
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
  localStorage.removeItem(CUSTOMER_USER_KEY);
  localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
  LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  dispatchAuthChange({ reason: "login", ...detail });
  return session;
};

export const clearAuthStorage = (detail = {}) => {
  localStorage.removeItem(CUSTOMER_SESSION_KEY);
  localStorage.removeItem(CUSTOMER_USER_KEY);
  LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  if (detail.reason !== "blocked") {
    localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
  }
  dispatchAuthChange(detail);
};
