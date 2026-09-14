import React, { createContext, useEffect, useState, useContext, useCallback } from "react";
import { AppContext } from "./AppContext";
import { authApi } from "../api/authApi";
import { accountApi } from "../api/accountApi";
import {
  AUTH_CHANGE_EVENT,
  CUSTOMER_BLOCKED_REASON_KEY,
  clearAuthStorage,
  getStoredSession,
  hasStoredAuthToken,
  storeCustomerSession,
} from "../api/authStorage";

export const AuthContext = createContext();

/**
 * Derive a display name from various data sources.
 */
const deriveName = (userData) => {
  if (userData.name && userData.name.trim()) return userData.name.trim();
  if (userData.firstName || userData.lastName) {
    return `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
  }
  if (userData.email) {
    return userData.email
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Customer";
};

export const AuthProvider = ({ children }) => {
  const { addToast } = useContext(AppContext);

  const [user, setUser] = useState(() => {
    const session = getStoredSession();
    if (!session?.customer) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    }
    return session?.customer || null;
  });

  const syncUserFromSession = () => {
    const session = getStoredSession();
    if (!session?.customer) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    }
    setUser(session?.customer || null);
  };

  const checkBlockedStatus = useCallback(() => {
    if (!hasStoredAuthToken()) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      return;
    }

    accountApi
      .getProfile()
      .then((profile) => {
        if (profile) {
          if (profile.isBlocked) {
            const reason = profile.blockedReason || "Your account has been blocked. Please contact support.";
            localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
            clearAuthStorage({ reason: "blocked" });
            setUser(null);
          } else {
            setUser(profile);
            localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
          }
        }
      })
      .catch((err) => {
        const rawMsg = (err?.response?.data?.message || err?.message || "").toLowerCase();
        const isBlocked =
          Boolean(err?.response?.data?.isBlocked) ||
          rawMsg.includes("blocked") ||
          rawMsg.includes("deactivated") ||
          rawMsg.includes("suspended");
        if (isBlocked && hasStoredAuthToken()) {
          const rawReason = err?.response?.data?.message || err?.message;
          const reason =
            typeof rawReason === "string" && rawReason.trim().length > 3
              ? rawReason.trim()
              : "Your account has been blocked. Please contact support.";
          localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
          clearAuthStorage({ reason: "blocked" });
          setUser(null);
        }
      });
  }, []);

  useEffect(() => {
    const handleAuthChange = (event) => {
      const session = getStoredSession();
      setUser(session?.customer || null);

      if (event.detail?.reason === "expired") {
        addToast({
          title: "Session expired",
          message: "Your session has expired. Please login again.",
          type: "error",
        });
      }

      if (
        ["expired", "logout", "blocked"].includes(event.detail?.reason) &&
        window.location.pathname !== "/login"
      ) {
        window.history.replaceState(null, "", "/login");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === null || event.key === "vetsupplyexpress_customer_session") {
        syncUserFromSession();
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [addToast]);

  /**
   * loginUser — accepts either a plain email string (backward compat)
   * or a full userData object with optional fields:
   *   email, name, firstName, lastName, phone, avatar,
   *   accountCreatedViaOrder (bool), orderId (string)
   */
  const loginUser = (userData, { silent = false } = {}) => {
    let authenticatedUser;

    if (typeof userData === "string") {
      // Backward-compat: plain email string
      const email = userData;
      authenticatedUser = {
        email,
        name: email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        firstName: "",
        lastName: "",
        phone: "",
        avatar: null,
        accountCreatedViaOrder: false,
        orderId: null,
        memberSince: new Date().toISOString(),
      };
    } else {
      const fullName = deriveName(userData);
      const nameParts = fullName.split(" ");
      authenticatedUser = {
        email: userData.email || "",
        name: fullName,
        firstName: userData.firstName || nameParts[0] || "",
        lastName: userData.lastName || nameParts.slice(1).join(" ") || "",
        phone: userData.phone || "",
        avatar: userData.avatar || null,
        accountCreatedViaOrder: userData.accountCreatedViaOrder || false,
        orderId: userData.orderId || null,
        memberSince: userData.memberSince || new Date().toISOString(),
      };
    }

    setUser(authenticatedUser);
    const session = authApi.getSession();
    if (session?.token) {
      storeCustomerSession(session.token, authenticatedUser, { reason: "login" });
    }

    if (!silent) {
      addToast({
        title: authenticatedUser.accountCreatedViaOrder
          ? "🎉 Account Created!"
          : "Welcome back!",
        message: authenticatedUser.accountCreatedViaOrder
          ? `Your account is ready, ${authenticatedUser.firstName || authenticatedUser.name}. Dashboard is now available.`
          : "Your account has been restored with orders, addresses, and wishlist.",
        type: "cart",
      });
    }
  };

  const updateUser = (updates) => {
    const session = authApi.getSession();
    if (!session?.token || !user) return;

    const updated = { ...user, ...updates };
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      updated.name =
        `${updated.firstName || ""} ${updated.lastName || ""}`.trim() ||
        updated.name;
    }

    setUser(updated);
    storeCustomerSession(session.token, updated, { reason: "profile-update" });
  };

  /**
   * Call this after the Order Success page mounts to clear the one-time banner flag.
   */
  const clearAccountCreatedFlag = () => {
    const session = authApi.getSession();
    if (!session?.token || !user?.accountCreatedViaOrder) return;

    const updated = { ...user, accountCreatedViaOrder: false, orderId: null };
    setUser(updated);
    storeCustomerSession(session.token, updated, { reason: "profile-update" });
  };

  const logoutUser = () => {
    setUser(null);
    authApi.logout();
  };

  const checkoutContact = useCallback(async ({ name, email, phone }) => {
    const currentEmail = (user?.email || "").trim().toLowerCase();
    const targetEmail = (email || "").trim().toLowerCase();

    if (user && currentEmail === targetEmail) {
      return user;
    }

    try {
      const res = await authApi.checkoutContact({ name, email, phone });
      const token = res?.token || res?.data?.token;
      const customer = res?.user || res?.customer || res?.data?.user || res?.data?.customer;
      if (token && customer) {
        storeCustomerSession(token, customer, { reason: "checkout-contact" });
        setUser(customer);
        return customer;
      }
      return user;
    } catch (err) {
      console.warn("checkoutContact API error:", err);
      return user;
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && hasStoredAuthToken()),
        checkBlockedStatus,
        loginUser,
        updateUser,
        logoutUser,
        checkoutContact,
        clearAccountCreatedFlag,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
