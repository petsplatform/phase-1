import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { hasStoredAuthToken } from "../../api/authStorage";

/**
 * ProtectedRoute — Wraps any route that requires authentication.
 * Unauthenticated users are redirected to /login with a `redirect` query param
 * so they can be bounced back after logging in.
 */
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  if (!user || !isAuthenticated || !hasStoredAuthToken()) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
