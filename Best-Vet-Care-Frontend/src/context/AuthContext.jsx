/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(() => authApi.getCustomer());
  const activeCustomer = authApi.getSession() ? customer : null;

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setCustomer(data);
    return data;
  }, []);

  const checkLoginMethod = useCallback((payload) => authApi.checkLoginMethod(payload), []);

  const requestLoginOtp = useCallback((payload) => authApi.requestLoginOtp(payload), []);

  const verifyLoginOtp = useCallback(async (payload) => {
    const data = await authApi.verifyLoginOtp(payload);
    setCustomer(data);
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    const data = await authApi.register(userData);
    setCustomer(data);
    return data;
  }, []);

  const checkoutContact = useCallback(async (contactData) => {
    const data = await authApi.checkoutContact(contactData);
    setCustomer(data);
    return data;
  }, []);

  const requestCheckoutOtp = useCallback((payload) => authApi.requestCheckoutOtp(payload), []);

  const verifyCheckoutOtp = useCallback(async (payload) => {
    const data = await authApi.verifyCheckoutOtp(payload);
    setCustomer(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setCustomer(null);
  }, []);

  useEffect(() => {
    const syncUser = () => setCustomer(authApi.getCustomer());
    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("petcare-auth-change", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("petcare-auth-change", syncUser);
    };
  }, []);

  useEffect(() => {
    if (!authApi.getSession()) return;
    let cancelled = false;
    authApi.getProfile()
      .then((profile) => {
        if (cancelled) return;
        authApi.storeCustomer(profile);
        setCustomer(profile);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeCustomer?.id]);

  const value = useMemo(
    () => ({
      customer: activeCustomer,
      isLoggedIn: Boolean(activeCustomer),
      login,
      checkLoginMethod,
      requestLoginOtp,
      verifyLoginOtp,
      register,
      checkoutContact,
      requestCheckoutOtp,
      verifyCheckoutOtp,
      logout,
    }),
    [
      activeCustomer,
      login,
      checkLoginMethod,
      requestLoginOtp,
      verifyLoginOtp,
      register,
      checkoutContact,
      requestCheckoutOtp,
      verifyCheckoutOtp,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
