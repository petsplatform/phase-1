import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ToastProvider } from "./context/ToastContext";
import Checkout from "./pages/Checkout";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Cart = lazy(() => import("./pages/Cart"));
const Login = lazy(() => import("./pages/Login"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const ProductListing = lazy(() => import("./pages/ProductListing"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const ProductVariant = lazy(() => import("./pages/ProductVariant"));
const PolicyPage = lazy(() => import("./pages/PolicyPage"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const AccountLayout = lazy(() => import("./components/account/AccountLayout"));
const DashboardPage = lazy(() => import("./pages/account/DashboardPage"));
const OrdersPage = lazy(() => import("./pages/account/OrdersPage"));
const TrackOrderPage = lazy(() => import("./pages/account/TrackOrderPage"));
const SavedAddressesPage = lazy(() => import("./pages/account/SavedAddressesPage"));
const AccountDetailsPage = lazy(() => import("./pages/account/AccountDetailsPage"));
const VetVerificationPage = lazy(() => import("./pages/account/VetVerificationPage"));

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense
          fallback={
            <div className="grid min-h-screen place-items-center bg-background text-[15px] font-extrabold text-secondaryDark">
              Loading...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/privacy-policy" element={<PolicyPage type="privacy" />} />
            <Route path="/terms-conditions" element={<PolicyPage type="terms" />} />
            <Route path="/return-policy" element={<PolicyPage type="return" />} />
            <Route path="/terms" element={<Navigate to="/terms-conditions" replace />} />
            <Route path="/refund-policy" element={<Navigate to="/return-policy" replace />} />
            <Route path="/account" element={<AccountLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="track-order" element={<TrackOrderPage />} />
              <Route path="addresses" element={<SavedAddressesPage />} />
              <Route path="details" element={<AccountDetailsPage />} />
              <Route path="vet-verification" element={<VetVerificationPage />} />
            </Route>
            <Route path="/shop" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/products/:id/variants" element={<ProductVariant />} />
            <Route path="/products/:id/variant" element={<ProductVariant />} />
            <Route path="/product/:id/variants" element={<ProductVariant />} />
            <Route path="/product/:id/variant" element={<ProductVariant />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}
