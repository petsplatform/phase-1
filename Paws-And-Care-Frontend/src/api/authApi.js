import api, { AUTH_CHANGE_EVENT, CUSTOMER_SESSION_KEY, CUSTOMER_USER_KEY } from './axios';

const storeCustomerSession = (token, customer) => {
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ token, customer }));
  localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(customer));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const authApi = {
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
  checkoutContact: async ({ name, email, phone }) => {
    const res = await api.post('/customer-panel/auth/checkout-contact', { name, email, phone });
    const { token, customer } = res.data.data;
    storeCustomerSession(token, customer);
    return customer;
  },
  logout: () => {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    localStorage.removeItem(CUSTOMER_USER_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  },
  storeCustomer: (customer) => {
    const session = authApi.getSession();
    if (session?.token) storeCustomerSession(session.token, customer);
  },
  getSession: () => {
    try {
      const session = localStorage.getItem(CUSTOMER_SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  },
  getCustomer: () => authApi.getSession()?.customer || null,
};
