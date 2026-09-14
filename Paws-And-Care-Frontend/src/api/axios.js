export const CUSTOMER_SESSION_KEY = 'paws_care_customer_session';
export const CUSTOMER_USER_KEY = 'paws_care_auth_user';
export const CUSTOMER_BLOCKED_REASON_KEY = 'paws_care_blocked_reason';
export const CUSTOMER_SESSION_EXPIRED_KEY = 'paws_care_session_expired';
export const AUTH_CHANGE_EVENT = 'paws-care-auth-change';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STORE_KEY = import.meta.env.VITE_STORE_KEY || 'STORE_2';
const STORE_DOMAIN = import.meta.env.VITE_STORE_DOMAIN || '';

const getToken = () => {
  try {
    const session = localStorage.getItem(CUSTOMER_SESSION_KEY);
    return session ? JSON.parse(session)?.token : null;
  } catch {
    return null;
  }
};

const buildUrl = (url, params) => {
  const base = BASE_URL.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  const requestUrl = new URL(`${base}${path}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      requestUrl.searchParams.set(key, value);
    }
  });
  return requestUrl.toString();
};

const request = async (url, options = {}) => {
  const { params, body, headers, ...fetchOptions } = options;
  const token = getToken();
  const isFormData = body instanceof FormData;
  const reqHeaders = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(STORE_KEY ? { 'x-store-key': STORE_KEY } : {}),
    ...(STORE_DOMAIN ? { 'x-store-domain': STORE_DOMAIN } : {}),
    ...headers,
  };

  if (isFormData) {
    delete reqHeaders['Content-Type'];
    delete reqHeaders['content-type'];
  }

  const response = await fetch(buildUrl(url, params), {
    ...fetchOptions,
    headers: reqHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const rawReason = data?.message || data?.error || "";
    const rawMsg = typeof rawReason === "string" ? rawReason.toLowerCase() : "";
    const isExplicitlyBlocked = Boolean(data?.isBlocked);
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
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
      localStorage.removeItem(CUSTOMER_USER_KEY);
      localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    } else {
      if (!token) {
        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      }
      if (response.status === 401 && token && !url.includes("/auth/")) {
        localStorage.removeItem(CUSTOMER_SESSION_KEY);
        localStorage.removeItem(CUSTOMER_USER_KEY);
        localStorage.setItem(CUSTOMER_SESSION_EXPIRED_KEY, "true");
        window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      }
    }
    const err = new Error(data.message || data.error || "API request failed");
    err.response = { status: response.status, data };
    throw err;
  }
  return { data };
};

const api = {
  get: (url, options) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options) => request(url, { ...options, method: 'POST', body }),
  put: (url, body, options) => request(url, { ...options, method: 'PUT', body }),
  patch: (url, body, options) => request(url, { ...options, method: 'PATCH', body }),
  delete: (url, options) => request(url, { ...options, method: 'DELETE' }),
};

export default api;
