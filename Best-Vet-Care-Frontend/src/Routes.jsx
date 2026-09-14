import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ScrollToTop from "./components/common/ScrollToTop";

import ProtectedRoute from "./components/account/ProtectedRoute";
import TitleUpdater from "./components/common/TitleUpdater";
import PetGPTWidget from "./components/petgpt/PetGPTWidget";
import SupportChatWidget from "./components/support/SupportChatWidget";
import { featureFlags } from "./config/siteNavigation";

const HomePage = lazy(() => import("./pages/Home"));
const ProductListing = lazy(() => import("./pages/ProductListing"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const ProductFamilyPage = lazy(() => import("./pages/ProductFamilyPage"));
const ProductVariantPage = lazy(() => import("./pages/ProductVariantPage"));
const ShopPage = lazy(() => import("./pages/Shop"));
const Collectionspage = lazy(() => import("./pages/Collections"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SocialAuthCallback = lazy(() => import("./pages/SocialAuthCallback"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Cart = lazy(() => import("./pages/Cart"));
const Contact = lazy(() => import("./pages/Contact"));
const HowToOrder = lazy(() => import("./pages/HowToOrder"));
const ShippingCharges = lazy(() => import("./pages/ShippingCharges"));
const Discounts = lazy(() => import("./pages/Discounts"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const Blog = lazy(() => import("./pages/Blog"));
const RewardPoints = lazy(() => import("./pages/RewardPoints"));
const AffiliateProgram = lazy(() => import("./pages/AffiliateProgram"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const AccountDashboard = lazy(() => import("./pages/AccountDashboard"));
const AccountOrders = lazy(() => import("./pages/AccountOrders"));
const AutoOrders = lazy(() => import("./pages/AutoOrders"));
const ShipmentTracking = lazy(() => import("./pages/ShipmentTracking"));
const SavedAddresses = lazy(() => import("./pages/SavedAddresses"));
const AccountDetails = lazy(() => import("./pages/AccountDetails"));
const PetDetails = lazy(() => import("./pages/PetDetails"));
const VetVerification = lazy(() => import("./pages/VetVerification"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RouteFallback = () => (
  <div className="min-h-screen bg-[#fffdf7]" aria-live="polite" aria-busy="true" />
);

const AppRoutes = () => {
  return (
    <Router>
      <TitleUpdater />
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products" element={<ProductListing />} />
          <Route path="/products/:productSlug" element={<ProductFamilyPage />} />
          <Route path="/products/:productSlug/:variantSlug" element={<ProductVariantPage />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          {/* <Route path="/category/:slug" element={<ProductListing />} /> */}
          <Route path="/collection" element={<Collectionspage />} />
          <Route path="/collections" element={<Collectionspage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/social/callback" element={<SocialAuthCallback />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/orders"
            element={
              <ProtectedRoute>
                <AccountOrders />
              </ProtectedRoute>
            }
          />
          {featureFlags.autoOrder && (
            <Route
              path="/account/auto-orders"
              element={
                <ProtectedRoute>
                  <AutoOrders />
                </ProtectedRoute>
              }
            />
          )}
          <Route
            path="/account/orders/:id/tracking"
            element={
              <ProtectedRoute>
                <ShipmentTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/addresses"
            element={
              <ProtectedRoute>
                <SavedAddresses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/details"
            element={
              <ProtectedRoute>
                <AccountDetails />
              </ProtectedRoute>
            }
          />
          {featureFlags.petDetails && (
            <Route
              path="/account/pets"
              element={
                <ProtectedRoute>
                  <PetDetails />
                </ProtectedRoute>
              }
            />
          )}
          <Route
            path="/account/vet-verification"
            element={
              <ProtectedRoute>
                <VetVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route path="/cart" element={<Cart />} />
          <Route path="/contact" element={<Contact />} />
          {featureFlags.orderGuide && <Route path="/how-to-order" element={<HowToOrder />} />}
          {featureFlags.shippingCharges && <Route path="/shipping-charges" element={<ShippingCharges />} />}
          {featureFlags.discountsCoupons && <Route path="/discounts" element={<Discounts />} />}
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/sitemap" element={<Sitemap />} />
          {featureFlags.blog && <Route path="/blog" element={<Blog />} />}
          {featureFlags.rewardPoints && <Route path="/reward-points" element={<RewardPoints />} />}
          <Route path="/affiliate-program" element={<AffiliateProgram />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route
            path="/track-order"
            element={
              <ProtectedRoute>
                <TrackOrder />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {/* Temporarily hidden while 24/7 Customer Support is paused. */}
      {featureFlags.customerSupport && <SupportChatWidget />}
      {featureFlags.petAssistant && <PetGPTWidget />}
    </Router>
  );
};

export default AppRoutes;
