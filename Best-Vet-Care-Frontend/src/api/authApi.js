import api from './axios';

const SESSION_KEY = 'petcare_customer_session';
const AUTH_USER_KEY = 'petcare_auth_user';
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const STORE_KEY = import.meta.env.VITE_STORE_KEY || 'STORE_1';
const PUBLIC_APP_URL = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
const SOCIAL_CALLBACK_PATH = import.meta.env.VITE_SOCIAL_AUTH_CALLBACK_PATH || '/auth/social/callback';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_USE_POPUP = String(import.meta.env.VITE_GOOGLE_USE_POPUP || '').toLowerCase() === 'true';

const storeCustomerSession = (token, customer) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, customer }));
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ name: customer.firstName || customer.name, email: customer.email, avatar: customer.avatar }));
  window.dispatchEvent(new Event('petcare-auth-change'));
};

const normalizeAuthPayload = (payload) => {
  const authData = payload?.data || payload;
  if (!authData?.token || !authData?.customer) {
    throw new Error('Social login did not return a valid customer session.');
  }
  return authData;
};

const getSocialCallbackUrl = () => new URL(SOCIAL_CALLBACK_PATH, PUBLIC_APP_URL).toString();

const getStoreDomain = () => {
  if (import.meta.env.VITE_STORE_DOMAIN) return import.meta.env.VITE_STORE_DOMAIN;
  return window.location.origin;
};

const getSocialStartUrl = (provider, mode) => {
  const configuredUrl = provider === 'google'
    ? import.meta.env.VITE_GOOGLE_AUTH_URL
    : import.meta.env.VITE_APPLE_AUTH_URL;

  const url = new URL(
    configuredUrl || `${API_BASE_URL}/customer-panel/auth/social/${provider}/start`,
  );
  url.searchParams.set('redirectUri', getSocialCallbackUrl());
  url.searchParams.set('mode', mode);
  if (STORE_KEY) url.searchParams.set('storeKey', STORE_KEY);
  url.searchParams.set('storeDomain', getStoreDomain());
  return url.toString();
};

const loadGoogleIdentityScript = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.oauth2) {
    resolve();
    return;
  }

  const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
  if (existingScript) {
    existingScript.addEventListener('load', resolve, { once: true });
    existingScript.addEventListener('error', () => reject(new Error('Could not load Google login.')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = resolve;
  script.onerror = () => reject(new Error('Could not load Google login.'));
  document.head.appendChild(script);
});

const requestGoogleAuthCode = async () => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google login is missing VITE_GOOGLE_CLIENT_ID in frontend .env.');
  }

  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    if (import.meta.env.DEV) {
      console.info("Starting Google login", {
        origin: window.location.origin,
        clientId: GOOGLE_CLIENT_ID,
        redirectUri: "postmessage",
      });
    }

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      ux_mode: 'popup',
      prompt: 'select_account',
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        if (!response.code) {
          reject(new Error('Google did not return an authorization code.'));
          return;
        }
        resolve(response.code);
      },
      error_callback: (error) => {
        const errorType = error?.type || "";
        if (errorType === 'popup_failed_to_open') {
          reject(new Error('Please allow popups for this site and try Google login again.'));
          return;
        }
        if (errorType === 'popup_closed') {
          reject(new Error('Google sign-in was cancelled.'));
          return;
        }
        reject(new Error(error?.message || errorType || 'Google login popup failed. Make sure this site origin is allowed in Google Cloud Console.'));
      },
    });
    client.requestCode();
  });
};

const ensureAuthUser = (customer) => {
  if (!customer) return;
  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({
      name: customer.firstName || customer.name,
      email: customer.email,
      avatar: customer.avatar,
    }),
  );
};

