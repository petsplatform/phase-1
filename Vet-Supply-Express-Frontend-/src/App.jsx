import React, { useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/Common/ProtectedRoute";

import { CUSTOMER_BLOCKED_REASON_KEY } from "./api/authStorage";

function RouteWatcher() {
  const location = useLocation();
  const { isAuthenticated, checkBlockedStatus } = useContext(AuthContext) || {};

  useEffect(() => {
    if (isAuthenticated && typeof checkBlockedStatus === "function") {
      checkBlockedStatus();
    } else if (!isAuthenticated) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    }
  }, [location.pathname, location.search, isAuthenticated, checkBlockedStatus]);

  return null;
}

// Core pages
import HomePage from "./components/Home/HomePage";
import ShopPage from "./components/Shop/ShopPage";
import ProductDetailsPage from "./components/Shop/ProductDetailsPage";
import ProductVariantPage from "./components/Shop/ProductVariantPage";
import WishlistPage from "./components/Shop/WishlistPage";
import LoginPage from "./components/Auth/LoginPage";
import ContactPage from "./components/Contact/ContactPage";
import CheckoutPage from "./components/Checkout/CheckoutPage";
import CartPage from "./components/Cart/CartPage";
import OrderConfirmationPage from "./components/Checkout/OrderConfirmationPage";
import OrderSuccessPage from "./components/Checkout/OrderSuccessPage";
import MyOrdersPage from "./components/Orders/MyOrdersPage";
import TrackOrderPage from "./components/Orders/TrackOrderPage";
import AboutPage from "./components/About/AboutPage";
import ScrollToHash from "./components/Common/ScrollToHash";

// FAQ and Legal Pages
import FAQPage from "./components/FAQ/FAQPage";
import PrivacyPolicyPage from "./components/Legal/PrivacyPolicyPage";
import TermsPage from "./components/Legal/TermsPage";
import ShippingPolicyPage from "./components/Legal/ShippingPolicyPage";

// Account pages
import DashboardPage from "./components/Account/DashboardPage";
import ProfilePage from "./components/Account/ProfilePage";
import OrdersPage from "./components/Account/OrdersPage";
import AddressesPage from "./components/Account/AddressesPage";
import AccountTrackOrderPage from "./components/Account/TrackOrderPage";
import PetProfilesPage from "./components/Account/PetProfilesPage";
import PrescriptionsPage from "./components/Account/PrescriptionsPage";
import VetVerificationPage from "./components/Account/VetVerificationPage";

import "./App.css";

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <OrderProvider>
          <Router>
            <ScrollToHash />
            <RouteWatcher />
            <Layout>
              <Routes>
                {/* ── Public routes ── */}
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/product/:slug" element={<ProductDetailsPage />} />
                <Route path="/product/:slug/variants" element={<ProductVariantPage />} />
                <Route path="/product/:slug/variants/:variantId" element={<ProductVariantPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmation/:orderId" element={<OrderSuccessPage />} />
                <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
                <Route path="/my-orders" element={<MyOrdersPage />} />
                <Route path="/track-order/:orderId" element={<TrackOrderPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-conditions" element={<TermsPage />} />
                <Route path="/shipping-policy" element={<ShippingPolicyPage />} />

                {/* ── Protected account routes ── */}
                <Route
                  path="/account/dashboard"
                  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
                />
                <Route
                  path="/account/profile"
                  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
                />
                <Route
                  path="/account/orders"
                  element={<ProtectedRoute><OrdersPage /></ProtectedRoute>}
                />
                <Route
                  path="/account/addresses"
                  element={<ProtectedRoute><AddressesPage /></ProtectedRoute>}
                />
                <Route
                  path="/account/vet-verification"
                  element={<ProtectedRoute><VetVerificationPage /></ProtectedRoute>}
                />
                <Route
                  path="/account/track-order"
                  element={<ProtectedRoute><AccountTrackOrderPage /></ProtectedRoute>}
                />
                <Route
                  path="/account/pet-profiles"
                  element={<ProtectedRoute><PetProfilesPage /></ProtectedRoute>}
                />
                <Route
                  path="/account/prescriptions"
                  element={<ProtectedRoute><PrescriptionsPage /></ProtectedRoute>}
                />
              </Routes>
            </Layout>
          </Router>
        </OrderProvider>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
