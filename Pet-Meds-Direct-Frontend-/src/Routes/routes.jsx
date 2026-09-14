import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Home from "../Pages/Home";
import CartPage from "../Pages/CartPage";
import CheckoutPage from "../Pages/CheckoutPage";
import WishlistPage from "../Pages/WishlistPage";
import ProductPage from "../Pages/ProductPage";
import ContactPage from "../Pages/ContactPage";
import ProductDetailsPage from "../Pages/ProductDetailsPage";
import ProductVariantPage from "../Pages/ProductVariantPage";
import FAQPage from "../Pages/faq";
import TermsConditions from "../Pages/legal/TermsConditions";
import ShippingPolicy from "../Pages/legal/ShippingPolicy";
import PrivacyPolicy from "../Pages/legal/PrivacyPolicy";
import AboutPage from "../Pages/AboutPage";
import Login from "../Pages/authentication/Login";
import ProfilePage from "../Pages/profile/ProfilePage";
import NotFoundPage from "../Pages/NotFoundPage";
import ScrollToTop from "../components/common/ScrollToTop";
import { useAuth } from "../context/AuthContext";

function FullScreenLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-12 w-12 rounded-full border-4 border-primary-green/20 border-t-primary-green animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { authStatus } = useAuth();
  const location = useLocation();

  if (authStatus === "loading") {
    return <FullScreenLoader />;
  }

  if (authStatus !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<ProductPage />} />
        <Route path="/product/:id/variants" element={<ProductVariantPage />} />
        <Route path="/products/:id/variants" element={<ProductVariantPage />} />
        <Route path="/product/:id/variants/:variantId" element={<ProductVariantPage />} />
        <Route path="/products/:id/variants/:variantId" element={<ProductVariantPage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/vet-verification"
          element={<Navigate to="/profile?tab=vet-verification" replace />}
        />
        <Route path="/account" element={<Navigate to="/profile" replace />} />
        <Route path="/legal/terms-conditions" element={<TermsConditions />} />
        <Route path="/legal/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default AppRoutes;
