import React, { createContext, useState, useEffect } from "react";
import { productApi, normalizeStoreProduct } from "../api/productApi";
import { cartApi } from "../api/cartApi";
import { wishlistApi, WISHLIST_UPDATED_EVENT } from "../api/wishlistApi";
import { AUTH_CHANGE_EVENT, hasStoredAuthToken } from "../api/authStorage";

const hasAuthToken = hasStoredAuthToken;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // E-commerce states
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      try {
        const res = await productApi.getProducts({ limit: 100 });
        if (isMounted) {
          if (res && Array.isArray(res.items)) {
            setProducts(res.items);
          } else {
            setProducts([]);
          }
          setLoadingProducts(false);
        }
      } catch (err) {
        console.error("Failed to load products from API:", err);
        if (isMounted) {
          setProducts([]);
          setLoadingProducts(false);
        }
      }
    };
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("vet_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [isAuthenticated, setIsAuthenticated] = useState(hasAuthToken);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(hasAuthToken());
    };
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, []);

  // Fetch remote cart once authenticated
  useEffect(() => {
    let isMounted = true;
    const fetchCartFromServer = async () => {
      if (isAuthenticated) {
        try {
          if (cart.length > 0) {
            // Push active local guest cart to the server
            const items = cart.map((item) => {
              let prodId = item.productId || item.id;
              if (typeof prodId === "string" && prodId.includes("-")) {
                prodId = prodId.split("-")[0];
              }
              return {
                productId: prodId,
                quantity: item.quantity,
                variantId: item.selectedVariantId || null,
              };
            });
            await cartApi.syncCart(items);
          } else {
            // Load remote cart from the server
            const remoteCart = await cartApi.getCart();
            if (isMounted && Array.isArray(remoteCart)) {
              const mappedCart = remoteCart.map((item) => {
                const product = item.product || {};
                const variant = item.variant;
                const finalProduct = normalizeStoreProduct(product);
                
                if (variant) {
                  return {
                    ...finalProduct,
                    id: `${finalProduct.id}-${variant.id}`,
                    productId: finalProduct.id,
                    name: `${finalProduct.name} (${variant.label})`,
                    price: variant.price ?? variant.pricing?.finalPrice ?? finalProduct.price,
                    originalPrice: variant.regularPrice ?? variant.pricing?.price ?? finalProduct.originalPrice,
                    sku: variant.sku || finalProduct.sku,
                    stockQuantity: variant.inventory?.stockQuantity ?? variant.stockQuantity ?? variant.stock ?? finalProduct.stockQuantity,
                    stockStatus: variant.inventory?.stockStatus ?? finalProduct.stockStatus,
                    selectedVariantName: variant.label,
                    selectedVariantId: variant.id,
                    quantity: item.quantity
                  };
                } else {
                  return {
                    ...finalProduct,
                    productId: finalProduct.id,
                    quantity: item.quantity
                  };
                }
              });
              setCart(mappedCart);
            }
          }
        } catch (err) {
          console.error("Error loading remote cart on mount/auth change:", err);
        }
      }
    };
    fetchCartFromServer();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);
 
  const syncRemoteCart = async (currentCart) => {
    try {
      if (hasAuthToken()) {
        const items = currentCart.map((item) => {
          let prodId = item.productId || item.id;
          if (typeof prodId === "string" && prodId.includes("__")) {
            prodId = prodId.split("__")[0];
          }
          return {
            productId: prodId,
            quantity: item.quantity,
            variantId: item.selectedVariantId || null,
          };
        });
        await cartApi.syncCart(items);
      }
    } catch (err) {
      console.error("Failed to sync cart with API:", err);
    }
  };

  const mapWishlistItem = (item, currentProducts = products) => {
    const rawProduct = item.product || item.Product || item.item || item;
    const rawId = String(rawProduct.id || item.productId || item.product_id || item.id || "");

    const matchedStoreProduct = (currentProducts || []).find(
      (p) => String(p.id) === rawId || String(p.productId) === rawId
    ) || {};

    const normalized = normalizeStoreProduct({
      ...matchedStoreProduct,
      ...(typeof rawProduct === "object" ? rawProduct : {}),
      id: rawId || (matchedStoreProduct.id ? String(matchedStoreProduct.id) : String(item.id)),
    });

    return {
      ...normalized,
      id: rawId || String(normalized.id),
      wishlistItemId: item.id,
      productId: rawId || String(normalized.id),
      name: (normalized.name && normalized.name !== "Pet Product")
        ? normalized.name
        : (matchedStoreProduct.name || "Pet Product"),
      price: Number(normalized.price > 0 ? normalized.price : (matchedStoreProduct.price || 0)),
      originalPrice: Number(normalized.originalPrice > 0 ? normalized.originalPrice : (matchedStoreProduct.originalPrice || normalized.price || 0)),
      image: (normalized.image && !normalized.image.includes("photo-1589924691995"))
        ? normalized.image
        : (matchedStoreProduct.image || normalized.image),
      category: (normalized.category && normalized.category !== "Pet Supplies")
        ? normalized.category
        : (matchedStoreProduct.category || "Pet Supplies"),
      selectedVariantId: item.variantId || item.variant?.id || null,
    };
  };

  // Re-enrich wishlist items when products list is loaded or updated
  useEffect(() => {
    if (products && products.length > 0) {
      setWishlist((prevWishlist) => {
        if (!prevWishlist || prevWishlist.length === 0) return prevWishlist;
        let modified = false;
        const updated = prevWishlist.map((item) => {
          const matched = products.find(
            (p) => String(p.id) === String(item.id) || String(p.id) === String(item.productId)
          );
          if (matched && (item.name === "Pet Product" || !item.price || item.price === 0)) {
            modified = true;
            return {
              ...matched,
              ...item,
              id: item.id || String(matched.id),
              name: matched.name,
              price: matched.price,
              originalPrice: matched.originalPrice || matched.price,
              image: matched.image || item.image,
              category: matched.category || item.category,
            };
          }
          return item;
        });
        return modified ? updated : prevWishlist;
      });
    }
  }, [products]);

  // Fetch remote wishlist once authenticated
  useEffect(() => {
    let isMounted = true;
    const fetchWishlistFromServer = async () => {
      if (isAuthenticated) {
        try {
          if (wishlist.length > 0) {
            // Push active local guest wishlist to the server
            const items = wishlist.map((item) => ({
              productId: String(item.productId || item.id).split("__")[0],
              variantId: item.selectedVariantId || null,
            }));
            await wishlistApi.syncWishlist(items);
          } else {
            // Load remote wishlist from the server
            const remoteWishlist = await wishlistApi.getWishlist();
            if (isMounted && Array.isArray(remoteWishlist)) {
              const mappedWishlist = remoteWishlist.map((item) => mapWishlistItem(item));
              setWishlist(mappedWishlist);
            }
          }
        } catch (err) {
          console.error("Error loading remote wishlist on mount/auth change:", err);
        }
      }
    };
    fetchWishlistFromServer();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, products]);

  // Sync with window events for Wishlist updates
  useEffect(() => {
    const handleWishlistUpdated = async () => {
      if (hasAuthToken()) {
        try {
          const remoteWishlist = await wishlistApi.getWishlist();
          if (Array.isArray(remoteWishlist)) {
            const mappedWishlist = remoteWishlist.map((item) => mapWishlistItem(item));
            setWishlist(mappedWishlist);
          }
        } catch (err) {
          console.error("Error fetching wishlist on event update:", err);
        }
      }
    };
    window.addEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdated);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdated);
    };
  }, [products]);

  const [wishlist, setWishlist] = useState(() => {
    const savedWish = localStorage.getItem("vet_wishlist");
    return savedWish ? JSON.parse(savedWish) : [];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(() => {
    const savedSearches = localStorage.getItem("vet_searches");
    return savedSearches ? JSON.parse(savedSearches) : ["Apoquel", "Dasuquin", "Probiotics", "Shampoo"];
  });

  // UI state overlays
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toast State Queue
  const [toasts, setToasts] = useState([]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("vet_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("vet_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem("vet_searches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Toast Queue Helpers
  const addToast = (toast, typeArg) => {
    let payload = toast;
    if (typeof toast === "string") {
      const type = typeArg || "success";
      payload = {
        title: type === "error" ? "Notice" : type === "warning" ? "Warning" : "Success",
        message: toast,
        type: type,
      };
    }
    if (!payload || typeof payload !== "object") return;
    const finalToast = {
      title: payload.title || (payload.type === "error" ? "Error" : "Notification"),
      message: payload.message || (typeof toast === "string" ? toast : ""),
      type: payload.type || typeArg || "success",
      image: payload.image,
    };
    setToasts((prev) => {
      // Prevent duplicate toast stacking: if message & title match, ignore
      const isDup = prev.some((t) => t.message === finalToast.message && t.title === finalToast.title);
      if (isDup) return prev;
      return [...prev, { ...finalToast, id: Date.now() }];
    });
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cart operations
  const addToCart = (product, quantity = 1) => {
    let targetProduct = product;
    
    // If the product has variants, but no variant is selected (e.g. from shop catalog page),
    // default to the first available variant.
    if (product.optionVariants && product.optionVariants.length > 0 && !product.selectedVariantId) {
      const defaultVar = product.optionVariants.find((v) => v.isAvailable !== false) || product.optionVariants[0];
      if (defaultVar) {
        const activeStockQuantity = defaultVar.inventory?.stockQuantity ?? defaultVar.stockQuantity ?? defaultVar.stock ?? 0;
        const activeStockStatus = defaultVar.inventory?.stockStatus ?? product.stockStatus ?? "IN_STOCK";
        
        targetProduct = {
          ...product,
          id: `${product.id}-${defaultVar.id}`,
          productId: product.id,
          name: `${product.name} (${defaultVar.label})`,
          price: defaultVar.price ?? defaultVar.pricing?.finalPrice ?? product.price,
          originalPrice: defaultVar.regularPrice ?? defaultVar.pricing?.price ?? product.originalPrice,
          sku: defaultVar.sku || product.sku,
          stockQuantity: activeStockQuantity,
          stockStatus: activeStockStatus,
          selectedVariantName: defaultVar.label,
          selectedVariantId: defaultVar.id
        };
      }
    }

    const maxStock = targetProduct.stockQuantity ?? 999;
    if (maxStock === 0) {
      addToast({
        title: "Out of Stock",
        message: "This product is currently unavailable.",
        type: "error",
        image: targetProduct.image
      });
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === targetProduct.id);
      let newCart;
      if (existingItem) {
        if (existingItem.quantity >= maxStock) {
          addToast({
            title: "Limit Reached",
            message: `You already have the maximum available stock (${maxStock}) of ${targetProduct.name} in your cart.`,
            type: "warning",
            image: targetProduct.image
          });
          return prevCart;
        }
        
        const finalQuantity = Math.min(existingItem.quantity + quantity, maxStock);
        const actualAdded = finalQuantity - existingItem.quantity;
        
        newCart = prevCart.map((item) =>
          item.id === targetProduct.id ? { ...item, quantity: finalQuantity } : item
        );

        if (existingItem.quantity + quantity > maxStock) {
          addToast({
            title: "Quantity Capped",
            message: `Added only ${actualAdded} more items to your cart. Total quantity is limited to the available stock of ${maxStock}.`,
            type: "warning",
            image: targetProduct.image
          });
        } else {
          addToast({
            title: "Cart Updated",
            message: `The quantity of ${targetProduct.name} was updated.`,
            type: "cart",
            image: targetProduct.image
          });
        }
      } else {
        const finalQuantity = Math.min(quantity, maxStock);
        newCart = [...prevCart, { ...targetProduct, quantity: finalQuantity }];

        if (quantity > maxStock) {
          addToast({
            title: "Quantity Capped",
            message: `Added only ${finalQuantity} items to your cart. Total quantity is limited to the available stock of ${maxStock}.`,
            type: "warning",
            image: targetProduct.image
          });
        } else {
          addToast({
            title: "Added to Cart",
            message: `${targetProduct.name} was added to your cart successfully.`,
            type: "cart",
            image: targetProduct.image
          });
        }
      }

      syncRemoteCart(newCart);
      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.id !== productId);
      syncRemoteCart(newCart);
      return newCart;
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) => {
      const newCart = prevCart.map((item) => {
        if (item.id === productId) {
          const maxStock = item.stockQuantity ?? 999;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      });
      syncRemoteCart(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (hasAuthToken()) {
      cartApi.clearCart().catch((err) => console.error("Error clearing remote cart:", err));
    }
  };

  // Wishlist operations
  const toggleWishlist = (product) => {
    if (!product) return;
    const targetId = String(product.id || product._id || product.productId || "");
    setWishlist((prevWish) => {
      const isAlreadyIn = prevWish.some(
        (item) =>
          String(item.id) === targetId ||
          String(item.productId || "") === targetId ||
          String(item.wishlistItemId || "") === targetId
      );
      let newWish;
      if (isAlreadyIn) {
        newWish = prevWish.filter(
          (item) =>
            String(item.id) !== targetId &&
            String(item.productId || "") !== targetId &&
            String(item.wishlistItemId || "") !== targetId
        );
        addToast({
          title: "Wishlist Updated",
          message: `${product.name} was removed from your wishlist.`,
          type: "wishlist",
          image: product.image
        });
        if (hasAuthToken()) {
          const cleanProductId = String(product.productId || product.id).split("__")[0];
          wishlistApi.removeItem(cleanProductId).catch((err) =>
            console.error("Failed to remove item from remote wishlist:", err)
          );
        }
      } else {
        newWish = [product, ...prevWish];
        addToast({
          title: "Added to Wishlist",
          message: `${product.name} was added to your wishlist.`,
          type: "wishlist",
          image: product.image
        });
        if (hasAuthToken()) {
          const cleanProductId = String(product.productId || product.id).split("__")[0];
          wishlistApi.addItem({
            productId: cleanProductId,
            variantId: product.selectedVariantId || null
          }).catch((err) =>
            console.error("Failed to add item to remote wishlist:", err)
          );
        }
      }

      return newWish;
    });
  };

  const addToWishlist = (product) => {
    if (!product) return;
    const targetId = String(product.id || product._id || product.productId || "");
    const isAlreadyIn = wishlist.some(
      (item) =>
        String(item.id) === targetId ||
        String(item.productId || "") === targetId ||
        String(item.wishlistItemId || "") === targetId
    );
    if (isAlreadyIn) {
      addToast({
        title: "Already in Wishlist",
        message: "This product is already saved in your wishlist.",
        type: "wishlist",
        image: product.image
      });
      return;
    }
    setWishlist((prevWish) => {
      const newWish = [product, ...prevWish];
      if (hasAuthToken()) {
        const cleanProductId = String(product.productId || product.id).split("__")[0];
        wishlistApi.addItem({
          productId: cleanProductId,
          variantId: product.selectedVariantId || null
        }).catch((err) =>
          console.error("Failed to add item to remote wishlist:", err)
        );
      }
      return newWish;
    });
    addToast({
      title: "Added to Wishlist",
      message: `${product.name} was added to your wishlist.`,
      type: "wishlist",
      image: product.image
    });
  };

  const clearWishlist = () => {
    setWishlist([]);
    if (hasAuthToken()) {
      wishlistApi.clearWishlist().catch((err) =>
        console.error("Error clearing remote wishlist:", err)
      );
    }
  };

  const isInWishlist = (productId) => {
    if (!productId) return false;
    const targetId = String(productId);
    return wishlist.some(
      (item) =>
        String(item.id) === targetId ||
        String(item.productId || "") === targetId ||
        String(item.wishlistItemId || "") === targetId
    );
  };

  // Search actions
  const addRecentSearch = (query) => {
    if (!query || query.trim() === "") return;
    const cleanQuery = query.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== cleanQuery.toLowerCase());
      return [cleanQuery, ...filtered].slice(0, 5); // Store top 5
    });
  };

  // Computed values
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        products,
        loadingProducts,
        cart,
        wishlist,
        toasts,
        addToast,
        removeToast,
        searchQuery,
        setSearchQuery,
        recentSearches,
        addRecentSearch,
        isSearchOpen,
        setIsSearchOpen,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        addToWishlist,
        clearWishlist,
        isInWishlist,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
