export const CUSTOMER_SESSION_KEY = "budget_petshop_customer_session";
export const CUSTOMER_USER_KEY = "budget_petshop_auth_user";
export const CUSTOMER_BLOCKED_REASON_KEY = "budget_petshop_blocked_reason";
export const AUTH_CHANGE_EVENT = "auth-state-change";

const LEGACY_AUTH_KEYS = [
  "isAuthenticated",
  "userEmail",
  "userName",
  "userPhone",
  "userAvatar",
  "userGender",
  "userDob",
];

export const saveSession = (token, customer = {}) => {
  localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ token, customer }));
  localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(customer));
  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("userName", customer.name || "");
  localStorage.setItem("userEmail", customer.email || "");
  localStorage.setItem("userPhone", customer.phone || "");
  localStorage.setItem("userAvatar", customer.avatar || customer.avatarUrl || "");
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  return { token, customer };
};

export const loadSession = () => {
  try {
    const session = localStorage.getItem(CUSTOMER_SESSION_KEY);
    const parsed = session ? JSON.parse(session) : null;
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
};

export const loadCustomer = () => {
  const session = loadSession();
  if (session?.customer) return session.customer;

  try {
    const customer = localStorage.getItem(CUSTOMER_USER_KEY);
    return customer ? JSON.parse(customer) : null;
  } catch {
    return null;
  }
};

export const updateStoredCustomer = (customer = {}) => {
  const session = loadSession();
  if (session?.token) {
    saveSession(session.token, customer);
  } else {
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(customer));
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
  return customer;
};

export const clearSession = () => {
  localStorage.removeItem(CUSTOMER_SESSION_KEY);
  localStorage.removeItem(CUSTOMER_USER_KEY);
  LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  sessionStorage.clear();
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};
