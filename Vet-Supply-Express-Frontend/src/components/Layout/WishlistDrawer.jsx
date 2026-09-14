import React, { useContext, useEffect } from "react";
import { X, Heart, ShoppingCart, Trash2 } from "lucide-react";
import { AppContext } from "../../context/AppContext";
import ProductImage from "../Common/ProductImage";

const WishlistDrawer = () => {
  const {
    wishlist,
    isWishlistOpen,
    setIsWishlistOpen,
    toggleWishlist,
    addToCart
  } = useContext(AppContext);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isWishlistOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isWishlistOpen]);

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B2D4F]/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsWishlistOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 bottom-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform translate-x-0 border-l border-[#D9E8F2] animate-slide-left">
        
        {/* Header */}
        <div className="p-5 border-b border-[#D9E8F2] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 text-[#F28C18]">
              <Heart className="w-5 h-5 fill-[#F28C18] text-[#F28C18]" />
            </div>
            <h3 className="font-heading font-black text-lg text-[#102A43]">
              Your Wishlist ({wishlist.length})
            </h3>
          </div>
          <button
            onClick={() => setIsWishlistOpen(false)}
            className="p-2 text-[#627D98] hover:text-[#0874C9] hover:bg-[#F7FAFC] rounded-full transition-colors cursor-pointer"
            aria-label="Close wishlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4.5 bg-[#F7FAFC]">
          {wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-[#D9E8F2] shadow-sm mb-4">
                <Heart className="w-6 h-6 text-[#9FB3C8] stroke-[1.5]" />
              </div>
              <h4 className="font-heading font-bold text-base text-[#102A43]">Your wishlist is empty</h4>
              <p className="text-xs text-[#627D98] mt-1.5 max-w-[220px] leading-relaxed">
                Save vet products you need by tapping the heart icon in the shop.
              </p>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="mt-6 bg-[#0874C9] hover:bg-[#F28C18] text-white text-xs font-bold px-8 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-md shadow-[#0874C9]/10"
              >
                Explore Supplies
              </button>
            </div>
          ) : (
            wishlist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white border border-[#D9E8F2] p-4 rounded-2xl hover:border-[#0874C9]/25 hover:shadow-sm transition-all duration-300 relative group"
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
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs md:text-sm font-bold text-[#102A43] truncate group-hover:text-[#0874C9] transition-colors leading-snug">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => toggleWishlist(item)}
                        className="p-1 text-[#627D98] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0874C9] bg-[#EAF5FC] px-2 py-0.5 rounded w-fit inline-block mt-1">
                      {item.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4.5">
                    <span className="text-sm font-extrabold text-[#0874C9]">
                      ${Number(item.price || 0).toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        addToCart(item, 1);
                        toggleWishlist(item); // Move to cart removes it from wishlist
                      }}
                      className="flex items-center gap-1.5 bg-[#0874C9] hover:bg-[#F28C18] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer shadow-sm hover:shadow-[#F28C18]/10"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {wishlist.length > 0 && (
          <div className="p-5 border-t border-[#D9E8F2] bg-white shrink-0">
            <button
              onClick={() => {
                wishlist.forEach((item) => addToCart(item, 1));
                wishlist.forEach((item) => toggleWishlist(item));
                setIsWishlistOpen(false);
              }}
              className="w-full bg-[#0874C9] hover:bg-[#F28C18] text-white font-extrabold text-sm py-4 px-6 rounded-full transition-all duration-300 cursor-pointer shadow-md shadow-[#0874C9]/15 hover:shadow-[#F28C18]/15 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add All to Shopping Cart</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default WishlistDrawer;
