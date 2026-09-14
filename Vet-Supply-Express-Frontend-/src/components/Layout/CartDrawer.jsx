import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, Lock } from "lucide-react";
import { AppContext } from "../../context/AppContext";
import ProductImage from "../Common/ProductImage";

const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartTotal,
    cartCount
  } = useContext(AppContext);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B2D4F]/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 bottom-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform translate-x-0 border-l border-[#D9E8F2] animate-slide-left">
        
        {/* Header */}
        <div className="p-5 border-b border-[#D9E8F2] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EAF5FC] text-[#0874C9]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-black text-lg text-[#102A43]">
              Your Cart ({cartCount})
            </h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-[#627D98] hover:text-[#0874C9] hover:bg-[#F7FAFC] rounded-full transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4.5 bg-[#F7FAFC]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-[#D9E8F2] shadow-sm mb-4">
                <ShoppingBag className="w-6 h-6 text-[#9FB3C8] stroke-[1.5]" />
              </div>
              <h4 className="font-heading font-bold text-base text-[#102A43]">Your cart is empty</h4>
              <p className="text-xs text-[#627D98] mt-1.5 max-w-[220px] leading-relaxed">
                Add medicines and wellness essentials to get started.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-6 bg-[#0874C9] hover:bg-[#F28C18] text-white text-xs font-bold px-8 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-md shadow-[#0874C9]/10"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white border border-[#D9E8F2] p-4 rounded-2xl hover:border-[#0874C9]/25 hover:shadow-sm transition-all duration-300 relative group text-left"
              >
                {/* Product Thumbnail */}
                <div className="w-20 h-20 aspect-square shrink-0 rounded-xl overflow-hidden border border-[#D9E8F2] bg-[#F7FAFC]">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    product={item}
                    className="w-full h-full object-cover transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>

                {/* Details */}
                <div className="flex-grow min-w-0 flex flex-col justify-between h-full">
                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-[#102A43] truncate group-hover:text-[#0874C9] transition-colors leading-snug">
                      {item.name}
                    </h4>
                    {item.selectedVariantName && (
                      <span className="text-[10px] font-semibold text-[#627D98] block mt-1">
                        Option: {item.selectedVariantName}
                      </span>
                    )}
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0874C9] bg-[#EAF5FC] px-2 py-0.5 rounded w-fit inline-block mt-1.5">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-4.5">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-[#D9E8F2] bg-[#F7FAFC] rounded-xl p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 text-[#627D98] hover:text-[#0874C9] hover:bg-white rounded-lg transition-colors cursor-pointer"
                        aria-label="Decrease Quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-black text-[#102A43] select-none">
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
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price and delete */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm md:text-base font-extrabold text-[#0874C9]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-[#627D98] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info (total, checkout) */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#D9E8F2] bg-white shrink-0 text-left">
            <div className="flex items-center justify-between text-xs md:text-sm text-[#627D98] mb-3">
              <span>Subtotal</span>
              <span className="text-[#102A43] font-bold">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs md:text-sm text-[#627D98] mb-4 pb-4 border-b border-[#D9E8F2]/60">
              <span>Shipping</span>
              <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">FREE</span>
            </div>
            
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#102A43]">Total Estimate</span>
              <span className="text-xl font-black text-[#0874C9]">
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            <Link
              to="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="w-full bg-[#0874C9] hover:bg-[#F28C18] text-white font-extrabold text-sm py-4 px-6 rounded-full transition-all duration-300 cursor-pointer shadow-md shadow-[#0874C9]/15 hover:shadow-[#F28C18]/15 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Proceed to Secure Checkout</span>
            </Link>
            
            <div className="flex items-center justify-center gap-1.5 mt-3.5 text-[#627D98]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <p className="text-[10px] font-semibold text-center leading-none">
                256-Bit SSL Encrypted secure checkout.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CartDrawer;
