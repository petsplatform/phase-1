import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { useCart } from "../utils/cartFunctionality";
import { useWishlist } from "../utils/wishlistFunctionality";
import { useNotification } from "../utils/NotificationContext";

// cooman
import Navbar from "../Components/common/Navbar";
import Footer from "../Components/common/Footer";
import FullScreenLoader from "../Components/common/FullScreenLoader";

// Product
import CartPage from "../Pages/CartPage";
import CheckoutPage from "../Pages/CheckoutPage";
import ShopPage from "../Pages/ShopPage";
import ProductDetailsPage from "../Pages/ProductDetailsPage";
import ProductVariantPage from "../Pages/ProductVariantPage";
import WishlistPage from "../Pages/WishlistPage";

// Authentication
import LoginPage from "../Pages/authentication/LoginPage";
import RegisterPage from "../Pages/authentication/RegisterPage";

// Legal
import PrivacyPolicyPage from "../Pages/legal/PrivacyPolicyPage";
import TermsConditionsPage from "../Pages/legal/TermsConditionsPage";
import ShippingPolicyPage from "../Pages/legal/ShippingPolicyPage";

// Utils
import Home from "../Pages/Home";
import AboutPage from "../Pages/AboutPage";
import ContactPage from "../Pages/ContactPage";
import FaqPage from "../Pages/FaqPage";
import ScrollToTop from "../utils/ScrollToTop";
import ProfilePage from "../Pages/ProfilePage";
import Notfoudpage from "../Pages/Notfoudpage";
import { useAuth } from "../utils/AuthContext";

