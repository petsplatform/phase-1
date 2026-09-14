import api from "./axios";
import { CUSTOMER_SESSION_KEY, CUSTOMER_USER_KEY } from "./axios";

const AUTH_CHANGE_EVENT = "happypetrx-auth-change";

const storeCustomerSession = (token, customer) => {
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ token, customer }));
  localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(customer));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  return { token, customer };
};

export const authApi = {
  register: async ({ name, email, password, phone }) => {
    const res = await api.post("/customer-panel/auth/register", {
      name,
      email,
      password,
      phone,
      addresses: [],
    });
    const { token, customer } = res.data.data;
    return storeCustomerSession(token, customer);
  },

  login: async ({ email, password }) => {
    const res = await api.post("/customer-panel/auth/login", { email, password });
    const { token, customer } = res.data.data;
    return storeCustomerSession(token, customer);
  },

  requestLoginOtp: async ({ email }) => {
    const res = await api.post("/customer-panel/auth/login/request-otp", { email });
    return res.data.data;
  },

  verifyLoginOtp: async ({ otpToken, code }) => {
    const res = await api.post("/customer-panel/auth/login/verify-otp", { otpToken, code });
    const { token, customer } = res.data.data;
    return storeCustomerSession(token, customer);
  },

  checkoutContact: async ({ name, email, phone }) => {
    const res = await api.post("/customer-panel/auth/checkout-contact", {
      name,
      email,
      phone,
    });
    const { token, customer } = res.data.data;
    return storeCustomerSession(token, customer);
  },

  requestCheckoutOtp: async ({ name, email, phone }) => {
    const res = await api.post("/customer-panel/auth/checkout-otp/request", {
      name,
      email,
      phone,
    });
    return res.data.data;
  },

  verifyCheckoutOtp: async ({ otpToken, code }) => {
    const res = await api.post("/customer-panel/auth/checkout-otp/verify", {
      otpToken,
      code,
    });
    const { token, customer } = res.data.data;
    return storeCustomerSession(token, customer);
  },

  storeCustomer: (customer) => {
    const session = authApi.getSession();
    if (!session?.token) return null;
    return storeCustomerSession(session.token, customer);
  },

  logout: () => {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    localStorage.removeItem(CUSTOMER_USER_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  },

  getSession: () => {
    try {
      const session = localStorage.getItem(CUSTOMER_SESSION_KEY);
      if (!session) return null;
      const parsed = JSON.parse(session);
      return parsed?.token ? parsed : null;
    } catch {
      return null;
    }
  },

  getCustomer: () => {
    const session = authApi.getSession();
    if (session?.customer) return session.customer;

    try {
      const customer = localStorage.getItem(CUSTOMER_USER_KEY);
      return customer ? JSON.parse(customer) : null;
    } catch {
      return null;
    }
  },

  getProfile: async () => {
    const res = await api.get("/customer-panel/profile");
    return res.data.data;
  },

  changePassword: async (payload) => {
    const res = await api.post("/customer-panel/auth/change-password", payload);
    return res.data.data;
  },
};