export const authApi = {
  login: async ({ email, password }) => {
    const res = await api.post('/customer-panel/auth/login', { email, password });
    const { token, customer } = res.data.data;
    storeCustomerSession(token, customer);
    return customer;
  },

  checkLoginMethod: async ({ email }) => {
    const res = await api.post('/customer-panel/auth/check-login-method', { email });
    return res.data.data;
  },

  requestLoginOtp: async ({ email }) => {
    const res = await api.post('/customer-panel/auth/login/request-otp', { email });
    return res.data.data;
  },

  verifyLoginOtp: async ({ otpToken, code }) => {
    const res = await api.post('/customer-panel/auth/login/verify-otp', { otpToken, code });
    const { token, customer } = res.data.data;
    storeCustomerSession(token, customer);
    return customer;
  },

  forgotPassword: async ({ email }) => {
    const res = await api.post('/customer-panel/auth/forgot-password', { email });
    return res.data.data;
  },

  resetPassword: async ({ otpToken, code, password, confirmPassword }) => {
    const res = await api.post('/customer-panel/auth/reset-password', { otpToken, code, password, confirmPassword });
    return res.data.data;
  },

  getPasswordStatus: async () => {
    const res = await api.get('/customer-panel/auth/password-status');
    return res.data.data;
  },

  setPassword: async ({ password, confirmPassword }) => {
    const res = await api.post('/customer-panel/auth/set-password', { password, confirmPassword });
    return res.data.data;
  },

  changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    const res = await api.post('/customer-panel/auth/change-password', { currentPassword, newPassword, confirmPassword });
    return res.data.data;
  },

  register: async ({ name, email, phone, password }) => {
    const res = await api.post('/customer-panel/auth/register', { name, email, phone, password });
    const { token, customer } = res.data.data;
    storeCustomerSession(token, customer);
    return customer;
  },

  startSocialLogin: async ({ provider, mode = 'login' }) => {
    if (!['google', 'apple'].includes(provider)) {
      throw new Error('Unsupported social login provider.');
    }
    sessionStorage.setItem('petcare_social_provider', provider);
    sessionStorage.setItem('petcare_social_auth_mode', mode);

    if (provider === 'google' && GOOGLE_USE_POPUP) {
      const code = await requestGoogleAuthCode();
      return authApi.completeSocialLogin({
        provider: 'google',
        code,
        redirectUri: 'postmessage',
      });
    }

    const url = new URL(getSocialStartUrl(provider, mode));
    url.searchParams.set('format', 'json');
    const res = await api.get(url.toString(), { skipAuth: true });
    const authUrl = res.data?.data?.authUrl;
    if (!authUrl) throw new Error('Social login did not return an authorization URL.');
    window.location.assign(authUrl);
  },

  completeSocialLogin: async ({ provider, code, state, token, customer, redirectUri }) => {
    if (token && customer) {
      const authData = normalizeAuthPayload({ token, customer });
      storeCustomerSession(authData.token, authData.customer);
      return authData.customer;
    }

    const res = await api.post('/customer-panel/auth/social/callback', {
      provider,
      code,
      state,
      redirectUri: redirectUri || getSocialCallbackUrl(),
      mode: sessionStorage.getItem('petcare_social_auth_mode') || 'login',
    });
    const authData = normalizeAuthPayload(res.data);
    storeCustomerSession(authData.token, authData.customer);
    sessionStorage.removeItem('petcare_social_auth_mode');
    sessionStorage.removeItem('petcare_social_provider');
    return authData.customer;
  },

  checkoutContact: async ({ name, email, phone }) => {
    const res = await api.post('/customer-panel/auth/checkout-contact', { name, email, phone });
    const { token, customer } = res.data.data;
    storeCustomerSession(token, customer);
    return customer;
  },

  requestCheckoutOtp: async ({ name, email, phone }) => {
    const res = await api.post('/customer-panel/auth/checkout-otp/request', { name, email, phone });
    return res.data.data;
  },

  verifyCheckoutOtp: async ({ otpToken, code }) => {
    const res = await api.post('/customer-panel/auth/checkout-otp/verify', { otpToken, code });
    const { token, customer } = res.data.data;
    storeCustomerSession(token, customer);
    return customer;
  },

  storeCustomer: (customer) => {
    const session = authApi.getSession();
    if (!session?.token) return;
    storeCustomerSession(session.token, customer);
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    window.dispatchEvent(new Event('petcare-auth-change'));
  },

  getSession: () => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (!session) return null;
      const parsedSession = JSON.parse(session);
      if (!parsedSession?.token) return null;

      // Decode JWT payload and check expiration
      let isExpired = false;
      try {
        const parts = parsedSession.token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            isExpired = true;
          }
        } else {
          isExpired = true;
        }
      } catch {
        isExpired = true;
      }

      if (isExpired) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.setItem('petcare_session_expired', 'true');
        window.dispatchEvent(new Event('petcare-auth-change'));
        return null;
      }

      if (!localStorage.getItem(AUTH_USER_KEY)) {
        ensureAuthUser(parsedSession.customer);
      }
      return parsedSession;
    } catch {
      return null;
    }
  },

  getCustomer: () => {
    const session = authApi.getSession();
    return session?.customer || null;
  },

  getProfile: async () => {
    const res = await api.get('/customer-panel/profile');
    return res.data.data;
  },
};
