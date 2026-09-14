import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { authApi } from "../../api/authApi";

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState(() =>
    isLoggedIn ? "checking" : "guest",
  );

  useEffect(() => {
    let isMounted = true;

    if (!isLoggedIn) {
      if (isMounted) setStatus("guest");
      return;
    }

    authApi
      .getProfile()
      .then((profile) => {
        if (profile) authApi.storeCustomer(profile);
        if (isMounted) setStatus("authenticated");
      })
      .catch(() => {
        logout();
        if (isMounted) setStatus("guest");
      });

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, logout]);

  if (status === "checking") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-[#122a50b2]">
        Verifying secure session...
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
