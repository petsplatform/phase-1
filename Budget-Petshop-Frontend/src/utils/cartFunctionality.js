import { useEffect, useRef, useState } from "react";
import { cartApi } from "../api/cartApi";
import { getCartItemCount, getCartSubtotal } from "./cart";

const CART_STORAGE_KEY = "budget-petshop-cart";
const COUPON_STORAGE_KEY = "budget-petshop-coupon";

export function useCart(authStatus = "guest") {
  const serverReadyRef = useRef(false);
  const syncingRef = useRef(false);
  const cartItemsRef = useRef([]);
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch {
      return [];
    }
  });

  const [appliedCouponCode, setAppliedCouponCode] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(COUPON_STORAGE_KEY) || "";
  });

  // Persist cart to localStorage
  useEffect(() => {
    cartItemsRef.current = cartItems;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const loadServerCart = async () => {
      if (authStatus !== "authenticated") {
        serverReadyRef.current = false;
        return;
      }

      try {
        const localItems = cartItemsRef.current;
        const serverItems = await cartApi.getCart();
        if (serverItems.length) {
          syncingRef.current = true;
          setCartItems(serverItems);
        } else if (localItems.length) {
          await cartApi.syncCart(localItems);
        }
      } catch (error) {
        console.error("Failed to load customer cart:", error);
      } finally {
        serverReadyRef.current = true;
      }
    };

    loadServerCart();
    window.addEventListener("auth-state-change", loadServerCart);
    return () => window.removeEventListener("auth-state-change", loadServerCart);
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !serverReadyRef.current) return;
    if (syncingRef.current) {
      syncingRef.current = false;
      return;
    }

    cartApi.syncCart(cartItems).catch((error) => {
      console.error("Failed to sync customer cart:", error);
    });
  }, [cartItems]);

  // Persist coupon to localStorage
  useEffect(() => {
    window.localStorage.setItem(COUPON_STORAGE_KEY, appliedCouponCode);
  }, [appliedCouponCode]);

  // Clear coupon when cart is empty
  useEffect(() => {
    if (!cartItems.length && appliedCouponCode) {
      setAppliedCouponCode("");
      window.localStorage.removeItem("budget-petshop-coupon-detail");
    }
  }, [appliedCouponCode, cartItems.length]);

  function addToCart(product, quantity = 1) {
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => String(item.id) === String(product.id));
      const limit = product.stock !== undefined ? product.stock : 99;

      if (existingItem) {
        return currentItems.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: Math.min(item.quantity + safeQuantity, limit) }
            : item,
        );
      }

      return [...currentItems, { ...product, quantity: Math.min(safeQuantity, limit) }];
    });
  }

  function updateCartQuantity(productId, nextQuantity) {
    setCartItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (String(item.id) !== String(productId)) {
          return [item];
        }

        if (nextQuantity < 1) {
          return [];
        }

        const limit = item.stock !== undefined ? item.stock : 99;
        return [{ ...item, quantity: Math.min(nextQuantity, limit) }];
      }),
    );
  }

  function removeCartItem(productId) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => String(item.id) !== String(productId)),
    );
  }

  function clearCart() {
    setCartItems([]);
    setAppliedCouponCode("");
    window.localStorage.removeItem("budget-petshop-coupon-detail");
  }

  const cartItemCount = getCartItemCount(cartItems);
  const cartSubtotal = getCartSubtotal(cartItems);

  return {
    cartItems,
    cartItemCount,
    cartSubtotal,
    appliedCouponCode,
    setAppliedCouponCode,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    clearCart,
  };
}
