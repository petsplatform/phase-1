import { createContext, useContext, useState, useEffect } from "react";
import { showToast } from "../components/common/toast/ToastHelper";
import { useAuth } from "./AuthContext";
import {
  getCartApi,
  syncCartApi,
  transformProduct,
  getActiveTaxApi,
} from "../helper/axiosInstance";
import { calculateCheckoutTotals, toMoney } from "../utils/checkoutTotals";

const CartContext = createContext();

const populateVariantDetails = (item) => {
  if (!item) return item;
  let selectedVariantObj = null;
  let selectedColorName = null;

  if (item.optionVariants && item.optionVariants.length > 0) {
    selectedVariantObj = item.optionVariants.find(v => item.id && (item.id.includes(v.id) || (v.sku && item.id.includes(v.sku))));
    if (!selectedVariantObj && !item.selectedVariant && (!item.id || !item.id.includes("__"))) {
      selectedVariantObj = item.optionVariants[0];
    }
  }

  if (item.colorVariants && item.colorVariants.length > 0) {
    selectedColorName = item.colorVariants.find(c => item.id && item.id.includes(c.name))?.name;
    if (!selectedColorName && item.id && !item.id.includes("-") && !item.id.includes("__")) {
      selectedColorName = item.colorVariants[0].name;
    }
  }

  let selectedSizeName = selectedVariantObj ? null : (item.selectedSize || null);
  if (!selectedVariantObj && item.capacities && item.capacities.length > 0) {
    const matchedSize = item.capacities.find(sz => item.id && item.id.includes(sz));
    if (matchedSize) {
      selectedSizeName = matchedSize;
    }
  }

  let sellingPrice = item.sellingPrice;
  let actualPrice = item.actualPrice;
  let discount = item.discount;
  let stockLimit = item.stockLimit !== undefined ? item.stockLimit : 999;
  let inStock = item.inStock !== undefined ? item.inStock : true;

  if (selectedVariantObj) {
    const varPricing = selectedVariantObj.pricing || {};
    sellingPrice = item.sellingPrice !== undefined ? item.sellingPrice : (varPricing.finalPrice || selectedVariantObj.price || sellingPrice);
    actualPrice = item.actualPrice !== undefined ? item.actualPrice : (varPricing.price || selectedVariantObj.regularPrice || actualPrice);

    const varHasDiscount = varPricing.hasDiscount || actualPrice > sellingPrice;
    const varDiscountPercentage = varPricing.discountPercentage || 
      (varHasDiscount && actualPrice > 0 ? Math.round(((actualPrice - sellingPrice) / actualPrice) * 100) : 0);
    discount = item.discount || (varHasDiscount ? `${varDiscountPercentage}% OFF` : null);

    inStock = item.inStock !== undefined
      ? item.inStock
      : selectedVariantObj.inventory?.isInStock !== undefined
        ? selectedVariantObj.inventory.isInStock
        : selectedVariantObj.stock > 0;

    stockLimit = item.stockLimit !== undefined
      ? item.stockLimit
      : selectedVariantObj.inventory?.stockQuantity !== undefined
        ? selectedVariantObj.inventory.stockQuantity
        : selectedVariantObj.stock !== undefined
          ? selectedVariantObj.stock
          : stockLimit;
  } else {
    stockLimit = item.stockLimit !== undefined
      ? item.stockLimit
      : item.inventory?.stockQuantity !== undefined
        ? item.inventory.stockQuantity
        : item.stock !== undefined
          ? item.stock
          : stockLimit;
  }

  return {
    ...item,
    sellingPrice: Number(sellingPrice) || 0,
    actualPrice: Number(actualPrice) || Number(sellingPrice) || 0,
    discount,
    stockLimit,
    inStock,
    selectedVariant: item.selectedVariant || (selectedVariantObj ? (selectedVariantObj.label || selectedVariantObj.size) : null),
    selectedColor: item.selectedColor || selectedColorName || null,
    selectedSize: item.selectedSize || selectedSizeName
  };
};

const getProductId = (item) =>
  String(item?.baseProductId || item?.productId || item?.id || "").split("__")[0];

const readStoredCart = () => {
  const saved = localStorage.getItem("pet_meds_cart");
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem("pet_meds_cart");
      return [];
    }
    return parsed.filter(Boolean).map(populateVariantDetails);
  } catch (error) {
    console.warn("Invalid cart cache cleared:", error);
    localStorage.removeItem("pet_meds_cart");
    return [];
  }
};

