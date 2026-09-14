import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  CUSTOMER_BLOCKED_REASON_KEY,
  clearAuthCredentials,
  clearAuthStorage,
  getProfileApi,
  checkoutContactApi,
  getStoredToken,
  saveAuthSession,
  saveAuthToken,
  setUnauthorizedHandler,
} from "../helper/axiosInstance";

const AuthContext = createContext();

const getProfilePayload = (response) => {
  if (!response) return null;
  if (response.data?.customer) return response.data.customer;
  if (response.data?.user) return response.data.user;
  if (response.data) return response.data;
  if (response.customer) return response.customer;
  if (response.user) return response.user;
  return response;
};

const getTokenFromResponse = (response, fallbackToken) => {
  return (
    response?.data?.token ||
    response?.token ||
    response?.data?.accessToken ||
    response?.accessToken ||
    fallbackToken
  );
};

const getNameFromProfile = (profile, email = "") => {
  const rawName =
    profile?.name ||
    profile?.fullName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0] ||
    "";
  const cleanedName = rawName.includes("@") ? rawName.split("@")[0] : rawName;
  return cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
};

const normalizeUser = (profile = {}, token) => {
  const email = profile.email || "";
  const name = getNameFromProfile(profile, email);

  return {
    ...profile,
    name,
    role: profile.role || "Pet Parent",
    email,
    phone: profile.phone || "",
    avatar: profile.avatar || profile.profileImage || "",
    avatarLetter: (name || email || "U").charAt(0).toUpperCase(),
    token,
  };
};

const isJwtExpired = (token) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return false;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(atob(normalizedPayload));

    return decodedPayload.exp ? decodedPayload.exp * 1000 <= Date.now() : false;
  } catch (error) {
    return false;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState("loading");
  const location = useLocation();

  const clearSession = useCallback(({ clearCaches = false } = {}) => {
    if (clearCaches) {
      clearAuthStorage();
    } else {
      clearAuthCredentials();
    }
    setUser(null);
    setAuthStatus("guest");
  }, []);

  const handleBlockedUser = useCallback((err) => {
    const rawReason = err?.response?.data?.message || (typeof err === "string" ? err : null);
    const reason =
      typeof rawReason === "string" && rawReason.trim().length > 3
        ? rawReason.trim()
        : "Your account has been blocked. Please contact support.";
    clearAuthStorage();
    localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
    setUser(null);
    setAuthStatus("guest");
  }, []);

  const verifyStoredSession = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      clearSession({ clearCaches: false });
      return null;
    }

    if (isJwtExpired(token)) {
      clearSession({ clearCaches: false });
      return null;
    }

    try {
      const profileResponse = await getProfileApi();
      const verifiedToken = getTokenFromResponse(profileResponse, token);
      const verifiedUser = normalizeUser(getProfilePayload(profileResponse), verifiedToken);

      saveAuthSession(verifiedUser, verifiedToken);
      setUser(verifiedUser);
      setAuthStatus("authenticated");
      return verifiedUser;
    } catch (error) {
      const rawMsg = (error?.response?.data?.message || error?.message || "").toLowerCase();
      const isBlocked =
        Boolean(error?.response?.data?.isBlocked) ||
        rawMsg.includes("blocked") ||
        rawMsg.includes("deactivated") ||
        rawMsg.includes("suspended");
      if (isBlocked) {
        handleBlockedUser(error);
      } else {
        clearSession();
      }
      return null;
    }
  }, [clearSession, handleBlockedUser]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setAuthStatus("guest");
    });

    const syncAuthState = () => {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        setAuthStatus("guest");
      }
    };

    verifyStoredSession();
    window.addEventListener("petmedsdirect-auth-change", syncAuthState);

    return () => {
      setUnauthorizedHandler(null);
      window.removeEventListener("petmedsdirect-auth-change", syncAuthState);
    };
  }, [verifyStoredSession]);

  // Forcefully check auth session and log out blocked user on route navigation change
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      return;
    }

    let isMounted = true;
    getProfileApi()
      .then((profileResponse) => {
        if (isMounted && profileResponse) {
          const verifiedToken = getTokenFromResponse(profileResponse, token);
          const verifiedUser = normalizeUser(getProfilePayload(profileResponse), verifiedToken);
          setUser(verifiedUser);
          setAuthStatus("authenticated");
        }
      })
      .catch((err) => {
        const rawMsg = (err?.response?.data?.message || err?.message || "").toLowerCase();
        const isBlocked =
          Boolean(err?.response?.data?.isBlocked) ||
          rawMsg.includes("blocked") ||
          rawMsg.includes("deactivated") ||
          rawMsg.includes("suspended");
        if (isBlocked) {
          handleBlockedUser(err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname, location.search, handleBlockedUser]);

  const login = useCallback(async (email, token = null, extraData = {}) => {
    const nextToken = token || extraData?.token || extraData?.accessToken || getStoredToken();

    if (!nextToken) {
      setAuthStatus("guest");
      return null;
    }

    saveAuthToken(nextToken);

    try {
      const profileResponse = await getProfileApi();
      const verifiedToken = getTokenFromResponse(profileResponse, nextToken);
      const verifiedUser = normalizeUser(
        {
          ...extraData,
          ...getProfilePayload(profileResponse),
          email: getProfilePayload(profileResponse)?.email || email,
        },
        verifiedToken,
      );

      saveAuthSession(verifiedUser, verifiedToken);
      setUser(verifiedUser);
      setAuthStatus("authenticated");
      return verifiedUser;
    } catch (error) {
      clearSession();
      throw error;
    }
  }, [clearSession]);

  const updateSession = useCallback((updatedUser) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;

      const nextUser = normalizeUser(
        {
          ...prevUser,
          ...updatedUser,
          token: prevUser.token,
        },
        prevUser.token,
      );

      saveAuthSession(nextUser, nextUser.token);
      return nextUser;
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const checkoutContact = useCallback(async ({ name, email, phone }) => {
    const currentEmail = (user?.email || "").trim().toLowerCase();
    const targetEmail = (email || "").trim().toLowerCase();

    if (user && currentEmail === targetEmail) {
      return user;
    }

    try {
      const res = await checkoutContactApi({ name, email, phone });
      const token = getTokenFromResponse(res, null);
      if (token && (res?.data?.user || res?.data?.customer || res?.user || res?.customer)) {
        const verifiedUser = normalizeUser(getProfilePayload(res), token);
        saveAuthSession(verifiedUser, token);
        setUser(verifiedUser);
        setAuthStatus("authenticated");
        return verifiedUser;
      }
      return user;
    } catch (err) {
      console.warn("checkoutContact API error:", err);
      return user;
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      authStatus,
      isLoggedIn: authStatus === "authenticated",
      login,
      logout,
      checkoutContact,
      updateSession,
      verifyStoredSession,
    }),
    [authStatus, checkoutContact, login, logout, updateSession, user, verifyStoredSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
