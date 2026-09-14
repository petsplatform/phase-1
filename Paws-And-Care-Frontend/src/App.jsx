import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import AnnouncementBar from './components/AnnouncementBar';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import ProductVariant from './pages/ProductVariant';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Login from './pages/Login';
import Contact from './pages/Contact';
import About from './pages/About';
import FAQ from './pages/FAQ';
import TrackOrder from './pages/TrackOrder';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import ShippingPolicy from './pages/ShippingPolicy';
import Dashboard from './pages/account/Dashboard';
import Orders from './pages/account/Orders';
import OrderDetails from './pages/account/OrderDetails';
import Profile from './pages/account/Profile';
import Addresses from './pages/account/Addresses';
import AccountTrackOrder from './pages/account/TrackOrder';
import VetVerification from './pages/account/VetVerification';
import AuthGuard from './components/auth/AuthGuard';
import { productApi } from './api/productApi';
import { cartApi } from './api/cartApi';
import { wishlistApi } from './api/wishlistApi';
import { authApi } from './api/authApi';
import { mapPawsProducts, toCollectionItem } from './api/catalogAdapter';
import { findSelectedVariant, getVariantLabel } from './utils/cartVariants';
import { Sparkles, Check, Heart, X, Trash2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import ConfirmLogoutModal from './components/auth/ConfirmLogoutModal';

// Scroll to top on route change helper, supporting sticky header offset hash scrolling
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 90; // offset for sticky header
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 150); // slight delay to allow page rendering before scrolling
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

