import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STORE_KEY = import.meta.env.VITE_STORE_KEY || 'STORE_1';
const STORE_DOMAIN = typeof window !== 'undefined' ? window.location.origin : '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const getToken = () => {
  try {
    const session = localStorage.getItem('petcare_customer_session');
    return session ? JSON.parse(session)?.token : null;
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (config.skipAuth) {
    delete config.headers.Authorization;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (STORE_KEY) config.headers['x-store-key'] = STORE_KEY;
  if (STORE_DOMAIN) config.headers['x-store-domain'] = STORE_DOMAIN;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestHadToken = Boolean(error.config?.headers?.Authorization);
    const isCustomerAuthRoute = error.config?.url?.includes('/customer-panel/auth/');

    const status = error.response?.status;

    const isBlockedAccount = status === 403 && error.response?.data?.isBlocked;

    if ((status === 401 || isBlockedAccount) && requestHadToken && !isCustomerAuthRoute) {
      const session = localStorage.getItem('petcare_customer_session');
      if (session) {
        localStorage.removeItem('petcare_customer_session');
        localStorage.removeItem('petcare_auth_user');
        if (isBlockedAccount) {
          const reason = error.response?.data?.message || 'Your account has been blocked. Please contact support.';
          localStorage.setItem('petcare_blocked_reason', reason);
        } else {
          localStorage.setItem('petcare_session_expired', 'true');
        }
        window.dispatchEvent(new Event('petcare-auth-change'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
