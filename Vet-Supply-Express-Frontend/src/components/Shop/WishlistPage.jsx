import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Eye, Trash2, ChevronRight, ArrowRight, Star } from "lucide-react";
import { AppContext } from "../../context/AppContext";
import ProductImage from "../Common/ProductImage";
import { getProductUrl, hasVariants } from "../../utils/productUtils";

const WishlistPage = () => {
  const {
    wishlist,
    toggleWishlist,
    addToCart,
    clearWishlist
  } = useContext(AppContext);

  const navigate = useNavigate();

  const handleAddAllToCart = () => {
    if (wishlist.length === 0) return;
    wishlist.forEach((item) => {
      addToCart(item, 1);
    });
  };

  const handleClearWishlist = () => {
    if (window.confirm("Are you sure you want to clear all items from your wishlist?")) {
      clearWishlist();
    }
  };

  return (
    <div className="bg-[#FAFDFE] min-h-screen pb-16">
      {/* Breadcrumbs Banner */}
      <div className="bg-white border-b border-[#D9E8F2] py-4.5 select-none">
        <div className="container-custom flex items-center gap-2 text-xs font-semibold text-[#627D98]">
          <Link to="/" className="hover:text-[#0874C9] transition-colors flex items-center gap-1">
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9FB3C8]" />
          <Link to="/shop" className="hover:text-[#0874C9] transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9FB3C8]" />
          <span className="text-[#102A43] font-bold">Wishlist</span>
        </div>
      </div>

      <div className="container-custom py-10">
        {/* Wishlist Header and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-[#D9E8F2] pb-6 mb-8">
          <div>
            <h1 className="font-heading font-black text-2xl md:text-3xl text-[#102A43] flex items-center gap-3">
              My Saved Wishlist
              <span className="bg-[#EAF5FC] text-[#0874C9] text-xs font-black px-3.5 py-1 rounded-full border border-[#D9E8F2] shadow-sm">
                {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
              </span>
            </h1>
            <p className="text-xs md:text-sm text-[#627D98] mt-1.5">
              Keep track of clinical vet supplies, medicines, and formulas you plan to order.
            </p>
          </div>

          {wishlist.length > 0 && (
            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
              <button
                onClick={handleClearWishlist}
                className="flex items-center gap-2 bg-white border border-[#D9E8F2] hover:border-red-200 hover:bg-red-50 text-[#627D98] hover:text-red-600 font-bold text-xs px-5 py-3 rounded-full transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Wishlist</span>
              </button>
              <button
                onClick={handleAddAllToCart}
                className="flex items-center gap-2 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold text-xs px-6 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 cursor-pointer shadow-md shadow-[#0874C9]/15 hover:shadow-[#F28C18]/15"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add All to Cart</span>
              </button>
            </div>
          )}
        </div>

        {/* Wishlist Items List */}
        {wishlist.length === 0 ? (
          /* Empty Wishlist State */
          <div className="max-w-md mx-auto text-center py-16 px-4 bg-white border border-[#D9E8F2] rounded-3xl shadow-sm mt-8">
            <div className="w-20 h-20 rounded-full bg-[#FAFDFE] border border-[#D9E8F2] flex items-center justify-center mx-auto shadow-inner mb-6">
              <Heart className="w-9 h-9 text-[#9FB3C8] stroke-[1.5]" />
            </div>
            <h2 className="font-heading font-black text-xl text-[#102A43]">
              Your wishlist is empty
            </h2>
            <p className="text-xs md:text-sm text-[#627D98] mt-3 leading-relaxed max-w-[280px] mx-auto">
              You haven't saved any medical supplies yet. Browse our veterinary products and tap the heart icon to save items here.
            </p>
            <button
              onClick={() => navigate("/shop")}
              className="mt-8 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold text-xs px-8 py-3.5 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-md shadow-[#0874C9]/15 hover:shadow-[#F28C18]/15 flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>Explore Supplies Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((product) => {
              const discount = product.discountPercent || 0;
              const isOutOfStock = product.stockQuantity === 0;

              return (
                <div
                  key={product.id}
                  onClick={() => navigate(getProductUrl(product))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(getProductUrl(product));
                    }
                  }}
                  className="group bg-white border border-[#D9E8F2] hover:border-[#0874C9]/35 rounded-2xl p-4 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between relative h-full transform hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0874C9]"
                >
                  {/* Image / Top actions */}
                  <div className="relative">
                    {/* Remove from wishlist button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className="absolute top-0 right-0 z-10 p-2 bg-white rounded-full border border-[#D9E8F2] shadow-sm hover:shadow-md text-red-500 hover:text-red-700 transition-all hover:scale-105 cursor-pointer"
                      aria-label="Remove from Wishlist"
                    >
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </button>

                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div className="absolute top-0 left-0 z-10 bg-[#F28C18] text-white text-[10px] font-black px-2.5 py-0.5 rounded-md select-none tracking-wide shadow-sm">
                        -{discount}%
                      </div>
                    )}

                    {/* Product Thumbnail */}
                    <div className="aspect-square bg-[#F7FAFC] rounded-xl overflow-hidden mb-4 border border-[#D9E8F2] group-hover:border-[#0874C9]/20 transition-colors">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        product={product}
                        loading="lazy"
                        className="w-full h-full object-cover transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                  </div>

                  {/* Card details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      {/* Category and stock badge row */}
                      <div className="flex items-center justify-between gap-2 border-b border-[#D9E8F2]/40 pb-2 mb-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0874C9] bg-[#EAF5FC] px-2 py-0.5 rounded">
                          {product.category || "Pet Supplies"}
                        </span>
                      </div>

                      <h3 className="font-heading font-bold text-base text-[#102A43] mt-1 line-clamp-1 group-hover:text-[#0874C9] leading-snug">
                        {product.name}
                      </h3>

                      {Boolean(product.reviewCount || product.numReviews || product.ratingsCount || (Array.isArray(product.reviews) && product.reviews.length > 0)) && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= Math.round(Number(product.rating || 5))
                                    ? "fill-[#F28A16] text-[#F28A16]"
                                    : "fill-transparent text-[#CBD5E1]"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-extrabold text-[#627D98]">
                            {Number(product.rating || 5).toFixed(1)}
                          </span>
                        </div>
                      )}

                      <p className="text-[13px] text-[#627D98] leading-relaxed mt-1 line-clamp-2 min-h-[32px]">
                        {product.shortDescription || product.description}
                      </p>
                    </div>

                    {/* Pricing and cart button */}
                    <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-[#D9E8F2]/60">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-extrabold text-[#0874C9]">
                          ${Number(product.price || 0).toFixed(2)}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-[#627D98] line-through font-semibold">
                            ${Number(product.originalPrice || 0).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {(() => {
                          const isVar = hasVariants(product);
                          return (
                            <button
                              disabled={isOutOfStock}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isOutOfStock) return;
                                if (isVar) {
                                  navigate(getProductUrl(product));
                                } else {
                                  addToCart(product, 1);
                                }
                              }}
                              className={`flex-grow font-bold text-xs py-3 rounded-full transition-all duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                                !isOutOfStock
                                  ? "bg-[#0874C9] hover:bg-[#F28C18] text-white shadow-[#0874C9]/15 hover:shadow-[#F28C18]/15 hover:-translate-y-0.5"
                                  : "bg-[#F7FAFC] text-[#9FB3C8] border border-[#D9E8F2] cursor-not-allowed"
                              }`}
                            >
                              {!isOutOfStock && (
                                isVar ? (
                                  <Eye className="w-3.5 h-3.5" />
                                ) : (
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                )
                              )}
                              <span>
                                {isOutOfStock
                                  ? "Out of Stock"
                                  : isVar
                                  ? "View Variant"
                                  : "Add to Cart"}
                              </span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
