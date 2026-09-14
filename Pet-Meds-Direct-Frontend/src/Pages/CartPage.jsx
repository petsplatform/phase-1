import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { isVetOnly } from "../utils/productUtils";
import { shipmentChargeApi } from "../api/shipmentChargeApi";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Info,
  Percent,
} from "lucide-react";
import { showToast } from "../components/common/toast/ToastHelper";

export default function CartPage() {
  const { user } = useAuth();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    autoShipSavings,
    estimatedTax,
    cartTotal,
    appliedCode,
    promoDiscount,
    discountPercent,
    taxName,
    taxRate,
  } = useCart();

  const navigate = useNavigate();
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLabel, setShippingLabel] = useState("");
  const hasVetRestriction = cartItems.some(
    (item) => isVetOnly(item.product || item) && !user?.isVetVerified
  );

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
          setShippingLabel(matched?.name || matched?.label || matched?.title || "");
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

  const finalTotal = Math.max(0, cartSubtotal - promoDiscount + estimatedTax + shippingCost);
  const formattedTaxRate = Number(taxRate || 0)
    .toFixed(2)
    .replace(/\.?0+$/, "");
  const taxLabel = formattedTaxRate
    ? `${taxName} (${formattedTaxRate}%)`
    : taxName;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-soft-mint/30 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-light-blue/40 blur-[100px]" />
        </div>

        <div className="text-center max-w-md flex flex-col items-center">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 border border-slate-200/60 shadow-xs mb-8 transition-transform hover:scale-110 duration-300">
            <ShoppingBag className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-deep-navy tracking-tight">
            Your Cart is Empty
          </h2>
          <p className="mt-4 text-sm sm:text-base font-medium text-slate-500 leading-relaxed">
            Your pet is waiting for their health essentials! Explore our
            vet-approved medications, supplements, and premium foods to get
            started.
          </p>
          <Link
            to="/"
            className="mt-8 group inline-flex items-center gap-2.5 rounded-full bg-linear-to-br from-primary-green to-dark-green px-8 py-4 text-sm font-extrabold text-white shadow-md shadow-primary-green/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-green/30"
          >
            Shop Bestsellers
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 lg:py-20 relative bg-linear-to-b from-white via-slate-50/50 to-white">
      {/* ── Ambient lights ── */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 h-[500px] w-[500px] rounded-full bg-primary-green/5 blur-[130px]" />
        <div className="absolute bottom-40 right-10 h-[400px] w-[400px] rounded-full bg-medical-teal/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* ── Futuristic Stepper Tracker ── */}
        <div className="mb-10 sm:mb-14 max-w-3xl mx-auto">
          <div className="flex items-center justify-between relative">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-200" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-[2px] bg-primary-green transition-all duration-500" />

            {/* Step 1: Cart */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary-green text-white font-bold text-sm sm:text-base border-4 border-white shadow-md ring-2 ring-primary-green/25">
                1
              </span>
              <span className="mt-2.5 text-xs sm:text-sm font-extrabold text-primary-green uppercase tracking-wider">
                Shopping Cart
              </span>
            </div>

            {/* Step 2: Checkout */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white text-slate-400 font-bold text-sm sm:text-base border-4 border-slate-200 shadow-sm">
                2
              </span>
              <span className="mt-2.5 text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                Shipping & Payment
              </span>
            </div>

            {/* Step 3: Success */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white text-slate-400 font-bold text-sm sm:text-base border-4 border-slate-200 shadow-sm">
                3
              </span>
              <span className="mt-2.5 text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                Confirmation
              </span>
            </div>
          </div>
        </div>

        {/* ── Main Title ── */}
        <h1 className="font-display text-2xl sm:text-3xl md:text-[2.2rem] font-extrabold text-deep-navy tracking-tight mb-8 sm:mb-12">
          Your Shopping Cart{" "}
          <span className="text-primary-green whitespace-nowrap">
            ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})
          </span>
        </h1>

        {/* ── Grid Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ──── LEFT: Cart Items Column (8-span) ──── */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/70 backdrop-blur-md overflow-hidden shadow-xs">
              <ul className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <li
                    key={item.id}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-slate-50/30"
                  >
                    {/* Product visual info */}
                    <div className="flex items-center gap-4 sm:gap-6 flex-1">
                      <Link
                        to={`/product/${item.slug || item.baseProductId || item.productId || String(item.id).split("__")[0]}/variants`}
                        className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2.5 overflow-hidden group hover:border-primary-green/40 transition-colors"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </Link>
                      <div className="text-left">
                        <span className="inline-block text-[10px] font-extrabold text-primary-green uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-primary-green/10">
                          {item.category}
                        </span>
                        <Link
                          to={`/product/${item.slug || item.baseProductId || item.productId || String(item.id).split("__")[0]}/variants`}
                        >
                          <h3 className="text-base sm:text-lg font-bold text-deep-navy mt-1 tracking-tight hover:text-primary-green transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        {(item.selectedVariant || item.selectedColor || item.selectedSize) && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1">
                            {item.selectedVariant && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/50">
                                Variant: {item.selectedVariant}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/50">
                                Color: {item.selectedColor}
                              </span>
                            )}
                            {item.selectedSize && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/50">
                                Size: {item.selectedSize}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="hidden sm:block text-xs font-semibold text-slate-500 mt-1 leading-relaxed max-w-md line-clamp-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 sm:hidden">
                          <span className="text-sm font-bold text-deep-navy">
                            ${item.sellingPrice.toFixed(2)}
                          </span>
                          {item.actualPrice > item.sellingPrice && (
                            <span className="text-xs font-semibold text-slate-400 line-through">
                              ${item.actualPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls and price (Desktop layout align) */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto mt-2 sm:mt-0 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
                      {/* Quantity Stepper */}
                      <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center font-bold text-sm sm:text-base text-deep-navy">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={
                            item.quantity >=
                            (item.stockLimit !== undefined
                              ? item.stockLimit
                              : 999)
                          }
                          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Desktop Price info */}
                      <div className="hidden sm:flex flex-col text-right min-w-[80px]">
                        <span className="text-base font-extrabold text-deep-navy">
                          ${(item.sellingPrice * item.quantity).toFixed(2)}
                        </span>
                        {item.actualPrice > item.sellingPrice && (
                          <span className="text-xs font-bold text-slate-400 line-through mt-0.5">
                            ${(item.actualPrice * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Delete Action button */}
                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(item.id);
                          showToast.success(`${item.name} removed from cart.`);
                        }}
                        className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 transition-all flex items-center justify-center text-slate-400 group cursor-pointer shadow-3xs"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4.5 w-4.5 group-hover:scale-105 transition-transform" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>


          </div>

          {/* ──── RIGHT: Checkout Summary Card (4-span) ──── */}
          <div className="lg:col-span-4 sticky top-36">
            <div className="rounded-[2.2rem] border border-slate-200 bg-white/80 backdrop-blur-md p-6 sm:p-8 shadow-sm text-left">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-deep-navy tracking-tight border-b border-slate-100 pb-4">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 font-sans">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-deep-navy">
                    ${cartSubtotal.toFixed(2)}
                  </span>
                </div>

                {/* Shipping Charge */}
                {shippingLabel || shippingCost > 0 ? (
                  <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                    <span>{shippingLabel || "Shipping"}</span>
                    <span className="font-bold text-deep-navy">
                      ${shippingCost.toFixed(2)}
                    </span>
                  </div>
                ) : null}
                {appliedCode && (
                  <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                    <span className="flex items-center gap-1.5 text-primary-green">
                      <Percent className="h-4 w-4" />
                      Promo Discount ({appliedCode}
                      {discountPercent > 0 ? `, ${discountPercent}%` : ""})
                    </span>
                    <span className="font-bold text-primary-green">
                      -${promoDiscount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Taxes */}
                <div className="flex items-center justify-between text-sm font-medium text-slate-600 border-b border-slate-100 pb-5">
                  <span className="flex items-center gap-1.5">
                    {taxLabel}
                    <span className="group relative cursor-pointer text-slate-400 hover:text-deep-navy transition-colors">
                      <Info className="h-3.5 w-3.5" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-deep-navy text-[10px] text-white leading-relaxed font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-10 text-center">
                        Calculated at {taxRate}% standard pet medication sales tax.
                      </span>
                    </span>
                  </span>
                  <span className="font-bold text-deep-navy">
                    ${estimatedTax.toFixed(2)}
                  </span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="block text-base font-extrabold text-deep-navy">
                      Total Price
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Includes VAT & taxes
                    </span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-deep-navy tracking-tight">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {hasVetRestriction && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-800">
                    <ShieldCheck size={16} className="text-amber-600" />
                    <span>Verified Veterinarian Required</span>
                  </div>
                  <p className="font-semibold text-amber-700">
                    Your cart contains product(s) exclusive to verified veterinarians. Order placement is restricted until vet verification is approved.
                  </p>
                  <button
                    onClick={() => navigate(user ? "/profile?tab=vet-verification" : "/login")}
                    className="self-start mt-1 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Apply for Verification
                  </button>
                </div>
              )}

              {/* Secure Checkout details */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                <button
                  type="button"
                  onClick={() => navigate("/checkout")}
                  disabled={hasVetRestriction}
                  className={`w-full h-14 rounded-full font-extrabold text-[15px] sm:text-base tracking-wide transition-all flex items-center justify-center gap-2 group ${
                    hasVetRestriction
                      ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
                      : "bg-linear-to-br from-primary-green to-dark-green text-white shadow-[0_12px_24px_rgba(88,185,71,0.22)] hover:shadow-[0_16px_32px_rgba(88,185,71,0.32)] hover:-translate-y-0.5 cursor-pointer"
                  }`}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>

                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
                  <ShieldCheck className="h-4.5 w-4.5 text-primary-green" />
                  <span>Secure 256-bit SSL checkout encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
