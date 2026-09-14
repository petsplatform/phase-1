/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartApi } from "../api/cartApi";
import { shipmentChargeApi } from "../api/shipmentChargeApi";
import { useAuth } from "./AuthContext";
import {
  createWishlistSlug,
  removeWishlistProduct,
  removeWishlistProducts,
} from "../utils/wishlist";

const CART_STORAGE_KEY = "petcare_cart_items";
const COUPON_STORAGE_KEY = "petcare_applied_coupon";
const BUY_NOW_STORAGE_KEY = "petcare_buy_now_checkout";
const CartContext = createContext(null);

const toNumber = (value) => {
  const numberValue = Number.parseFloat(String(value || "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const NO_STOCK_LIMIT = Infinity;

const optionalId = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
};

const toStockLimit = (value) => {
  if (value === undefined || value === null || value === "") return NO_STOCK_LIMIT;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, numberValue) : NO_STOCK_LIMIT;
};

const normalizeCartProduct = (product) => {
  const name = product?.name || "PetCare Product";
  const slug = product?.slug || createWishlistSlug(name);
  const selectedSize = product?.selectedSize || null;
  const selectedColor = product?.selectedColor || null;
  const variantId = optionalId(product?.variantId || selectedSize?.id);
  const optionParts = [
    slug,
    variantId || "",
    selectedSize?.label || "",
    selectedColor?.label || "",
  ].filter(Boolean);
  const cartId = optionParts.join("__");
  const stock = toStockLimit(selectedSize?.inventory?.stockQuantity ?? selectedSize?.stock ?? product?.inventory?.stockQuantity ?? product?.stock);
  const requestedQuantity = Math.max(1, Number(product?.quantity) || 1);
  const quantity = Number.isFinite(stock) && stock > 0
    ? Math.min(requestedQuantity, stock)
    : requestedQuantity;

  return {
    id: product?.cartId || cartId || product?.id || slug,
    productId: product?.productId || product?.id || slug,
    variantId,
    variantLabel: product?.variantLabel || selectedSize?.familyVariantName || selectedSize?.variantName || null,
    sku: selectedSize?.sku || product?.sku || null,
    packLabel: selectedSize?.label || product?.packLabel || null,
    slug,
    name,
    description: product?.description || "Premium pet product",
    image: selectedSize?.image || product?.image || product?.images?.[0] || "/images/img_product_item_image.png",
    price: toNumber(selectedSize?.pricing?.finalPrice ?? selectedSize?.price ?? product?.price ?? product?.pricing?.finalPrice),
    oldPrice: selectedSize?.oldPrice ? toNumber(selectedSize.oldPrice) : product?.oldPrice ? toNumber(product.oldPrice) : 0,
    discount: product?.discount || "",
    quantity,
    stock,
    selectedSize,
    selectedColor,
    optionLabel: product?.optionLabel || "Size",
    prescriptionRequired: Boolean(product?.prescriptionRequired),
    vetOnly: Boolean(product?.vetOnly),
  };
};

const readCartItems = () => {
  try {
    const storedItems = window.localStorage.getItem(CART_STORAGE_KEY);
    return storedItems ? JSON.parse(storedItems) : [];
  } catch {
    return [];
  }
};

const readAppliedCoupon = () => {
  try {
    const storedCoupon = window.localStorage.getItem(COUPON_STORAGE_KEY);
    return storedCoupon ? JSON.parse(storedCoupon) : null;
  } catch {
    return null;
  }
};

const mergeCartItems = (serverItems = [], localItems = []) => {
  const merged = [];
  [...localItems, ...serverItems].forEach((rawItem) => {
    const item = normalizeCartProduct(rawItem);
    const index = merged.findIndex((cartItem) => cartItem.id === item.id);
    if (index === -1) {
      merged.push(item);
      return;
    }
    merged[index] = {
      ...merged[index],
      ...item,
      quantity: Math.max(Number(merged[index].quantity) || 1, Number(item.quantity) || 1),
    };
  });
  return merged;
};

const isSameCartProduct = (cartItem, product) => {
  const item = normalizeCartProduct(product);
  if (cartItem.variantId || item.variantId) {
    return (
      String(cartItem.productId) === String(item.productId) &&
      String(cartItem.variantId || "") === String(item.variantId || "")
    );
  }
  return (
    cartItem.id === item.id ||
    cartItem.slug === item.slug ||
    cartItem.productId === item.productId ||
    cartItem.productId === item.id ||
    cartItem.id === item.productId
  );
};

export const CartProvider = ({ children }) => {
  const { customer, isLoggedIn } = useAuth();
  const [cartItems, setCartItems] = useState(readCartItems);
  const [appliedCoupon, setAppliedCoupon] = useState(readAppliedCoupon);
  const [remoteCartReady, setRemoteCartReady] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const cartSyncTimerRef = useRef(null);
  const shippingTimerRef = useRef(null);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    if (!isLoggedIn || !remoteCartReady) return undefined;

    window.clearTimeout(cartSyncTimerRef.current);
    cartSyncTimerRef.current = window.setTimeout(() => {
      cartApi.syncCart(cartItems).catch(() => {});
    }, 250);

    return () => window.clearTimeout(cartSyncTimerRef.current);
  }, [cartItems, isLoggedIn, remoteCartReady]);

  useEffect(() => {
    if (!isLoggedIn) {
      setRemoteCartReady(false);
      setCartItems(readCartItems());
      return undefined;
    }

    let cancelled = false;
    setRemoteCartReady(false);
    const localItems = readCartItems();

    cartApi
      .getCart()
      .then(async (serverItems) => {
        if (cancelled) return;
        const mergedItems = mergeCartItems(serverItems, localItems);
        setCartItems(mergedItems);
        setRemoteCartReady(true);
        if (localItems.length > 0) {
          await cartApi.syncCart(mergedItems).catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setRemoteCartReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, customer?.id]);

  useEffect(() => {
    if (appliedCoupon) {
      window.localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
    } else {
      window.localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [appliedCoupon]);

  const addToCart = (product) => {
    const item = normalizeCartProduct(product);
    const limit = Number.isFinite(item.stock) ? item.stock : NO_STOCK_LIMIT;

    if (limit <= 0) {
      return { added: false, outOfStock: true };
    }

    removeWishlistProduct(product);
    let capped = false;
    setCartItems((items) => {
      const existingItem = items.find((cartItem) => cartItem.id === item.id);
      if (!existingItem) {
        capped = item.quantity < Math.max(1, Number(product?.quantity) || 1);
        return [item, ...items];
      }

      const requestedQuantity = existingItem.quantity + (Number(product?.quantity) || item.quantity);
      const nextQuantity = Math.min(requestedQuantity, limit);
      capped = nextQuantity < requestedQuantity;

      return items.map((cartItem) =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: nextQuantity, stock: item.stock }
          : cartItem,
      );
    });

    return { added: true, capped, limit };
  };

  const addManyToCart = (products = [], options = {}) => {
    const { removeFromWishlist = true } = options;
    const addedProducts = [];
    const normalizedItems = [];

    products.forEach((product) => {
      const item = normalizeCartProduct(product);
      const limit = Number.isFinite(item.stock) ? item.stock : NO_STOCK_LIMIT;
      if (limit <= 0) return;
      addedProducts.push(product);
      normalizedItems.push(item);
    });

    if (removeFromWishlist) {
      removeWishlistProducts(addedProducts);
    }

    setCartItems((items) => {
      const nextItems = [...items];
      normalizedItems.forEach((item) => {
        const limit = Number.isFinite(item.stock) ? item.stock : NO_STOCK_LIMIT;
        const existingIndex = nextItems.findIndex((cartItem) => cartItem.id === item.id);
        if (existingIndex === -1) {
          nextItems.unshift(item);
          return;
        }
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: Math.min(nextItems[existingIndex].quantity + item.quantity, limit),
          stock: item.stock,
        };
      });
      return nextItems;
    });

    return {
      addedCount: normalizedItems.length,
      skippedCount: products.length - normalizedItems.length,
      addedProducts,
    };
  };

  const startBuyNowCheckout = (product) => {
    const item = normalizeCartProduct(product);
    window.sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(item));
    return item;
  };

  const removeFromCart = (productId) => {
    setCartItems((items) =>
      items.filter((item) => item.id !== productId && item.slug !== productId),
    );
  };

  const updateQuantity = (productId, quantity) => {
    const requestedQuantity = Math.max(1, Number(quantity) || 1);
    setCartItems((items) =>
      items.map((item) => {
        if (item.id !== productId && item.slug !== productId) return item;
        const limit = Number.isFinite(item.stock) ? item.stock : NO_STOCK_LIMIT;
        return { ...item, quantity: Math.min(requestedQuantity, limit) };
      }),
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const isProductInCart = useCallback(
    (product) => cartItems.some((cartItem) => isSameCartProduct(cartItem, product)),
    [cartItems],
  );

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const discount = 0;
  const couponBaseAmount = Math.max(0, subtotal - discount);
  const couponDiscount = (() => {
    if (!appliedCoupon || couponBaseAmount <= 0) return 0;
    if (appliedCoupon.minOrder && couponBaseAmount < Number(appliedCoupon.minOrder)) return 0;
    if (appliedCoupon.type === "percentage") {
      return toMoney(Math.min((couponBaseAmount * Number(appliedCoupon.value || 0)) / 100, couponBaseAmount));
    }
    if (appliedCoupon.type === "flat") {
      return toMoney(Math.min(Number(appliedCoupon.value || 0), couponBaseAmount));
    }
    return toMoney(Math.min(Number(appliedCoupon.discountAmount || 0), couponBaseAmount));
  })();

  // Dynamically resolve shipping charge from API based on subtotal
  useEffect(() => {
    window.clearTimeout(shippingTimerRef.current);
    if (!cartItems.length) {
      setShippingCost(0);
      return;
    }
    shippingTimerRef.current = window.setTimeout(() => {
      shipmentChargeApi
        .resolveCharge(subtotal)
        .then((cost) => setShippingCost(cost))
        .catch(() => setShippingCost(0));
    }, 300);
    return () => window.clearTimeout(shippingTimerRef.current);
  }, [subtotal, cartItems.length]);

  const shipping = shippingCost;
  const total = toMoney(Math.max(0, subtotal - discount - couponDiscount + shipping));
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(
    () => ({
      addToCart,
      addManyToCart,
      startBuyNowCheckout,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartItems,
      cartCount,
      isProductInCart,
      subtotal,
      discount,
      appliedCoupon,
      couponDiscount,
      couponBaseAmount,
      setAppliedCoupon,
      shipping,
      total,
    }),
    [cartItems, cartCount, isProductInCart, subtotal, discount, appliedCoupon, couponDiscount, couponBaseAmount, shipping, total],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