function App() {
  const [productCatalog, setProductCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const [remoteReady, setRemoteReady] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('paws_care_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('paws_care_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. Toasts list state
  const [toasts, setToasts] = useState([]);

  // Auto-persist Wishlist
  useEffect(() => {
    localStorage.setItem('paws_care_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Auto-persist Cart
  useEffect(() => {
    localStorage.setItem('paws_care_cart', JSON.stringify(cart));
  }, [cart]);

  // Toast adder helper
  const addToast = (message, type = 'success', title = null) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Toast removal helper
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    productApi
      .getProducts({ limit: 100 })
      .then((payload) => {
        if (cancelled) return;
        setProductCatalog(mapPawsProducts(payload));
        setCatalogError('');
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error?.message || 'Product catalog is unavailable.';
        setProductCatalog([]);
        setCatalogError(message);
        addToast(message, 'error', 'Catalog Error');
      })
      .finally(() => {
        if (!cancelled) {
          setRemoteReady(true);
          setLoadingProducts(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Wishlist toggler
  const toggleWishlist = (input) => {
    const targetId = typeof input === 'object' && input !== null ? String(input.id || input.productId || input._id) : String(input);
    const targetProduct =
      typeof input === 'object' && input !== null
        ? input
        : productCatalog.find((p) => String(p.id) === targetId || String(p.productId) === targetId || String(p._id) === targetId || String(p.slug) === targetId);

    const exists = wishlist.some((id) => String(id) === targetId);

    // Store metadata for wishlisted product in paws_care_wishlist_meta
    const productForMeta = targetProduct || (typeof input === 'object' && input !== null ? input : null);
    if (productForMeta) {
      try {
        const storedMeta = JSON.parse(localStorage.getItem('paws_care_wishlist_meta') || '{}');
        if (exists) {
          delete storedMeta[targetId];
        } else {
          storedMeta[targetId] = {
            id: targetId,
            baseProductId: productForMeta.baseProductId || productForMeta.productId || targetId.split('__')[0],
            name: productForMeta.name || productForMeta.title || 'Product',
            title: productForMeta.title || productForMeta.name || 'Product',
            image: productForMeta.image || productForMeta.thumbnail || '',
            price: Number(productForMeta.price || 0),
            originalPrice: productForMeta.originalPrice || null,
            rating: productForMeta.rating || 4.8,
            reviewCount: productForMeta.reviewCount || productForMeta.reviewsCount || 0,
            category: productForMeta.category?.name || productForMeta.category || '',
            badge: productForMeta.badge || '',
            slug: productForMeta.slug || targetId,
            inStock: productForMeta.inStock !== false && productForMeta.stock !== 0,
          };
        }
        localStorage.setItem('paws_care_wishlist_meta', JSON.stringify(storedMeta));
      } catch (e) {
        console.warn('Could not update paws_care_wishlist_meta', e);
      }
    }

    if (exists) {
      setWishlist((prev) => prev.filter((id) => String(id) !== targetId));
      if (authApi.getSession()) {
        const remoteId = targetId.includes('__') ? targetId.split('__')[0] : targetId;
        wishlistApi.removeItem(remoteId).catch(() => {});
      }
    } else {
      addToast("Added to your wishlist.", "wishlist");
      // Prepend to wishlist so newly added variant / product is first!
      setWishlist((prev) => [targetId, ...prev.filter((id) => String(id) !== targetId)]);
      if (authApi.getSession() && targetProduct) {
        const remoteProduct = {
          ...targetProduct,
          id: targetId.includes('__') ? targetId.split('__')[0] : targetId,
          productId: targetId.includes('__') ? targetId.split('__')[0] : targetId,
        };
        wishlistApi.addItem(toCollectionItem(remoteProduct)).catch(() => {});
      }
    }
  };

  const clearWishlist = () => {
    try {
      localStorage.removeItem('paws_care_wishlist_meta');
    } catch {}
    setWishlist([]);
    if (authApi.getSession()) wishlistApi.clearWishlist().catch(() => {});
    addToast("Your wishlist has been cleared.", "info");
  };

  // Cart operations
  const addToCart = (product, quantity = 1, option = '', fromWishlist = false) => {
    const selectedOption =
      option ||
      product.selectedOption ||
      product.option ||
      product.selectedSize?.label ||
      (product.options && product.options[0]) ||
      getVariantLabel(
        product.optionVariants?.find((variant) =>
          variant.isAvailable !== false &&
          String(variant.status || 'Active').toLowerCase() !== 'inactive'
        ) || {}
      ) ||
      '';
    const activeVariant = findSelectedVariant(product, selectedOption, product.variantId);
    const stock = activeVariant
      ? (activeVariant.inventory?.stockQuantity ?? activeVariant.stock ?? 0)
      : (product.stock ?? 0);
    const maxStock = stock > 0 ? stock : 99;

    let finalQty = quantity;
    let isNew = true;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.id === product.id && item.option === selectedOption
      );
      if (existingIdx > -1) {
        isNew = false;
        const newCart = [...prev];
        finalQty = Math.min(maxStock, newCart[existingIdx].quantity + quantity);
        newCart[existingIdx].quantity = finalQty;
        return newCart;
      }
      finalQty = Math.min(maxStock, quantity);
      return [...prev, { id: product.id, quantity: finalQty, option: selectedOption }];
    });

    if (authApi.getSession()) {
      const cartProduct = activeVariant
        ? {
            ...product,
            price: activeVariant.pricing?.finalPrice ?? activeVariant.salePrice ?? activeVariant.price ?? product.price,
            variantId: activeVariant.id || product.variantId || null,
            selectedSize: {
              label: getVariantLabel(activeVariant) || selectedOption,
              price: activeVariant.pricing?.finalPrice ?? activeVariant.salePrice ?? activeVariant.price ?? product.price,
            },
          }
        : product;
      if (isNew) {
        cartApi.addItem(toCollectionItem(cartProduct, finalQty, selectedOption)).catch(() => {});
      } else {
        const cartId = [product.id, selectedOption].filter(Boolean).join('__');
        cartApi.updateItem(cartId || product.id, finalQty).catch(() => {});
      }
    }

    if (fromWishlist) {
      addToast("Added to your cart from wishlist.", "success");
    } else {
      const productName = product.name || product.title || 'Product';
      const variantLabel = getVariantLabel(activeVariant || {}) || selectedOption;
      const toastName = variantLabel && !productName.toLowerCase().includes(String(variantLabel).toLowerCase())
        ? `${productName} — ${variantLabel}`
        : productName;
      addToast(
        `${toastName} added to your cart successfully.`,
        "success",
      );
    }
  };

  const updateCartQuantity = (productId, option, quantity) => {
    const product = productCatalog.find((p) => p.id === productId || p.productId === productId);
    let maxStock = 99;
    if (product) {
      const activeVariant = product.optionVariants?.find(
        (v) => (v.label || v.name || v.id) === option
      );
      const stock = activeVariant
        ? (activeVariant.inventory?.stockQuantity ?? activeVariant.stock ?? 0)
        : (product.stock ?? 0);
      if (stock > 0) {
        maxStock = stock;
      }
    }
    const finalQuantity = Math.min(maxStock, Math.max(1, quantity));

    setCart((prev) =>
      prev.map((item) =>
        item.id === productId && item.option === option
          ? { ...item, quantity: finalQuantity }
          : item
      )
    );
    if (authApi.getSession()) {
      const cartId = [productId, option].filter(Boolean).join('__');
      cartApi.updateItem(cartId || productId, finalQuantity).catch(() => {});
    }
  };

  const removeFromCart = (productId, option) => {
    setCart((prev) =>
      prev.filter((item) => !(item.id === productId && item.option === option))
    );
    if (authApi.getSession()) {
      const cartId = [productId, option].filter(Boolean).join('__');
      cartApi.removeItem(cartId || productId).catch(() => {});
    }
    addToast("Item removed from your cart.", "remove");
  };

  const moveCartToWishlist = (productId, option) => {
    // 1. Remove from Cart
    setCart((prev) =>
      prev.filter((item) => !(item.id === productId && item.option === option))
    );

    // 2. Add to Wishlist if not already present (prevent duplicates)
    setWishlist((prev) => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });
    if (authApi.getSession()) {
      const product = productCatalog.find((p) => p.id === productId || p.productId === productId);
      const cartId = [productId, option].filter(Boolean).join('__');
      cartApi.removeItem(cartId || productId).catch(() => {});
      if (product) wishlistApi.addItem(toCollectionItem(product)).catch(() => {});
    }

    addToast("Moved to your wishlist.", "wishlist");
  };

  const clearCartSilently = () => {
    setCart([]);
    if (authApi.getSession()) cartApi.clearCart().catch(() => {});
  };

  const addMultipleToCart = () => {
    // Bulk add trigger (primarily from wishlist page bulk action)
    const wishlistedItems = productCatalog.filter((p) => wishlist.includes(p.id));
    if (wishlistedItems.length === 0) return;

    setCart((prev) => {
      let newCart = [...prev];
      wishlistedItems.forEach((p) => {
        const defaultOpt = (p.options && p.options[0]) || '';
        const existingIdx = newCart.findIndex(
          (item) => item.id === p.id && item.option === defaultOpt
        );

        const activeVariant = p.optionVariants?.find(
          (v) => (v.label || v.name || v.id) === defaultOpt
        );
        const stock = activeVariant
          ? (activeVariant.inventory?.stockQuantity ?? activeVariant.stock ?? 0)
          : (p.stock ?? 0);
        const maxStock = stock > 0 ? stock : 99;

        if (existingIdx > -1) {
          newCart[existingIdx].quantity = Math.min(maxStock, newCart[existingIdx].quantity + 1);
        } else {
          newCart.push({ id: p.id, quantity: 1, option: defaultOpt });
        }
      });
      return newCart;
    });
    if (authApi.getSession()) {
      wishlistApi.clearWishlist().catch(() => {});
      cartApi.syncCart(wishlistedItems.map((product) => toCollectionItem(product))).catch(() => {});
    }

    addToast("Added all wishlist items to your cart.", "success");
  };

  // Compute stats for Header badges dynamically
  const cartBadgeCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const wishlistBadgeCount = wishlist.length;

function RouteWatcher() {
  const location = useLocation();
  const { authStatus, checkBlockedStatus } = useAuth() || {};

  useEffect(() => {
    if (authStatus === 'authenticated' && typeof checkBlockedStatus === 'function') {
      checkBlockedStatus();
    }
  }, [location.pathname, location.search, authStatus, checkBlockedStatus]);

  return null;
}

  return (
    <AuthProvider>
      <OrderProvider>
        <BrowserRouter>
          <ScrollToTop />
          <RouteWatcher />
          <CollectionSync
            productCatalog={productCatalog}
            remoteReady={remoteReady}
            setCart={setCart}
            setWishlist={setWishlist}
          />
      
          {/* ── Floating Premium Toast Notification Stack ───────────────── */}
          <div className="fixed top-6 right-4 sm:right-6 z-[60] flex flex-col gap-3 max-w-sm w-[calc(100%-2rem)] sm:w-full pointer-events-none">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-lg border text-left transition-all duration-300 animate-slide-in-right bg-white ${
                  t.type === 'success' ? 'border-brand-teal/30 bg-brand-bg/95' :
                  t.type === 'wishlist' ? 'border-brand-coral/20 bg-brand-bg/95' :
                  t.type === 'remove' ? 'border-brand-border/80 bg-brand-surface' :
                  'border-brand-border/60 bg-white'
                }`}
              >
                {/* Custom Icon depending on notification type */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  t.type === 'success' ? 'bg-brand-teal text-white' :
                  t.type === 'wishlist' ? 'bg-brand-coral text-white' :
                  t.type === 'remove' ? 'bg-brand-border text-brand-muted' :
                  'bg-brand-teal/10 text-brand-teal'
                }`}>
                  {t.type === 'success' && <Check size={14} />}
                  {t.type === 'wishlist' && <Heart size={14} className="fill-current" />}
                  {t.type === 'remove' && <Trash2 size={13} />}
                  {t.type === 'info' && <Sparkles size={14} className="text-brand-golden" />}
                </div>

                <div className="flex-1">
                  <h4 className="font-heading font-black text-xs text-brand-text uppercase tracking-wide leading-none mb-1">
                    {t.title ? t.title :
                     t.type === 'success' ? 'Added to Cart' :
                     t.type === 'wishlist' ? 'Wishlist Update' :
                     t.type === 'remove' ? 'Cart Update' :
                     'Notification'}
                  </h4>
                  <p className="font-sans text-[11px] text-brand-muted leading-tight">
                    {t.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="text-brand-border hover:text-brand-muted shrink-0 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <AppContent
            wishlistBadgeCount={wishlistBadgeCount}
            cartBadgeCount={cartBadgeCount}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            addToCart={addToCart}
            cart={cart}
            updateCartQuantity={updateCartQuantity}
            removeFromCart={removeFromCart}
            moveCartToWishlist={moveCartToWishlist}
            clearWishlist={clearWishlist}
            addMultipleToCart={addMultipleToCart}
            addToast={addToast}
            clearCartSilently={clearCartSilently}
            productCatalog={productCatalog}
            catalogError={catalogError}
            loadingProducts={loadingProducts}
          />
        </BrowserRouter>
      </OrderProvider>
    </AuthProvider>
  );
}

function CollectionSync({ productCatalog, remoteReady, setCart, setWishlist }) {
  const { authStatus } = useAuth() || {};

  useEffect(() => {
    if (authStatus !== 'authenticated' || !remoteReady) return;

    let cancelled = false;
    Promise.all([cartApi.getCart(), wishlistApi.getWishlist()])
      .then(([serverCart, serverWishlist]) => {
        if (cancelled) return;
        const localCart = JSON.parse(localStorage.getItem('paws_care_cart') || '[]');
        const localWishlist = JSON.parse(localStorage.getItem('paws_care_wishlist') || '[]');
        if (serverCart.length) {
          const nextCart = serverCart.map((item) => ({
            id: item.productId || item.id,
            productId: item.productId || item.id,
            quantity: Number(item.quantity) || 1,
            option: item.option || item.variantLabel || item.selectedSize?.label || '',
          }));
          setCart(nextCart);
        } else if (localCart.length) {
          const items = localCart
            .map((item) => {
              const product = productCatalog.find((catalogItem) => catalogItem.id === item.id || catalogItem.productId === item.id);
              return product ? toCollectionItem(product, item.quantity || 1, item.option || '') : null;
            })
            .filter(Boolean);
          cartApi.syncCart(items).catch(() => {});
        }
        if (Array.isArray(serverWishlist) && serverWishlist.length) {
          try {
            const meta = JSON.parse(localStorage.getItem('paws_care_wishlist_meta') || '{}');
            serverWishlist.forEach((item) => {
              const prod = item.product || item;
              const idStr = String(item.productId || prod.id || prod._id || prod.sku || item.id || '');
              if (idStr && (prod.name || prod.title)) {
                meta[idStr] = {
                  id: idStr,
                  baseProductId: idStr.split('__')[0],
                  name: prod.name || prod.title || 'Product',
                  title: prod.title || prod.name || 'Product',
                  image: prod.image || prod.images?.[0] || prod.thumbnail || '',
                  price: Number(prod.price || 0),
                  originalPrice: prod.originalPrice || prod.comparePrice || null,
                  rating: prod.rating || prod.avgRating || 4.8,
                  reviewCount: prod.reviewCount || 0,
                  category: prod.category?.name || prod.category || 'Pet Essentials',
                  badge: prod.badge || '',
                  slug: prod.slug || idStr,
                  inStock: prod.inStock !== false && prod.stock !== 0,
                };
              }
            });
            localStorage.setItem('paws_care_wishlist_meta', JSON.stringify(meta));
          } catch {}

          const nextWishlist = serverWishlist
            .map((item) => {
              const prod = item.product || item;
              return String(item.productId || prod.id || prod._id || item.id);
            })
            .filter(Boolean);
          setWishlist(nextWishlist);
        } else if (localWishlist.length) {
          const items = productCatalog
            .filter((product) => localWishlist.includes(product.id) || localWishlist.includes(product.productId) || localWishlist.includes(product.slug))
            .map((product) => toCollectionItem(product));
          if (items.length) {
            wishlistApi.syncWishlist(items).catch(() => {});
          }
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [authStatus, productCatalog, remoteReady, setCart, setWishlist]);

  return null;
}

function AppContent({
  wishlistBadgeCount,
  cartBadgeCount,
  wishlist,
  toggleWishlist,
  addToCart,
  cart,
  updateCartQuantity,
  removeFromCart,
  moveCartToWishlist,
  clearWishlist,
  addMultipleToCart,
  addToast,
  clearCartSilently,
  productCatalog,
  catalogError,
  loadingProducts,
}) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans antialiased">
      <AnnouncementBar />
      <Header wishlistCount={wishlistBadgeCount} cartCount={cartBadgeCount} products={productCatalog} />
      <main className="flex-grow">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
                onAddToCart={addToCart}
                products={productCatalog}
                catalogError={catalogError}
                loading={loadingProducts}
              />
            }
          />
          <Route
            path="/shop"
            element={
              <Shop
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
                onAddToCart={addToCart}
                products={productCatalog}
                catalogError={catalogError}
                loading={loadingProducts}
              />
            }
          />
          <Route
            path="/product/:slug"
            element={
              <ProductDetails
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
                onAddToCart={addToCart}
                products={productCatalog}
              />
            }
          />
          <Route
            path="/products/:slug"
            element={
              <ProductDetails
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
                onAddToCart={addToCart}
                products={productCatalog}
              />
            }
          />
          <Route
            path="/product/:slug/variants"
            element={
              <ProductVariant
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
                onAddToCart={addToCart}
                products={productCatalog}
              />
            }
          />
          <Route
            path="/products/:slug/variants"
            element={
              <ProductVariant
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
                onAddToCart={addToCart}
                products={productCatalog}
              />
            }
          />
          <Route
            path="/wishlist"
            element={
              <Wishlist
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
                onAddToCart={addToCart}
                onClearWishlist={clearWishlist}
                onAddMultipleToCart={addMultipleToCart}
                products={productCatalog}
                loading={loadingProducts}
              />
            }
          />
          <Route
            path="/cart"
            element={
              <Cart
                cart={cart}
                onUpdateCartQuantity={updateCartQuantity}
                onRemoveFromCart={removeFromCart}
                onMoveCartToWishlist={moveCartToWishlist}
                products={productCatalog}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <Checkout
                cart={cart}
                onAddToCart={addToCart}
                onRemoveFromCart={removeFromCart}
                addToast={addToast}
                clearCartSilently={clearCartSilently}
                products={productCatalog}
              />
            }
          />
          <Route
            path="/order-success/:orderId"
            element={<OrderSuccess />}
          />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route
            path="/login"
            element={<Login addToast={addToast} />}
          />
          <Route
            path="/contact"
            element={<Contact />}
          />
          <Route
            path="/about"
            element={<About />}
          />
          <Route
            path="/faq"
            element={<FAQ />}
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsConditions />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route
            path="/account"
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/account/orders"
            element={
              <AuthGuard>
                <Orders />
              </AuthGuard>
            }
          />
          <Route
            path="/account/orders/:orderId"
            element={
              <AuthGuard>
                <OrderDetails />
              </AuthGuard>
            }
          />
          <Route
            path="/account/profile"
            element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            }
          />
          <Route
            path="/account/addresses"
            element={
              <AuthGuard>
                <Addresses />
              </AuthGuard>
            }
          />
          <Route
            path="/account/track-order"
            element={
              <AuthGuard>
                <AccountTrackOrder />
              </AuthGuard>
            }
          />
          <Route
            path="/account/vet-verification"
            element={
              <AuthGuard>
                <VetVerification />
              </AuthGuard>
            }
          />
        </Routes>
      </main>
      <Footer />
      <ConfirmLogoutModal />
    </div>
  );
}

export default App;
