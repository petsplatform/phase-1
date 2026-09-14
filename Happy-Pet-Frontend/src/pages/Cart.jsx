import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "../utils/cartFunctionality";
import { productApi } from "../api/productApi";
import { shipmentChargeApi } from "../api/shipmentChargeApi";
import api from "../api/axios";
import { useAuth } from "../store/authentication/authContext";
import { isVetOnly } from "../utils/productUtils";

export default function Cart() {
  const { currentUser } = useAuth();
  const {
    cartItems,
    cartItemCount,
    cartSubtotal,
    appliedCouponDiscount,
    updateCartQuantity,
    removeCartItem,
  } = useCart();

  const [activeTax, setActiveTax] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLabel, setShippingLabel] = useState("");
  const [productsDetailMap, setProductsDetailMap] = useState({});
  const navigate = useNavigate();

  const vetRestrictedItems = cartItems.filter((item) => {
    const baseProductId = item.product.productId || item.product.id;
    const fullProduct = productsDetailMap[baseProductId];
    const itemVetOnly = isVetOnly(item.product) || isVetOnly(fullProduct);
    return itemVetOnly && !currentUser?.isVetVerified;
  });
  const hasVetRestriction = vetRestrictedItems.length > 0;

  const handleCheckoutClick = () => {
    if (hasVetRestriction) {
      toast.error(
        "Some items in your cart require veterinarian verification. Please verify your account before checking out.",
      );
      navigate(currentUser ? "/profile?tab=vet-verification" : "/login");
      return;
    }
    navigate("/checkout");
  };

  useEffect(() => {
    let active = true;

    api
      .get(`/customer-panel/taxes/active?_=${Date.now()}`)
      .then((response) => {
        const taxData = response.data?.data || response.data || null;
        if (active) {
          setActiveTax(taxData);
        }
      })
      .catch(() => {
        if (active) setActiveTax(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!cartSubtotal || cartSubtotal <= 0) {
      setShippingCost(0);
      setShippingLabel("");
      return;
    }

    shipmentChargeApi
      .resolveChargeInfo(cartSubtotal)
      .then(({ charge, matched }) => {
        if (active) {
          setShippingCost(Number(charge || 0));
          setShippingLabel(
            matched?.label || matched?.name || matched?.title || "",
          );
        }
      })
      .catch(() => {
        if (active) {
          setShippingCost(0);
          setShippingLabel("");
        }
      });

    return () => {
      active = false;
    };
  }, [cartSubtotal]);

  useEffect(() => {
    let active = true;
    const fetchDetails = async () => {
      const uniqueProductIds = [
        ...new Set(
          cartItems
            .map((item) => item.product.productId || item.product.id)
            .filter(Boolean),
        ),
      ];
      const newDetails = { ...productsDetailMap };
      let updated = false;

      for (const pid of uniqueProductIds) {
        if (!newDetails[pid]) {
          try {
            const p = await productApi.getProductById(pid);
            if (active) {
              newDetails[pid] = p;
              updated = true;
            }
          } catch (e) {
            console.error(
              "Failed to fetch product details for cart item",
              pid,
              e,
            );
          }
        }
      }

      if (active && updated) {
        setProductsDetailMap(newDetails);
      }
    };

    if (cartItems.length > 0) {
      fetchDetails();
    }

    return () => {
      active = false;
    };
  }, [cartItems]);

  const getCartItemStock = (item) => {
    const baseProductId = item.product.productId || item.product.id;
    const fullProduct = productsDetailMap[baseProductId];
    if (fullProduct) {
      if (fullProduct.optionVariants) {
        const selectedOption =
          item.product.selectedOption ||
          fullProduct.variants?.default ||
          (fullProduct.variants?.options && fullProduct.variants.options[0]);
        if (selectedOption) {
          const variantObj = fullProduct.optionVariants.find(
            (v) => v.label === selectedOption,
          );
          return variantObj ? variantObj.stock : (fullProduct.stock ?? 9999);
        }
      }
      return fullProduct.stock ?? 9999;
    }
    return item.product.stock ?? 9999;
  };

  // Calculations
  const activeTaxesList = useMemo(() => {
    if (!activeTax) return [];
    let raw = activeTax;
    if (
      raw &&
      typeof raw === "object" &&
      !Array.isArray(raw) &&
      raw.data !== undefined
    ) {
      raw = raw.data;
    }
    if (Array.isArray(raw)) {
      return raw.filter((t) => t && Number(t.rate ?? t.taxRate ?? 0) > 0);
    }
    if (raw && typeof raw === "object") {
      const rate = Number(raw.rate ?? raw.taxRate ?? 0);
      if (rate > 0) return [raw];
    }
    return [];
  }, [activeTax]);

  const discountAmount = appliedCouponDiscount;
  const taxableAmount = Math.max(cartSubtotal - discountAmount, 0);

  const totalTaxAmount = useMemo(() => {
    return activeTaxesList.reduce((sum, tax) => {
      const rate = Number(tax.rate ?? tax.taxRate ?? 0);
      return sum + Number(((taxableAmount * rate) / 100).toFixed(2));
    }, 0);
  }, [activeTaxesList, taxableAmount]);

  const grandTotal = taxableAmount + shippingCost + totalTaxAmount;

  const handleRemove = (productId, productName) => {
    removeCartItem(productId);
    toast(`${productName} removed from cart.`, {
      icon: "🗑️",
    });
  };

  return (
    <main
      className="flex-grow select-none py-12 relative min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #FAF8FF 0%, #FFFBF7 50%, #FAF8FF 100%)",
      }}
    >
      {/* Decorative background glows */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-20 left-0 w-[450px] h-[450px] bg-brand-peach/5 rounded-full blur-[90px] pointer-events-none z-0" />

      <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── BREADCRUMBS & HEADER ── */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-brand-purple">
            <Link to="/">Home</Link>
            <ChevronRight className="w-3 h-3 text-brand-purple/20" />
            <span>Cart</span>
          </div>
        </div>
        <div className="text-left mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-brand-purple tracking-tight leading-tight">
                Your Shopping Cart
              </h1>
              <p className="text-sm text-brand-brown/70 font-medium mt-2 leading-relaxed">
                Review your items, apply promotional codes, and complete your
                order details securely.
              </p>
            </div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State Overhaul */
          <div className="bg-white border border-[#f0ebf8] rounded-[32px] p-12 text-center max-w-xl mx-auto shadow-sm mt-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-peach/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-purple/5 rounded-full blur-xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-brand-peach/10 text-brand-peach flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShoppingBag className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-display font-extrabold text-brand-purple">
              Your cart feels a bit empty
            </h2>
            <p className="text-xs sm:text-sm text-brand-brown/65 mt-3.5 leading-relaxed font-semibold max-w-sm mx-auto">
              Explore our bestseller collections and add organic nutrition,
              health supplements, active play toys, or collars for your pets.
            </p>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-xs px-8 py-4 rounded-xl transition-all duration-300 shadow-md mt-8 active:scale-97 cursor-pointer"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Active Cart Grid Overhaul */
          <div>
            {hasVetRestriction && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4.5 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                      Verified Veterinarian Required
                    </h4>
                    <p className="text-xs font-semibold text-amber-700 mt-0.5">
                      Your cart contains product(s) exclusive to verified
                      veterinarians. Please verify your account before checking
                      out.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate(
                      currentUser ? "/profile?tab=vet-verification" : "/login",
                    )
                  }
                  className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Apply for Verification
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Area: Cart Items List (8 Columns) */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="bg-white border border-[#f0ebf8] rounded-3xl p-6 shadow-[0_8px_30px_rgba(75,0,75,0.01)] text-left">
                  <div className="flex items-center justify-between pb-4 border-b border-[#f0ebf8] mb-6">
                    <span className="text-xs font-extrabold text-brand-purple uppercase tracking-wider">
                      Cart Items ({cartItemCount} item
                      {cartItemCount === 1 ? "" : "s"})
                    </span>
                  </div>

                  <div className="flex flex-col gap-6 divide-y divide-[#f5effd]">
                    {cartItems.map((item, idx) => {
                      const { product, quantity } = item;
                      const maxStock = getCartItemStock(item);
                      return (
                        <div
                          key={product.id}
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 ${
                            idx > 0 ? "pt-6" : ""
                          }`}
                        >
                          {/* Image & Title Card */}
                          <div className="flex items-center gap-4 text-left flex-1 min-w-0 w-full">
                            <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border border-brand-purple/5 shadow-inner bg-brand-cream/10 shrink-0 group">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] font-extrabold text-[#a855f7] bg-brand-purple/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {product.categoryName}
                              </span>
                              <h3 className="text-sm sm:text-base font-extrabold text-brand-purple line-clamp-2 mt-2 leading-tight">
                                {product.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-sm font-extrabold text-brand-purple">
                                  ${product.sellPrice.toFixed(2)}
                                </span>
                                {product.originalPrice &&
                                  product.originalPrice > product.sellPrice && (
                                    <>
                                      <span className="text-[11px] text-brand-brown/40 line-through font-semibold">
                                        ${product.originalPrice.toFixed(2)}
                                      </span>
                                      <span className="text-[9px] font-extrabold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                                        {product.discountPercentage}% OFF
                                      </span>
                                    </>
                                  )}
                              </div>

                              {/* Selected Variant Badges */}
                              {product.selectedSize ||
                              product.selectedColor ||
                              product.selectedOption ? (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {product.selectedSize && (
                                    <span className="text-[10px] font-bold text-[#4B004B] bg-[#4B004B]/5 border border-[#4B004B]/10 px-2.5 py-0.5 rounded-lg">
                                      Size: {product.selectedSize}
                                    </span>
                                  )}
                                  {product.selectedColor && (
                                    <span className="text-[10px] font-bold text-[#4B004B] bg-[#4B004B]/5 border border-[#4B004B]/10 px-2.5 py-0.5 rounded-lg">
                                      Color: {product.selectedColor}
                                    </span>
                                  )}
                                  {product.selectedOption && (
                                    <span className="text-[10px] font-bold text-[#4B004B] bg-[#4B004B]/5 border border-[#4B004B]/10 px-2.5 py-0.5 rounded-lg">
                                      Option: {product.selectedOption}{" "}
                                      {maxStock !== 9999
                                        ? `(${maxStock} available)`
                                        : ""}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                maxStock !== 9999 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    <span className="text-[10px] font-bold text-[#4B004B] bg-[#4B004B]/5 border border-[#4B004B]/10 px-2.5 py-0.5 rounded-lg">
                                      In Stock: {maxStock} available
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls & Line Total */}
                          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t border-brand-purple/[0.02] sm:border-t-0 pt-4 sm:pt-0">
                            {/* Counter Counter Widget */}
                            <div className="flex items-center gap-3.5 border border-[#e5ddf0] bg-[#faf8ff] px-3.5 py-2 rounded-xl">
                              <button
                                onClick={() =>
                                  updateCartQuantity(product.id, quantity - 1)
                                }
                                className="text-brand-purple/60 hover:text-brand-purple cursor-pointer active:scale-90 transition-transform outline-none"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-extrabold text-brand-purple w-5 text-center select-none">
                                {quantity}
                              </span>
                              <button
                                onClick={() => {
                                  if (quantity >= maxStock) {
                                    toast.error(
                                      `Cannot exceed available stock of ${maxStock}`,
                                    );
                                    return;
                                  }
                                  updateCartQuantity(product.id, quantity + 1);
                                }}
                                disabled={quantity >= maxStock}
                                className="text-brand-purple/60 hover:text-brand-purple cursor-pointer active:scale-90 transition-transform outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Product Line Total */}
                            <div className="text-right min-w-[70px]">
                              <span className="text-sm font-extrabold text-brand-purple">
                                ${(product.sellPrice * quantity).toFixed(2)}
                              </span>
                            </div>

                            {/* Delete Item Action */}
                            <button
                              onClick={() =>
                                handleRemove(product.id, product.name)
                              }
                              className="text-brand-brown/40 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all cursor-pointer outline-none"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Area: Order Summary & Coupon (4 Columns) */}
              <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-8">
                {/* Order Cost Breakdown */}
                <div className="bg-white border border-[#f0ebf8] rounded-3xl p-7 shadow-[0_8px_30px_rgba(75,0,75,0.015)]">
                  <h3 className="text-sm font-bold tracking-wider uppercase mb-5 text-left text-brand-purple">
                    Order Summary
                  </h3>

                  {/* Subtotal, Discount, Shipping list */}
                  <div className="flex flex-col gap-4 text-sm font-medium text-brand-purple border-b border-brand-purple/5 pb-6 mb-6">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-brand-purple font-bold">
                        ${cartSubtotal.toFixed(2)}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[#e76e55] font-bold">
                        <span>Discount</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {(shippingLabel || shippingCost > 0) ? (
                      <div className="flex justify-between">
                        <span>{shippingLabel || "Shipping"}</span>
                        <span className="text-brand-purple font-bold">
                          ${shippingCost.toFixed(2)}
                        </span>
                      </div>
                    ) : null}
                    {activeTaxesList.map((tax, idx) => {
                      const rate = Number(tax.rate ?? tax.taxRate ?? 0);
                      if (rate <= 0) return null;
                      const name =
                        tax.name || tax.title || tax.taxName || "Tax";
                      const amt = Number(
                        ((taxableAmount * rate) / 100).toFixed(2),
                      );
                      return (
                        <div
                          key={tax.id || tax._id || idx}
                          className="flex justify-between"
                        >
                          <span>
                            {name} ({rate.toFixed(2).replace(/\.?0+$/, "")}%)
                          </span>
                          <span className="text-brand-purple font-bold">
                            ${amt.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between items-center mb-8 text-brand-purple">
                    <span className="text-sm font-extrabold">Total</span>
                    <span className="text-3xl font-extrabold font-display">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Action Buttons: Side-by-Side Grid */}
                  <div className="grid grid-cols-2 gap-3.5 mt-6">
                    {/* Continue Shopping Button */}
                    <button
                      onClick={() => navigate("/products")}
                      className="w-full flex items-center justify-center bg-[#faf8ff] border border-[#e5ddf0] hover:bg-brand-purple/[0.03] text-brand-purple font-bold text-sm py-4 px-2.5 rounded-2xl transition-all duration-300 shadow-sm active:scale-97 cursor-pointer outline-none text-center"
                    >
                      <span>Continue Shopping</span>
                    </button>

                    {/* Checkout Link Button */}
                    <button
                      onClick={handleCheckoutClick}
                      disabled={hasVetRestriction}
                      className={`w-full flex items-center justify-center gap-1.5 font-bold text-sm py-4 px-2.5 rounded-2xl transition-all duration-300 outline-none text-center ${
                        hasVetRestriction
                          ? "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed shadow-none"
                          : "bg-brand-purple hover:bg-[#3a0038] text-white shadow-md active:scale-97 cursor-pointer group"
                      }`}
                    >
                      <span>Checkout</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