export function CartProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [cartItems, setCartItems] = useState(readStoredCart);
  const [loading, setLoading] = useState(true);

  const [appliedCode, setAppliedCode] = useState(() => {
    return localStorage.getItem("pet_meds_applied_coupon") || "";
  });
  const [discountPercent, setDiscountPercent] = useState(() => {
    const saved = localStorage.getItem("pet_meds_discount_percent");
    return saved ? Number(saved) : 0;
  });
  const [promoDiscount, setPromoDiscount] = useState(() => {
    const savedCode = localStorage.getItem("pet_meds_applied_coupon");
    if (!savedCode) return 0;
    const saved = localStorage.getItem("pet_meds_promo_discount");
    return saved ? Number(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem("pet_meds_applied_coupon", appliedCode);
  }, [appliedCode]);

  useEffect(() => {
    localStorage.setItem("pet_meds_discount_percent", String(discountPercent));
  }, [discountPercent]);

  useEffect(() => {
    localStorage.setItem("pet_meds_promo_discount", String(promoDiscount));
  }, [promoDiscount]);
  const [taxRate, setTaxRate] = useState(0);
  const [taxName, setTaxName] = useState("Estimated Tax");
  const [taxLoading, setTaxLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setTaxLoading(true);
    getActiveTaxApi()
      .then((record) => {
        if (!active) return;
        if (record) {
          if (record.name) {
            setTaxName(record.name);
          }
          const rateVal =
            record.rate !== undefined
              ? record.rate
              : record.taxRate !== undefined
                ? record.taxRate
                : record.value;
          if (rateVal !== undefined && !isNaN(rateVal)) {
            const parsedRate = Number(rateVal);
            const ratePercent =
              parsedRate < 1 && parsedRate > 0 ? parsedRate * 100 : parsedRate;
            setTaxRate(ratePercent);
          } else {
            setTaxRate(0);
          }
        } else {
          setTaxRate(0);
          setTaxName("Estimated Tax");
        }
      })
      .catch((err) => {
        console.error("Failed to load active tax rate dynamically in CartContext:", err);
        if (active) {
          setTaxRate(0);
          setTaxName("Estimated Tax");
        }
      })
      .finally(() => {
        if (active) setTaxLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Load cart on mount or login status change
  useEffect(() => {
    let active = true;

    const loadCart = async () => {
      setLoading(true);
      if (isLoggedIn) {
        try {
          const res = await getCartApi();
          if (active) {
            if (res && res.success && res.data) {
              const backendItems = (res.data.items || [])
                .map((item) => {
                  const prod = item.product || item;
                  if (!prod) return null;
                  const transformed = transformProduct(prod);
                  return {
                    ...transformed,
                    id: prod.id || item.id || item.productId,
                    productId: item.productId || prod.id,
                    quantity: item.quantity || 1,
                  };
                })
                .filter(Boolean)
                .map(populateVariantDetails);

              // Merge guest cart with backend cart if there are guest items
              const guestCartStr = localStorage.getItem("pet_meds_cart");
              if (guestCartStr) {
                const guestItems = readStoredCart();
                if (guestItems.length > 0) {
                  const merged = [...backendItems];
                  guestItems.forEach((gItem) => {
                    const exist = merged.find((bItem) => bItem.id === gItem.id);
                    if (exist) {
                      exist.quantity = Math.max(exist.quantity, gItem.quantity);
                    } else {
                      merged.push(gItem);
                    }
                  });

                  // Sync merged cart to backend
                  const payload = {
                    items: merged.map((item) => ({
                      productId: getProductId(item),
                      quantity: item.quantity,
                    })),
                  };
                  await syncCartApi(payload);
                  setCartItems(merged);
                  localStorage.removeItem("pet_meds_cart");
                  setLoading(false);
                  return;
                }
              }

              setCartItems(backendItems);
            } else {
              setCartItems([]);
            }
          }
        } catch (err) {
          console.error("Failed to fetch cart from backend:", err);
          if (active) {
            setCartItems(readStoredCart());
          }
        }
      } else {
        setCartItems(readStoredCart());
      }
      if (active) setLoading(false);
    };

    loadCart();

    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  // Sync cart to localStorage and backend on cart changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("pet_meds_cart", JSON.stringify(cartItems));

      if (isLoggedIn) {
        const payload = {
          items: cartItems.map((item) => ({
            productId: getProductId(item),
            quantity: item.quantity,
          })),
        };
        syncCartApi(payload).catch((err) => {
          console.error("Failed to sync cart to backend:", err);
        });
      }
    }
  }, [cartItems, isLoggedIn, loading]);

  const addToCart = (product, qty = 1) => {
    setAppliedCode("");
    setDiscountPercent(0);
    setPromoDiscount(0);
    const populatedProduct = populateVariantDetails(product);
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === populatedProduct.id);
      const limit = populatedProduct.stockLimit !== undefined ? populatedProduct.stockLimit : 999;
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > limit) {
          showToast.error(
            `Cannot add more. Only ${limit} units are available in stock.`,
          );
          return prev.map((item) =>
            item.id === populatedProduct.id ? { ...item, quantity: limit } : item,
          );
        }
        return prev.map((item) =>
          item.id === populatedProduct.id ? { ...item, quantity: newQty } : item,
        );
      }
      return [
        ...prev,
        {
          ...populatedProduct,
          productId: getProductId(populatedProduct),
          quantity: qty,
        },
      ];
    });
  };

  const removeFromCart = (id) => {
    setAppliedCode("");
    setDiscountPercent(0);
    setPromoDiscount(0);
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setAppliedCode("");
    setDiscountPercent(0);
    setPromoDiscount(0);
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const limit = item.stockLimit !== undefined ? item.stockLimit : 999;
          if (quantity > limit) {
            showToast.error(`Only ${limit} units are available in stock.`);
            return { ...item, quantity: limit };
          }
          return { ...item, quantity };
        }
        return item;
      }),
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCode("");
    setDiscountPercent(0);
    setPromoDiscount(0);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = toMoney(
    cartItems.reduce(
      (acc, item) => acc + item.sellingPrice * item.quantity,
      0,
    ),
  );

  const autoShipSavings = 0;
  const shippingCost = 0;
  const checkoutTotals = calculateCheckoutTotals({
    subtotal: cartSubtotal,
    cartDiscount: 0,
    shipping: 0,
    taxRate,
    couponDiscount: promoDiscount,
  });
  const estimatedTax = checkoutTotals.tax;
  const cartTotal = checkoutTotals.total;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        autoShipSavings,
        shippingCost,
        estimatedTax,
        cartTotal,
        loading,
        appliedCode,
        setAppliedCode,
        discountPercent,
        setDiscountPercent,
        promoDiscount,
        setPromoDiscount,
        taxRate,
        taxLoading,
        taxName,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
