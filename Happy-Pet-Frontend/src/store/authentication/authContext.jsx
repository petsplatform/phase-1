/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { accountApi } from "../../api/accountApi";
import { authApi } from "../../api/authApi";
import {
  CUSTOMER_BLOCKED_REASON_KEY,
  CUSTOMER_SESSION_KEY,
  CUSTOMER_USER_KEY,
  isUserBlockedError,
} from "../../api/axios";
import LogoutConfirmModal from "../../components/common/LogoutConfirmModal";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = () => {
      try {
        const savedUser = localStorage.getItem(CUSTOMER_USER_KEY);
        const session = authApi.getSession();

        if (session?.token && savedUser) {
          const parsed = JSON.parse(savedUser);
          if (isMounted) setCurrentUser(parsed);

          accountApi
            .getProfile()
            .then((profile) => {
              if (isMounted && profile) {
                setCurrentUser(profile);
                localStorage.setItem(
                  CUSTOMER_USER_KEY,
                  JSON.stringify(profile),
                );
              }
            })
            .catch((err) => {
              const isBlocked = isUserBlockedError(err);
              if (isBlocked) {
                const rawReason = err.response?.data?.message;
                const reason =
                  typeof rawReason === "string" && rawReason.trim().length > 3
                    ? rawReason.trim()
                    : "Your account has been blocked. Please contact support.";
                localStorage.removeItem(CUSTOMER_SESSION_KEY);
                localStorage.removeItem(CUSTOMER_USER_KEY);
                localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
                if (isMounted) setCurrentUser(null);
              }
            });
        } else {
          localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
          if (isMounted) setCurrentUser(null);
        }
      } catch (error) {
        console.error("Failed to parse stored user", error);
        if (isMounted) setCurrentUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    syncAuthState();
    window.addEventListener("happypetrx-auth-change", syncAuthState);
    return () => {
      isMounted = false;
      window.removeEventListener("happypetrx-auth-change", syncAuthState);
    };
  }, []);

  // Check auth and forcefully log out blocked user on navigation / page route change
  useEffect(() => {
    const session = authApi.getSession();
    if (!session?.token) return;

    let isMounted = true;
    accountApi
      .getProfile()
      .then((profile) => {
        if (isMounted && profile) {
          setCurrentUser(profile);
          localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(profile));
        }
      })
      .catch((err) => {
        const isBlocked = isUserBlockedError(err);
        if (isBlocked) {
          const rawReason = err.response?.data?.message;
          const reason =
            typeof rawReason === "string" && rawReason.trim().length > 3
              ? rawReason.trim()
              : "Your account has been blocked. Please contact support.";
          localStorage.removeItem(CUSTOMER_SESSION_KEY);
          localStorage.removeItem(CUSTOMER_USER_KEY);
          localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
          if (isMounted) setCurrentUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname, location.search]);

  const saveSession = ({ token, customer }) => {
    setCurrentUser(customer);
    localStorage.setItem(
      CUSTOMER_SESSION_KEY,
      JSON.stringify({ token, customer }),
    );
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(customer));
    return customer;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      return saveSession(await authApi.login({ email, password }));
    } finally {
      setLoading(false);
    }
  };

  const requestLoginOtp = (payload) => authApi.requestLoginOtp(payload);

  const verifyLoginOtp = async (payload) => {
    setLoading(true);
    try {
      return saveSession(await authApi.verifyLoginOtp(payload));
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name,
    email,
    password,
    phone = "+1 (555) 123-4567",
  ) => {
    setLoading(true);
    try {
      return saveSession(
        await authApi.register({ name, email, password, phone }),
      );
    } finally {
      setLoading(false);
    }
  };

  const checkoutContact = async ({ name, email, phone }) => {
    setLoading(true);
    try {
      const existingSession = authApi.getSession();
      const currentEmail = (currentUser?.email || "").trim().toLowerCase();
      const targetEmail = (email || "").trim().toLowerCase();

      if (
        currentUser &&
        !currentUser.isGuest &&
        existingSession?.token &&
        currentEmail === targetEmail
      ) {
        return currentUser;
      }
      const res = await authApi.checkoutContact({ name, email, phone });
      return saveSession(res);
    } catch (error) {
      const isBlocked = isUserBlockedError(error);
      if (isBlocked) {
        throw error;
      }
      console.warn(
        "authApi.checkoutContact backend error, falling back to guest session:",
        error,
      );
      if (currentUser) return currentUser;
      const guestUser = { name, email, phone, isGuest: true };
      setCurrentUser(guestUser);
      try {
        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(guestUser));
      } catch {
        // Storage fallback
      }
      return guestUser;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedFields) => {
    if (!currentUser) return;
    const updatedUser = await accountApi.updateProfile(updatedFields);
    setCurrentUser(updatedUser);
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(updatedUser));
    const session = authApi.getSession();
    if (session?.token) {
      localStorage.setItem(
        CUSTOMER_SESSION_KEY,
        JSON.stringify({ token: session.token, customer: updatedUser }),
      );
    }
    return updatedUser;
  };

  const persistUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(updatedUser));
    const session = authApi.getSession();
    if (session?.token) {
      localStorage.setItem(
        CUSTOMER_SESSION_KEY,
        JSON.stringify({ token: session.token, customer: updatedUser }),
      );
    }
    return updatedUser;
  };

  const uploadAvatar = async (file) => {
    if (!currentUser) return null;
    const updatedUser = await accountApi.uploadAvatar(file);
    return persistUser(updatedUser);
  };

  const removeAvatar = async () => {
    if (!currentUser) return null;
    const updatedUser = await accountApi.removeAvatar();
    return persistUser(updatedUser);
  };

  const forgotPassword = async (payload) => {
    const email = typeof payload === "string" ? payload : payload?.email;
    return authApi.requestLoginOtp({ email });
  };

  const setPassword = async ({ currentPassword, newPassword }) =>
    authApi.changePassword({ currentPassword, newPassword });

  const logout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    localStorage.removeItem(CUSTOMER_USER_KEY);
    toast.success("Logged out successfully. See you soon!");
    setShowLogoutModal(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        requestLoginOtp,
        verifyLoginOtp,
        register,
        checkoutContact,
        updateUser,
        uploadAvatar,
        removeAvatar,
        forgotPassword,
        setPassword,
        logout,
      }}
    >
      {children}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
