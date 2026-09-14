import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";
import { cartApi } from "../api/cartApi";

const CartContext = createContext(null);

const getOrderProductId = (product = {}) => product.productId || product.id;
const getCartImage = (image) =>
  typeof image === "string" && image.length <= 4096 && !image.startsWith("data:")
    ? image
    : undefined;

// Cart sync should contain the cart snapshot, not the complete catalog product.
// Catalog products can contain large galleries, variant trees, and descriptions,
// which can exceed the API/proxy request limit even for a single cart item.
const toCartApiItems = (items = []) =>
  items.map(({ product = {}, quantity }) => {
    const compactProduct = {
      id: product.id,
      productId: getOrderProductId(product),
      name: product.name,
      title: product.title,
      price: product.price,
      sellPrice: product.sellPrice,
      originalPrice: product.originalPrice,
      image: getCartImage(product.image),
      selectedSize: product.selectedSize,
      selectedColor: product.selectedColor,
      selectedOption: product.selectedOption,
      selectedVariantId: product.selectedVariantId,
      variantId: product.variantId,
      stock: product.stock,
      stockQuantity: product.stockQuantity,
      prescriptionRequired: product.prescriptionRequired,
    };

    return {
      product: compactProduct,
      quantity,
      productId: compactProduct.productId,
      id: compactProduct.id,
      name: compactProduct.name,
    };
  });

const getDefaultProductVariant = (product) => {
  if (!product) return product;

  // Check if any variant is already selected
  if (
    (product.selectedSize || product.selectedColor || product.selectedOption) &&
    (product.selectedVariantId || product.variantId)
  ) {
    return product;
  }

  let selectedSize = "";
  let selectedColor = "";
  let selectedOption = "";

  if (product.variants?.type === "size_color") {
    selectedSize = product.variants.defaultSize || (product.variants.sizes && product.variants.sizes[0]) || "";
    selectedColor = product.variants.defaultColor || (product.variants.colors && product.variants.colors[0]) || "";
  } else if (product.variants?.options && product.variants.options.length > 0) {
    selectedOption = product.variants.default || product.variants.options[0] || "";
  } else if (Array.isArray(product.optionVariants) && product.optionVariants.length > 0) {
    const variant = product.optionVariants.find((item) => item.isAvailable !== false && String(item.status || "Active").toLowerCase() !== "inactive") || product.optionVariants[0];
    selectedOption = variant.label || variant.name || variant.variantName || "";
  } else if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    const variant = product.sizes.find((item) => item.isAvailable !== false && String(item.status || "Active").toLowerCase() !== "inactive") || product.sizes[0];
    selectedSize = variant.label || variant.name || variant.displayLabel || "";
  } else {
    return product;
  }

  let suffixParts = [];
  if (selectedSize) suffixParts.push(selectedSize);
  
  const getColorName = (hex) => {
    const colorMap = {
      "#4A4A4A": "Charcoal Grey",
      "#4B004B": "Royal Purple",
      "#D2B48C": "Beige Velvet",
      "#2B6CB0": "Ocean Blue",
      "#2F855A": "Forest Green",
      "#DD6B20": "Sunset Orange",
    };
    return colorMap[hex] || hex;
  };
  
  if (selectedColor) suffixParts.push(getColorName(selectedColor));
  if (selectedOption) suffixParts.push(selectedOption);

  const suffix = suffixParts.length > 0 ? ` (${suffixParts.join(" / ")})` : "";

  // Keep the backend's real variant identifier. The cart display ID below is
  // intentionally human-readable, but it must not be sent as variantId.
  const selectedVariant = selectedOption
    ? (product.optionVariants || []).find(
        (variant) => String(variant.label || variant.name) === String(selectedOption),
      )
    : (product.sizes || []).find((variant) =>
        String(variant.label || variant.name || variant.displayLabel) === String(selectedSize),
      );
  const selectedVariantId =
    product.selectedVariantId ||
    product.variantId ||
    selectedVariant?.id ||
    selectedVariant?._id ||
    selectedVariant?.variantId ||
    "";

  let availableStock = product.stock ?? 9999;
  if (selectedVariant) {
    const match = selectedVariant;
    if (match) availableStock = match.stock;
  }

  return {
    ...product,
    id: suffixParts.length > 0
      ? `${product.id}-${suffixParts.join("-").replace(/\s+/g, "").replace(/#/g, "")}`
      : product.id,
    name: `${product.name}${suffix}`,
    productId: product.productId || product.id,
    selectedSize,
    selectedColor: selectedColor ? getColorName(selectedColor) : "",
    selectedOption,
    selectedVariantId,
    variantId: selectedVariantId,
    stock: availableStock,
  };
};

const normalizeCartItem = (item) => {
  if (!item.product) return item;
  const normalizedProduct = getDefaultProductVariant(item.product);
  return {
    ...item,
    product: normalizedProduct,
  };
};

const normalizeCartItems = (items) => {
  const merged = [];
  for (const item of items) {
    if (!item.product) continue;
    const normalizedItem = normalizeCartItem(item);
    const existing = merged.find((m) => m.product.id === normalizedItem.product.id);
    if (existing) {
      existing.quantity += normalizedItem.quantity;
    } else {
      merged.push(normalizedItem);
    }
  }
  return merged;
};

