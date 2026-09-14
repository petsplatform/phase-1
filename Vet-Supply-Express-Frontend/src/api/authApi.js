import api from "./axios";
import {
  clearAuthStorage,
  getStoredSession,
  storeCustomerSession,
} from "./authStorage";

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
    clearAuthStorage({ reason: "logout" });
  },

  getSession: () => {
    return getStoredSession();
  },

  getCustomer: () => {
    const session = authApi.getSession();
    return session?.customer || null;
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
