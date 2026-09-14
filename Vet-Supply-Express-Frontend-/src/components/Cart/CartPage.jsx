import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Lock,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Truck,
  ShieldAlert,
} from "lucide-react";
import { AppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { isVetOnly, lacksVetAccess, getProductUrl } from "../../utils/productUtils";
import { CUSTOMER_BLOCKED_REASON_KEY, AUTH_CHANGE_EVENT } from "../../api/authStorage";
import { shipmentChargeApi } from "../../api/shipmentChargeApi";
import ProductImage from "../Common/ProductImage";

const CartPage = () => {
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, cartTotal, cartCount } =
    useContext(AppContext);

  const navigate = useNavigate();
  const hasVetRestriction = cart.some(
    (item) => lacksVetAccess(item.product || item, user)
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [blockedReason, setBlockedReason] = useState(() => {
    if (!user) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      return "";
    }
    return localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY) || "";
  });
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLabel, setShippingLabel] = useState("Shipping");
  const [shippingLoading, setShippingLoading] = useState(false);
  const ITEMS_PER_PAGE = 5;

  const totalPages = Math.ceil(cart.length / ITEMS_PER_PAGE);
  const effectiveBlockedReason = user ? (blockedReason || (user?.isBlocked ? "Your account has been blocked." : "")) : "";

  useEffect(() => {
    if (!user) {
      setBlockedReason("");
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    }
  }, [user]);

  useEffect(() => {
    const handleAuthChange = () => {
      if (!user) {
        setBlockedReason("");
        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      } else {
        const reason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
        setBlockedReason(reason || "");
      }
    };
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [user]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [cart.length, totalPages, currentPage]);

  useEffect(() => {
    let active = true;
    if (!cart.length || cartTotal <= 0) {
      setShippingCost(0);
      setShippingLabel("Shipping");
      setShippingLoading(false);
      return undefined;
    }

    setShippingLoading(true);
    shipmentChargeApi
      .resolveChargeRule(cartTotal)
      .then((rule) => {
        if (!active) return;
        setShippingCost(Number(rule?.charge) || 0);
        setShippingLabel(rule?.label || "Shipping");
      })
      .catch((err) => {
        console.error("Failed to resolve shipment charge:", err);
        if (active) {
          setShippingCost(0);
          setShippingLabel("Shipping");
        }
      })
      .finally(() => {
        if (active) setShippingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cart.length, cartTotal]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCart = cart.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const itemsStart = startIndex + 1;
  const itemsEnd = Math.min(startIndex + ITEMS_PER_PAGE, cart.length);

  const getPageNumbers = () => {
    const pages = [];
    pages.push(1);
    
    if (currentPage !== 1 && currentPage !== totalPages) {
      if (currentPage > 2) {
        pages.push("ellipsis-start");
      }
      pages.push(currentPage);
      if (currentPage < totalPages - 1) {
        pages.push("ellipsis-end");
      }
    } else {
      if (currentPage === 1 && totalPages > 2) {
        pages.push("ellipsis-end");
      }
      if (currentPage === totalPages && totalPages > 2) {
        pages.push("ellipsis-start");
      }
    }
    
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] pb-16 font-sans">
      {/* Breadcrumb banner */}
      <div className="bg-white border-b border-[#D9E8F2] py-4">
        <div className="container-custom flex items-center gap-2 text-xs font-semibold text-[#627D98] select-none">
          <Link to="/" className="hover:text-[#0874C9] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/shop" className="hover:text-[#0874C9] transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#102A43]">Shopping Cart</span>
        </div>
      </div>

      <div className="container-custom mt-8">
        <div className="flex items-center gap-3.5 mb-8">
          <div className="p-3 rounded-2xl bg-[#EAF5FC] text-[#0874C9]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-black text-2xl md:text-3xl text-[#102A43] leading-tight">
              Shopping Cart
            </h1>
            <p className="text-xs md:text-sm text-[#627D98] mt-1">
              {cartCount === 0
                ? "Your cart is currently empty"
                : `You have ${cartCount} ${cartCount === 1 ? "item" : "items"} in your cart`}
            </p>
          </div>
        </div>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white border border-[#D9E8F2] rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#EAF5FC] flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-[#0874C9] stroke-[1.5]" />
            </div>
            <h2 className="font-heading font-black text-xl text-[#102A43] mb-3">
              Your cart is empty
            </h2>
            <p className="text-sm text-[#627D98] max-w-sm mx-auto mb-8 leading-relaxed">
              Before you check out, you must add some pet medical supplies,
              prescription food, or wellness essentials to your shopping cart.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2.5 bg-[#0874C9] hover:bg-[#F28C18] text-white font-extrabold text-sm px-8 py-3.5 rounded-full transition-all duration-300 shadow-md shadow-[#0874C9]/20 hover:shadow-[#F28C18]/20 hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        ) : (
          /* Cart Table & Summary Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Desktop Header Row (Hidden on mobile) */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-white border border-[#D9E8F2] rounded-2xl text-[10px] font-black uppercase tracking-wider text-[#627D98]">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                {paginatedCart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-[#D9E8F2] p-4 md:p-6 rounded-2xl hover:border-[#0874C9]/30 hover:shadow-sm transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative group"
                  >
                    {/* Column 1: Details (Image + Name + Category/Option) */}
                    <div className="col-span-1 md:col-span-6 flex items-center gap-4 text-left">
                      {/* Image */}
                      <Link
                        to={getProductUrl(item)}
                        className="w-20 h-20 md:w-24 md:h-24 aspect-square shrink-0 rounded-xl overflow-hidden border border-[#D9E8F2] bg-[#F7FAFC]"
                      >
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          product={item}
                          className="w-full h-full object-cover transform duration-500 group-hover:scale-[1.03]"
                        />
                      </Link>

                      {/* Text details */}
                      <div className="min-w-0 flex-grow text-left">
                        <Link
                          to={getProductUrl(item)}
                          className="font-heading font-black text-sm md:text-base text-[#102A43] hover:text-[#0874C9] transition-colors leading-snug line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        {(item.selectedVariantName || item.selectedVariant) && (
                          <span className="text-[11px] font-semibold text-[#627D98] block mt-1.5 bg-[#F7FAFC] px-2 py-0.5 rounded border border-[#D9E8F2]/60 w-fit">
                            Option: {item.selectedVariantName || item.selectedVariant}
                          </span>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0874C9] bg-[#EAF5FC] px-2 py-0.5 rounded w-fit inline-block">
                            {item.category}
                          </span>
                          {(item.prescriptionRequired || item.product?.prescriptionRequired) && (
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded w-fit inline-block">
                              Rx Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Price */}
                    <div className="col-span-1 md:col-span-2 flex md:flex-col items-center justify-between md:justify-center gap-1.5">
                      <span className="text-xs font-bold text-[#627D98] md:hidden">
                        Unit Price
                      </span>
                      <span className="text-sm font-bold text-[#102A43]">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Column 3: Quantity Control */}
                    <div className="col-span-1 md:col-span-2 flex md:flex-col items-center justify-between md:justify-center gap-2">
                      <span className="text-xs font-bold text-[#627D98] md:hidden">
                        Quantity
                      </span>
                      <div className="flex items-center border border-[#D9E8F2] bg-[#F7FAFC] rounded-xl p-0.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-1.5 text-[#627D98] hover:text-[#0874C9] hover:bg-white rounded-lg transition-colors cursor-pointer"
                          aria-label="Decrease Quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3.5 text-xs font-black text-[#102A43] select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            if (item.quantity < (item.stockQuantity ?? 999)) {
                              updateQuantity(item.id, item.quantity + 1);
                            }
                          }}
                          disabled={item.quantity >= (item.stockQuantity ?? 999)}
                          className="p-1.5 text-[#627D98] hover:text-[#0874C9] hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase Quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Column 4: Total & Delete */}
                    <div className="col-span-1 md:col-span-2 flex md:flex-col items-center justify-between md:justify-center md:items-end gap-3.5">
                      <span className="text-xs font-bold text-[#627D98] md:hidden">
                        Total
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-base font-black text-[#0874C9]">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-[#627D98] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-[#D9E8F2] rounded-2xl p-4.5 mt-6 text-left">
                  {/* Left part: Stats */}
                  <span className="text-xs font-semibold text-[#627D98]">
                    Showing <span className="text-[#102A43] font-bold">{itemsStart}</span> to{" "}
                    <span className="text-[#102A43] font-bold">{itemsEnd}</span> of{" "}
                    <span className="text-[#102A43] font-bold">{cart.length}</span> items
                  </span>

                  {/* Right part: Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-[#D9E8F2] text-[#627D98] hover:text-[#0874C9] hover:bg-[#EAF5FC] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#627D98] rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {getPageNumbers().map((page, idx) => {
                      if (page === "ellipsis-start" || page === "ellipsis-end") {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-2 text-xs font-bold text-[#627D98] select-none"
                          >
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 flex items-center justify-center text-xs rounded-xl transition-all cursor-pointer ${
                            currentPage === page
                              ? "bg-[#0874C9] text-white font-black shadow-sm"
                              : "border border-[#D9E8F2] text-[#102A43] hover:bg-[#EAF5FC] hover:text-[#0874C9] font-bold"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-[#D9E8F2] text-[#627D98] hover:text-[#0874C9] hover:bg-[#EAF5FC] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#627D98] rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Back to Shopping button */}
              <div className="pt-2 text-left">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#0874C9] hover:text-[#F28C18] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>

            {/* Sidebar Summary Card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-[#D9E8F2] rounded-3xl p-6 shadow-sm text-left">
                <h3 className="font-heading font-black text-lg text-[#102A43] pb-4 border-b border-[#D9E8F2]">
                  Order Summary
                </h3>

                <div className="mt-5 space-y-3.5">
                  <div className="flex items-center justify-between text-xs md:text-sm text-[#627D98]">
                    <span>Subtotal</span>
                    <span className="text-[#102A43] font-bold">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm text-[#627D98] pb-4 border-b border-[#D9E8F2]/60">
                    <span>{shippingLabel || "Shipping"}</span>
                    <span className={`${shippingCost === 0 ? "text-emerald-600 bg-emerald-50 uppercase tracking-wider" : "text-[#102A43] bg-[#EAF5FC]"} font-black px-2 py-0.5 rounded text-[10px]`}>
                      {shippingLoading ? "Calculating..." : shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-sm font-black text-[#102A43]">
                      Total Estimate
                    </span>
                    <span className="text-xl font-black text-[#0874C9]">
                      ${(cartTotal + shippingCost).toFixed(2)}
                    </span>
                  </div>
                </div>

                {hasVetRestriction && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs flex flex-col gap-2 text-left">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-800">
                      <ShieldCheck size={16} className="text-amber-600" />
                      <span>Verified Veterinarian Required</span>
                    </div>
                    <p className="font-semibold text-amber-700">
                      Your cart contains product(s) exclusive to verified veterinarians. Order placement is restricted until vet verification is approved.
                    </p>
                    <button
                      onClick={() => navigate(user ? "/account/vet-verification" : "/login")}
                      className="self-start mt-1 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      Apply for Verification
                    </button>
                  </div>
                )}

                {effectiveBlockedReason && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-left">
                    <div className="flex items-start gap-2.5">
                      <div className="rounded-xl bg-red-100 p-1.5 text-red-600 shrink-0 mt-0.5">
                        <ShieldAlert size={15} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-xs text-red-900">Account Blocked</h4>
                        <p className="text-[10px] font-sans font-bold text-red-700 mt-0.5">{effectiveBlockedReason}</p>
                        <p className="text-[9px] font-sans text-red-600 mt-0.5">Contact support to restore your account.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Promo Code Helper Note */}
                <div className="mt-6 p-3.5 bg-[#F7FAFC] border border-[#D9E8F2] rounded-2xl flex items-start gap-2.5">
                  <Truck className="w-4.5 h-4.5 text-[#0874C9] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-[#627D98] font-medium">
                    Promo codes, tax calculations, and shipping details can be
                    managed during checkout.
                  </p>
                </div>

                {/* Checkout CTA */}
                <button
                  onClick={() => navigate("/checkout")}
                  disabled={Boolean(effectiveBlockedReason) || hasVetRestriction}
                  title={effectiveBlockedReason ? "Your account is blocked." : hasVetRestriction ? "Vet verification required." : ""}
                  className={`mt-6 w-full font-extrabold text-sm py-4 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
                    effectiveBlockedReason || hasVetRestriction
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300 shadow-none"
                      : "bg-[#0874C9] hover:bg-[#F28C18] text-white shadow-md shadow-[#0874C9]/15 hover:shadow-[#F28C18]/15 hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0874C9]"
                  }`}
                >
                  {effectiveBlockedReason ? (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      <span>Account Blocked</span>
                    </>
                  ) : hasVetRestriction ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Vet Verification Required</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Proceed to Secure Checkout</span>
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-1.5 mt-4 text-[#627D98]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[10px] font-semibold">
                    256-Bit SSL Encrypted Secure Checkout
                  </span>
                </div>
              </div>

              {/* Extra reassurance card */}
              <div className="bg-gradient-to-br from-[#0B2D4F] to-[#073B66] text-white rounded-3xl p-6 text-left shadow-sm">
                <h4 className="font-heading font-bold text-sm text-[#F28C18] mb-1.5">
                  Need Help with Your Order?
                </h4>
                <p className="text-xs text-white/80 leading-relaxed mb-4">
                  Our pet care specialists are ready to help with prescription
                  management or any product questions.
                </p>
                <Link
                  to="/contact"
                  className="text-xs font-black text-white hover:text-[#F28C18] flex items-center gap-1 transition-colors"
                >
                  <span>Contact Support</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
