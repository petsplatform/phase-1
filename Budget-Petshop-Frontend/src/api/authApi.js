import api from "./axios";
import { clearSession, loadCustomer, loadSession, saveSession, updateStoredCustomer } from "./sessionStorage";

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
    return saveSession(token, customer);
  },

  login: async ({ email, password }) => {
    const res = await api.post("/customer-panel/auth/login", { email, password });
    const { token, customer } = res.data.data;
    return saveSession(token, customer);
  },

  requestLoginOtp: async ({ email }) => {
    const res = await api.post("/customer-panel/auth/login/request-otp", { email });
    return res.data.data;
  },

  verifyLoginOtp: async ({ otpToken, code }) => {
    const res = await api.post("/customer-panel/auth/login/verify-otp", { otpToken, code });
    const { token, customer } = res.data.data;
    return saveSession(token, customer);
  },

  checkoutContact: async ({ name, email, phone }) => {
    const res = await api.post("/customer-panel/auth/checkout-contact", {
      name,
      email,
      phone,
    });
    const { token, customer } = res.data.data;
    return saveSession(token, customer);
  },

  logout: () => {
    clearSession();
  },

  getSession: loadSession,

  getCustomer: loadCustomer,

  getProfile: async () => {
    const res = await api.get("/customer-panel/profile");
    const customer = res.data.data;
    updateStoredCustomer(customer);
    return customer;
  },

  changePassword: async (payload) => {
    const res = await api.post("/customer-panel/auth/change-password", payload);
    return res.data.data;
  },
};
