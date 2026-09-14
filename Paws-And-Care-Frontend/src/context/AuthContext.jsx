import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { accountApi } from '../api/accountApi';
import { authApi } from '../api/authApi';
import { AUTH_CHANGE_EVENT, CUSTOMER_BLOCKED_REASON_KEY } from '../api/axios';
import { normalizeAddressForApi } from '../utils/addressPayload';

const AuthContext = createContext(null);

const withPawsFields = (customer) => {
  if (!customer) return null;
  return {
    ...customer,
    mobile: customer.mobile || customer.phone || '',
    joinedDate: customer.joinedDate || customer.joined || '',
    addresses: (customer.addresses || []).map((address) => normalizeAddressForApi(address, {
      fullName: customer.name,
      mobile: customer.mobile || customer.phone,
    })),
    avatar: customer.avatar || '',
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState(() => (authApi.getSession()?.token ? 'checking' : 'guest'));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      const session = authApi.getSession();
      if (!session?.token) {
        setUser(null);
        setAuthStatus('guest');
        return;
      }
      setUser(withPawsFields(session.customer));
      setAuthStatus('authenticated');
    };
    window.addEventListener('storage', syncUser);
    window.addEventListener(AUTH_CHANGE_EVENT, syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncUser);
    };
  }, []);

  const checkBlockedStatus = useCallback(() => {
    const session = authApi.getSession();
    if (!session?.token) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      return;
    }

    accountApi
      .getProfile()
      .then((profile) => {
        if (profile) {
          const normalized = withPawsFields(profile);
          authApi.storeCustomer(normalized);
          setUser(normalized);
          setAuthStatus('authenticated');
        }
      })
      .catch((err) => {
        const rawReason = err?.response?.data?.message || err?.message || "";
        const rawMsg = typeof rawReason === "string" ? rawReason.toLowerCase() : "";
        const isBlocked =
          Boolean(err?.response?.data?.isBlocked) ||
          rawMsg.includes("blocked") ||
          rawMsg.includes("deactivated") ||
          rawMsg.includes("suspended");
        if (isBlocked) {
          const reason =
            typeof rawReason === 'string' && rawReason.trim().length > 3
              ? rawReason.trim()
              : 'Your account has been blocked. Please contact support.';
          localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
          authApi.logout();
          setUser(null);
          setAuthStatus('guest');
        }
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const session = authApi.getSession();
    if (!session?.token) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      return undefined;
    }

    setAuthStatus('checking');
    accountApi
      .getProfile()
      .then((profile) => {
        if (cancelled) return;
        const normalized = withPawsFields(profile);
        authApi.storeCustomer(normalized);
        setUser(normalized);
        setAuthStatus('authenticated');
      })
      .catch((err) => {
        if (cancelled) return;
        const rawReason = err?.response?.data?.message || err?.message || "";
        const rawMsg = typeof rawReason === "string" ? rawReason.toLowerCase() : "";
        const isBlocked =
          Boolean(err?.response?.data?.isBlocked) ||
          rawMsg.includes("blocked") ||
          rawMsg.includes("deactivated") ||
          rawMsg.includes("suspended");
        if (isBlocked) {
          const reason =
            typeof rawReason === 'string' && rawReason.trim().length > 3
              ? rawReason.trim()
              : 'Your account has been blocked. Please contact support.';
          localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
        }
        authApi.logout();
        setUser(null);
        setAuthStatus('guest');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const requestLoginOtp = (payload) => authApi.requestLoginOtp(payload);

  const verifyLoginOtp = async (payload) => {
    const customer = await authApi.verifyLoginOtp(payload);
    setUser(withPawsFields(customer));
    setAuthStatus('authenticated');
    return customer;
  };

  const loginUser = async (email, codePayload) => {
    if (codePayload?.otpToken && codePayload?.code) {
      return verifyLoginOtp(codePayload);
    }
    const data = await requestLoginOtp({ email });
    return data;
  };

  const loginDemo = async (userData) => {
    const customer = await authApi.checkoutContact({
      name: [userData.firstName, userData.lastName].filter(Boolean).join(' ') || userData.name,
      email: userData.email,
      phone: userData.mobile || userData.phone,
    });
    setUser(withPawsFields(customer));
    setAuthStatus('authenticated');
    return customer;
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setAuthStatus('guest');
  };

  const updateProfile = async (updatedData) => {
    const apiPayload = { ...updatedData };
    delete apiPayload.avatar;
    const profile = await accountApi.updateProfile(apiPayload);
    const normalized = withPawsFields(profile);
    authApi.storeCustomer(normalized);
    setUser(normalized);
    return normalized;
  };

  const uploadAvatar = async (file) => {
    const profile = await accountApi.uploadAvatar(file);
    const normalized = withPawsFields(profile);
    authApi.storeCustomer(normalized);
    setUser(normalized);
    return normalized;
  };

  const removeAvatar = async () => {
    const profile = await accountApi.removeAvatar();
    const normalized = withPawsFields(profile);
    authApi.storeCustomer(normalized);
    setUser(normalized);
    return normalized;
  };

  const saveAddress = async (address) => {
    const addresses = await accountApi.addAddress(address);
    setUser((prev) => {
      const next = withPawsFields({ ...prev, addresses });
      authApi.storeCustomer(next);
      return next;
    });
    return addresses;
  };

  const updateAddress = async (index, address) => {
    const addresses = await accountApi.updateAddress(index, address);
    setUser((prev) => {
      const next = withPawsFields({ ...prev, addresses });
      authApi.storeCustomer(next);
      return next;
    });
    return addresses;
  };

  const deleteAddress = async (streetAddressOrIndex) => {
    const index =
      typeof streetAddressOrIndex === 'number'
        ? streetAddressOrIndex
        : (user?.addresses || []).findIndex((address) => address.streetAddress === streetAddressOrIndex);
    if (index < 0) return [];
    const addresses = await accountApi.removeAddress(index);
    setUser((prev) => {
      const next = withPawsFields({ ...prev, addresses });
      authApi.storeCustomer(next);
      return next;
    });
    return addresses;
  };

  const checkoutContact = async (contactPayload) => {
    const session = await authApi.checkoutContact(contactPayload);
    if (session?.customer) {
      const normalized = withPawsFields(session.customer);
      authApi.storeCustomer(normalized);
      setUser(normalized);
      setAuthStatus('authenticated');
    }
    return session;
  };

  const value = {
    user,
    authStatus,
    checkBlockedStatus,
    loginDemo,
    loginUser,
    checkoutContact,
    requestLoginOtp,
    verifyLoginOtp,
    logout,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    saveAddress,
    updateAddress,
    deleteAddress,
    showLogoutConfirm,
    setShowLogoutConfirm,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