export function CartProvider({ children }) {
  const skipNextRemoteSync = useRef(false);

  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem("happypet_cart");
      return stored ? normalizeCartItems(JSON.parse(stored)) : [];
    } catch {
      return [];
    }
  });
  
  const [appliedCouponCode, setAppliedCouponCode] = useState(() => {
    try {
      return localStorage.getItem("happypet_coupon") || "";
    } catch {
      return "";
    }
  });
  const [appliedCoupon, setAppliedCouponState] = useState(() => {
    try {
      const stored = localStorage.getItem("happypet_coupon_details");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem("happypet_cart", JSON.stringify(cartItems));
    if (skipNextRemoteSync.current) {
      skipNextRemoteSync.current = false;
      return;
    }
    if (authApi.getSession()) {
      cartApi.syncCart(toCartApiItems(cartItems)).catch(() => {});
    }
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem("happypet_coupon", appliedCouponCode);
  }, [appliedCouponCode]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem("happypet_coupon_details", JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem("happypet_coupon_details");
    }
  }, [appliedCoupon]);

  const setAppliedCoupon = (coupon) => {
    setAppliedCouponState(coupon);
    setAppliedCouponCode(coupon?.code || "");
  };

  const cartItemsRef = useRef(cartItems);
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    const hydrateRemoteCart = async () => {
      if (!authApi.getSession()) {
        return;
      }

      try {
        const currentLocalItems = cartItemsRef.current.length > 0
          ? cartItemsRef.current
          : (() => {
              try {
                const stored = localStorage.getItem("happypet_cart");
                return stored ? normalizeCartItems(JSON.parse(stored)) : [];
              } catch {
                return [];
              }
            })();

        const serverItems = await cartApi.getCart();
        const normalizedServerItems = normalizeCartItems(serverItems);

        if (normalizedServerItems.length > 0) {
          skipNextRemoteSync.current = true;
          setCartItems(normalizedServerItems);
        } else if (currentLocalItems.length > 0) {
          await cartApi.syncCart(toCartApiItems(currentLocalItems));
          setCartItems(normalizeCartItems(currentLocalItems));
        }
      } catch (err) {
        console.warn("Cart hydration warning:", err);
      }
    };

    hydrateRemoteCart();
    window.addEventListener("happypetrx-auth-change", hydrateRemoteCart);
    return () => window.removeEventListener("happypetrx-auth-change", hydrateRemoteCart);
  }, []);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const finalProduct = getDefaultProductVariant(product);
      const existing = prev.find((item) => item.product.id === finalProduct.id);
      const currentQty = existing ? existing.quantity : 0;
      const targetQty = currentQty + quantity;

      const maxStock = Number.isFinite(Number(finalProduct.stock))
        ? Number(finalProduct.stock)
        : Number.isFinite(Number(finalProduct.stockQuantity))
          ? Number(finalProduct.stockQuantity)
          : 9999;

      if (maxStock > 0 && targetQty > maxStock) {
        toast.error(`Cannot add more. Only ${maxStock} item${maxStock > 1 ? "s" : ""} available in stock.`);
        if (existing) {
          return prev.map((item) =>
            item.product.id === finalProduct.id
              ? { ...item, quantity: maxStock }
              : item
          );
        }
        return [...prev, { product: finalProduct, quantity: maxStock }];
      }

      if (existing) {
        return prev.map((item) =>
          item.product.id === finalProduct.id
            ? { ...item, quantity: targetQty }
            : item
        );
      }
      return [...prev, { product: finalProduct, quantity }];
    });
  };

  const updateCartQuantity = (productId, qty) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = Number.isFinite(Number(item.product.stock))
            ? Number(item.product.stock)
            : Number.isFinite(Number(item.product.stockQuantity))
              ? Number(item.product.stockQuantity)
              : 9999;
          const targetQty = Math.max(1, qty);
          if (maxStock > 0 && targetQty > maxStock) {
            toast.error(`Cannot exceed available stock of ${maxStock}`);
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity: targetQty };
        }
        return item;
      })
    );
  };

  const removeCartItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const removeCartItemsByProductIds = (productIds = []) => {
    const ids = productIds.map(String);
    setCartItems((prev) =>
      prev.filter((item) => {
        const displayId = String(item.product.id);
        const orderProductId = String(getOrderProductId(item.product));
        return !ids.includes(displayId) && !ids.includes(orderProductId);
      }),
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCouponCode("");
    setAppliedCouponState(null);
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);
  const appliedCouponDiscount = Number(appliedCoupon?.discountAmount || appliedCoupon?.discount || 0);

  return React.createElement(
    CartContext.Provider,
    {
      value: {
        cartItems,
        cartItemCount,
        cartSubtotal,
        appliedCouponCode,
        appliedCoupon,
        appliedCouponDiscount,
        setAppliedCouponCode,
        setAppliedCoupon,
        addToCart,
        updateCartQuantity,
        removeCartItem,
        removeCartItemsByProductIds,
        clearCart,
      },
    },
    children
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