function ProtectedRoute({ children }) {
  const { authStatus } = useAuth();

  if (authStatus === "checking") {
    return <FullScreenLoader />;
  }

  if (authStatus !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { authStatus } = useAuth();
  const {
    cartItems,
    cartItemCount,
    cartSubtotal,
    appliedCouponCode,
    setAppliedCouponCode,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    clearCart,
  } = useCart(authStatus);

  const {
    wishlistIds,
    wishlistItems,
    wishlistItemCount,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    isLoadingWishlist,
  } = useWishlist(authStatus);

  const { showNotification } = useNotification();

  const handleAddToCart = (product, quantity = 1, silent = false) => {
    const existing = cartItems.find(
      (item) => String(item.id) === String(product.id),
    );
    const limit = product.stock !== undefined ? product.stock : 99;

    if (existing && existing.quantity >= limit) {
      showNotification(
        `Cannot add more. Limit of ${limit} reached for "${product.title}".`,
        "error",
      );
      return false;
    }

    addToCart(product, quantity);
    if (!silent) {
      const currentQty = existing ? existing.quantity : 0;
      const addedQty = Math.min(quantity, limit - currentQty);
      const quantityText = addedQty > 1 ? `${addedQty} × ` : "";
      const rawTitle = product.title || product.name || "Product";
      const variantSuffix =
        product.variantLabel || product.selectedVariant || product.selectedOption;
      const titleLower = rawTitle.toLowerCase();
      const variantLower = variantSuffix
        ? String(variantSuffix).toLowerCase().trim()
        : "";
      const alreadyHasVariant =
        Boolean(variantLower) && titleLower.includes(variantLower);

      const displayTitle =
        variantSuffix && !alreadyHasVariant
          ? `${rawTitle} — ${variantSuffix}`
          : rawTitle;

      showNotification(
        `Added ${quantityText}"${displayTitle}" to cart!`,
        "cart",
        product,
        { to: "/cart", label: "View Cart" },
      );
    }
    return true;
  };

  const handleToggleWishlist = (productOrId) => {
    const isCurrentlyWished = isInWishlist(productOrId);
    toggleWishlist(productOrId);

    const product =
      productOrId && typeof productOrId === "object" ? productOrId : null;
    const productTitle = product?.title || product?.name || "product";
    if (isCurrentlyWished) {
      showNotification(
        `Removed "${productTitle}" from wishlist!`,
        "wishlist-remove",
        product,
        null,
      );
    } else {
      showNotification(
        `Added "${productTitle}" to wishlist!`,
        "wishlist-add",
        product,
        { to: "/wishlist", label: "View Wishlist" },
      );
    }
  };

  const location = useLocation();
  const validRoutes = [
    "/",
    "/about",
    "/contact",
    "/faq",
    "/profile",
    "/wishlist",
    "/shop",
    "/cart",
    "/checkout",
    "/register",
    "/privacy-privacy",
    "/terms-conditions",
    "/shipping-policy",
  ];
  const isProductPage =
    location.pathname.startsWith("/shop/product/") ||
    location.pathname.startsWith("/product-variant/");
  const isValidRoute = validRoutes.includes(location.pathname) || isProductPage;

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="*"
          element={
            isValidRoute ? (
              <div className="flex min-h-screen flex-col">
                <Navbar
                  cartItemCount={cartItemCount}
                  wishlistItemCount={wishlistItemCount}
                />
                <div className="flex-1">
                  <Routes>
                    {/* Home Route */}
                    <Route
                      path="/"
                      element={
                        <Home
                          onAddToCart={handleAddToCart}
                          wishlistIds={wishlistIds}
                          onToggleWishlist={handleToggleWishlist}
                        />
                      }
                    />

                    {/* About Route */}
                    <Route path="/about" element={<AboutPage />} />

                    {/* Contact Route */}
                    <Route path="/contact" element={<ContactPage />} />

                    {/* FAQ Route */}
                    <Route path="/faq" element={<FaqPage />} />

                    {/* Profile/Account Route */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage
                            wishlistItems={wishlistItems}
                            toggleWishlist={handleToggleWishlist}
                            onAddToCart={handleAddToCart}
                            onClearWishlist={clearWishlist}
                          />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/account/vet-verification"
                      element={
                        <Navigate to="/profile?tab=vet-verification" replace />
                      }
                    />
                    <Route
                      path="/account"
                      element={<Navigate to="/profile" replace />}
                    />

                    {/* Wishlist Route */}
                    <Route
                      path="/wishlist"
                      element={
                        <WishlistPage
                          wishlistItems={wishlistItems}
                          toggleWishlist={handleToggleWishlist}
                          onAddToCart={handleAddToCart}
                          onClearWishlist={clearWishlist}
                          isLoading={isLoadingWishlist}
                        />
                      }
                    />
                    {/* Wishlist Route */}

                    {/* Order Route */}
                    <Route
                      path="/shop"
                      element={
                        <ShopPage
                          onAddToCart={handleAddToCart}
                          wishlistIds={wishlistIds}
                          onToggleWishlist={handleToggleWishlist}
                        />
                      }
                    />

                    <Route
                      path="/shop/product/:productId/variants"
                      element={
                        <ProductVariantPage
                          onAddToCart={handleAddToCart}
                          wishlistIds={wishlistIds}
                          onToggleWishlist={handleToggleWishlist}
                        />
                      }
                    />
                    <Route
                      path="/shop/product/:productId/variant"
                      element={
                        <ProductVariantPage
                          onAddToCart={handleAddToCart}
                          wishlistIds={wishlistIds}
                          onToggleWishlist={handleToggleWishlist}
                        />
                      }
                    />
                    <Route
                      path="/product-variant/:productId"
                      element={
                        <ProductVariantPage
                          onAddToCart={handleAddToCart}
                          wishlistIds={wishlistIds}
                          onToggleWishlist={handleToggleWishlist}
                        />
                      }
                    />

                    <Route
                      path="/shop/product/:productId"
                      element={
                        <ProductDetailsPage
                          onAddToCart={handleAddToCart}
                          wishlistIds={wishlistIds}
                          onToggleWishlist={handleToggleWishlist}
                        />
                      }
                    />

                    <Route
                      path="/cart"
                      element={
                        <CartPage
                          cartItems={cartItems}
                          cartSubtotal={cartSubtotal}
                          appliedCouponCode={appliedCouponCode}
                          onRemoveItem={removeCartItem}
                          onUpdateQuantity={updateCartQuantity}
                          onApplyCoupon={setAppliedCouponCode}
                        />
                      }
                    />

                    <Route
                      path="/checkout"
                      element={
                        <CheckoutPage
                          cartItems={cartItems}
                          cartSubtotal={cartSubtotal}
                          appliedCouponCode={appliedCouponCode}
                          onApplyCoupon={setAppliedCouponCode}
                          onPlaceOrder={clearCart}
                        />
                      }
                    />
                    {/* Order Route */}

                    {/* Legal */}
                    <Route
                      path="/privacy-privacy"
                      element={<PrivacyPolicyPage />}
                    />

                    <Route
                      path="/terms-conditions"
                      element={<TermsConditionsPage />}
                    />
                    <Route
                      path="/shipping-policy"
                      element={<ShippingPolicyPage />}
                    />
                    {/* Legal */}
                    <Route path="*" element={<Notfoudpage />} />
                  </Routes>
                </div>

                <Footer />
              </div>
            ) : (
              <Notfoudpage />
            )
          }
        />
      </Routes>
    </>
  );
}

export default AppRoutes;
