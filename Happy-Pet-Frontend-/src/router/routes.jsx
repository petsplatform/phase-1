import React from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";

// common
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

// Pages
import Home from "../pages/Home";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Products from "../pages/Products";
import ComingSoon from "../pages/ComingSoon";
import Wishlist from "../pages/Wishlist";
import Contact from "../pages/Contact";
import ProductDetails from "../pages/ProductDetails";
import ProductVariant from "../pages/ProductVariant";
import Profile from "../pages/profile/Profile";
import Faq from "../pages/Faq";
import AboutUs from "../pages/AboutUs";
import PrivacyPolicy from "../pages/legal/PrivacyPolicy";
import TermsConditions from "../pages/legal/TermsConditions";
import ShippingPolicy from "../pages/legal/ShippingPolicy";
import Notfound from "../pages/legal/Notfound";

// Authentication Pages
import Login from "../pages/authentication/Login";

// utils
import ScrollToTop from "../utils/ScrollToTop";

function LayoutWithNavFooter() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <ScrollToTop />
      <main className="flex-grow overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function LayoutWithoutNavFooter() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ScrollToTop />
      <main className="flex-grow overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Routes with Navbar & Footer */}
      <Route element={<LayoutWithNavFooter />}>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/products" element={<Products />} />
        <Route path="/shop" element={<Navigate to="/products" replace />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/product/:id/variants" element={<ProductVariant />} />
        <Route path="/product-variant/:id" element={<ProductVariant />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/account/vet-verification"
          element={<Navigate to="/profile?tab=vet-verification" replace />}
        />
        <Route path="/account" element={<Navigate to="/profile" replace />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
      </Route>

      {/* Routes WITHOUT Navbar & Footer */}
      <Route element={<LayoutWithoutNavFooter />}>
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Notfound />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
