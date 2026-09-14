import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { setUnauthorizedHandler } from "../api/axios";
import {
  AUTH_CHANGE_EVENT,
  CUSTOMER_BLOCKED_REASON_KEY,
  clearSession,
  loadSession,
  saveSession,
  updateStoredCustomer,
} from "../api/sessionStorage";
import { useNotification } from "./NotificationContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  let showNotification = () => {};
  try {
    const notifyCtx = useNotification();
    if (notifyCtx?.showNotification) {
      showNotification = notifyCtx.showNotification;
    }
  } catch {
    // Fallback if NotificationProvider is not in tree
  }
  const [authStatus, setAuthStatus] = useState("checking");
  const [user, setUser] = useState(null);

  const setAuthenticatedSession = useCallback((session) => {
    const saved = saveSession(session.token, session.customer);
    setUser(saved.customer);
    setAuthStatus("authenticated");
    return saved;
  }, []);

  const logout = useCallback((redirectTo = "/login") => {
    clearSession();
    setUser(null);
    setAuthStatus("guest");
    if (redirectTo) navigate(redirectTo, { replace: true });
  }, [navigate]);

  const bootstrapAuth = useCallback(async () => {
    const storedSession = loadSession();
    if (!storedSession?.token) {
      clearSession();
      setUser(null);
      setAuthStatus("guest");
      return;
    }

    setAuthStatus("checking");
    try {
      const profile = await authApi.getProfile();
      const customer = updateStoredCustomer(profile);
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      setUser(customer);
      setAuthStatus("authenticated");
    } catch (err) {
      const isBlocked =
        err.response?.status === 403 || Boolean(err.response?.data?.isBlocked);
      const rawReason = err.response?.data?.message;
      const reason =
        typeof rawReason === "string" && rawReason.trim().length > 3
          ? rawReason.trim()
          : "Your account has been blocked. Please contact support.";
      clearSession();
      if (isBlocked) {
        localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
      } else {
        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      }
      setUser(null);
      setAuthStatus("guest");
    }
  }, []);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  // Verify auth session and forcefully log out blocked user on route navigation change
  useEffect(() => {
    const session = loadSession();
    if (!session?.token) return;

    let isMounted = true;
    authApi
      .getProfile()
      .then((profile) => {
        if (isMounted && profile) {
          const updated = updateStoredCustomer(profile);
          localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
          setUser(updated);
          setAuthStatus("authenticated");
        }
      })
      .catch((err) => {
        const isBlocked =
          err.response?.status === 403 || Boolean(err.response?.data?.isBlocked);
        const rawReason = err.response?.data?.message;
        const reason =
          typeof rawReason === "string" && rawReason.trim().length > 3
            ? rawReason.trim()
            : "Your account has been blocked. Please contact support.";
        clearSession();
        if (isBlocked) {
          localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
        } else {
          localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
        }
        if (isMounted) {
          setUser(null);
          setAuthStatus("guest");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    const syncFromSession = () => {
      const session = loadSession();
      if (session?.token && session.customer) {
        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
        setUser(session.customer);
        setAuthStatus("authenticated");
        return;
      }

      const blockedReason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
      if (blockedReason) {
        setUser(null);
        setAuthStatus("guest");
        return;
      }

      setUser(null);
      setAuthStatus("guest");
    };

    window.addEventListener(AUTH_CHANGE_EVENT, syncFromSession);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, syncFromSession);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setAuthStatus("guest");
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  const updateUser = useCallback((customer) => {
    const updated = updateStoredCustomer(customer);
    setUser(updated);
    return updated;
  }, []);

  const checkoutContact = useCallback(async ({ name, email, phone }) => {
    const currentEmail = (user?.email || "").trim().toLowerCase();
    const targetEmail = (email || "").trim().toLowerCase();

    if (user && currentEmail === targetEmail) {
      return user;
    }

    try {
      const res = await authApi.checkoutContact({ name, email, phone });
      if (res && res.token && (res.user || res.customer)) {
        const updatedUser = res.user || res.customer;
        const saved = setAuthenticatedSession({ token: res.token, customer: updatedUser });
        return saved.customer || updatedUser;
      }
      return user;
    } catch (err) {
      console.warn("checkoutContact API error:", err);
      return user;
    }
  }, [user, setAuthenticatedSession]);

  const value = useMemo(() => ({
    authStatus,
    user,
    isChecking: authStatus === "checking",
    isAuthenticated: authStatus === "authenticated",
    bootstrapAuth,
    setAuthenticatedSession,
    checkoutContact,
    updateUser,
    logout,
  }), [authStatus, bootstrapAuth, checkoutContact, logout, setAuthenticatedSession, updateUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
