import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Dashboard from "../pages/Dashboard/Dashboard";
import Customers from "../pages/Users/Customers";
import VetVerifications from "../pages/Users/VetVerifications";
import ProductList from "../pages/Products/ProductList";
import AddProduct from "../pages/Products/AddProduct";
import ProductDetails from "../pages/Products/ProductDetails";
import Categories from "../pages/Products/Categories";
import BulkImport from "../pages/Products/BulkImport";
import OrderList from "../pages/Orders/OrderList";
import AutoOrders from "../pages/Orders/AutoOrders";
import ShipmentManagement from "../pages/Orders/ShipmentManagement";
import Coupons from "../pages/Configurations/Coupons";
import Taxes from "../pages/Configurations/Taxes";
import Banners from "../pages/Configurations/Banners";
import AnnouncementBar from "../pages/Configurations/AnnouncementBar";
import ShipmentCharges from "../pages/Configurations/ShipmentCharges";
import Inquiries from "../pages/Configurations/Inquiries";
import CustomerSupport from "../pages/Support/CustomerSupport";
import GeneralSettings from "../pages/System/GeneralSettings";
import EmailSettings from "../pages/System/EmailSettings";
import AuditLogs from "../pages/AuditLogs/AuditLogs";
import AICalling from "../pages/AICalling/AICalling";
import Login from "../pages/Auth/Login";
import NotFound from "../pages/NotFound";
import StoreSelect from "../pages/SuperAdmin/StoreSelect";
import TitleUpdater from "../components/common/TitleUpdater";
import {
  adminApi,
  clearAdminSession,
  getAdminToken,
  isSuperAdmin,
  updateAdminUser,
} from "../lib/api";
import { getSelectedSuperAdminStore } from "../lib/superAdminStore";
import { featureFlags } from "../config/featureFlags";

const SUPER_ADMIN_ALLOWED_PATHS = new Set([
  "/dashboard",
  "/orders",
  "/orders/list",
  "/orders/shipments",
  "/products",
  "/products/list",
  "/categories",
  "/products/categories",
  "/customers",
  "/customers/vet-verification",
  "/users/customers",
  "/settings/general",
  "/settings/email",
  "/audit-logs",
]);

// Singleton auth check — runs once per app session, not per navigation
let authCheckPromise = null;
let authResolved = false; // module-level so it survives ProtectedRoute remounts

function getAuthCheckPromise() {
  if (!authCheckPromise) {
    authCheckPromise = adminApi
      .me()
      .then((admin) => {
        updateAdminUser(admin);
        return "authenticated";
      })
      .catch(() => {
        clearAdminSession();
        return "guest";
      });
  }
  return authCheckPromise;
}


// Reset singleton on logout so next login triggers a fresh check
window.addEventListener("admin-auth-change", () => {
  authCheckPromise = null;
  authResolved = false;
});

function ProtectedRoute() {
  const location = useLocation();
  const [status, setStatus] = useState(() => {
    if (!getAdminToken()) return "guest";
    // If already resolved at module level, skip the loading state entirely
    if (authResolved) return authResolved;
    return "checking";
  });

  useEffect(() => {
    const token = getAdminToken();

    if (!token) {
      clearAdminSession();
      setStatus("guest");
      return;
    }

    // Already resolved in this session — no need to wait
    if (authResolved) {
      setStatus(authResolved);
      return;
    }

    getAuthCheckPromise().then((result) => {
      authResolved = result; // persist at module level
      setStatus(result);
    });
  }, []); // empty deps — only runs once on mount

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm font-semibold text-gray-500">
        Checking secure session...
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isSuperAdmin()) {
    const hasStoreSelection = Boolean(getSelectedSuperAdminStore());
    if (!hasStoreSelection && location.pathname !== "/select-store") {
      return <Navigate to="/select-store" replace />;
    }
    if (hasStoreSelection && location.pathname === "/select-store") {
      return <Navigate to="/dashboard" replace />;
    }
    if (hasStoreSelection && !SUPER_ADMIN_ALLOWED_PATHS.has(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
  } else if (location.pathname === "/select-store") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  const readOnly = isSuperAdmin();

  return (
    <>
      <TitleUpdater />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/select-store" element={<StoreSelect />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Customers */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/vet-verification" element={<VetVerifications />} />
            <Route
              path="/users/customers"
              element={<Navigate to="/customers" replace />}
            />

            {/* Products */}
            <Route path="/products" element={<ProductList />} />
            <Route
              path="/products/list"
              element={<Navigate to="/products" replace />}
            />
            <Route path="/products/add" element={readOnly ? <Navigate to="/products" replace /> : <AddProduct />} />
            <Route path="/products/edit/:id" element={readOnly ? <Navigate to="/products" replace /> : <AddProduct />} />
            <Route path="/products/view/:id" element={<ProductDetails />} />
            <Route path="/categories" element={<Categories />} />
            <Route
              path="/products/categories"
              element={<Navigate to="/categories" replace />}
            />
            {featureFlags.bulkImport && <Route path="/products/bulk-import" element={readOnly ? <Navigate to="/products" replace /> : <BulkImport />} />}
            {!featureFlags.bulkImport && <Route path="/products/bulk-import" element={<Navigate to="/products" replace />} />}

            {/* Orders */}
            <Route path="/orders" element={<OrderList />} />
            {featureFlags.autoOrder && <Route path="/orders/auto-orders" element={<AutoOrders />} />}
            <Route path="/orders/shipments" element={<ShipmentManagement />} />
            <Route
              path="/orders/list"
              element={<Navigate to="/orders" replace />}
            />

            {/* Configurations */}
            <Route path="/config/coupons" element={<Coupons />} />
            <Route path="/config/taxes" element={<Taxes />} />
            <Route path="/config/banners" element={<Banners />} />
            <Route path="/config/announcement" element={<AnnouncementBar />} />
            <Route path="/config/shipment-charges" element={<ShipmentCharges />} />
            <Route path="/config/inquiries" element={<Inquiries />} />
            {/* Temporarily hidden while Customer Support is paused. */}
            {featureFlags.customerSupport && <Route path="/support" element={<CustomerSupport />} />}
            {featureFlags.automaticCallingAgent && (
              <>
                <Route path="/ai-calling" element={<AICalling />} />
                <Route path="/ai-calling/agents" element={<AICalling />} />
                <Route path="/ai-calling/customers" element={<AICalling />} />
                <Route path="/ai-calling/calls" element={<AICalling />} />
              </>
            )}
            <Route path="/settings/general" element={<GeneralSettings />} />
            <Route path="/settings/email" element={<EmailSettings />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={readOnly ? <Navigate to="/dashboard" replace /> : <NotFound />} />
      </Routes>
    </>
  );
}
