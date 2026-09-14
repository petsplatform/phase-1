import React, { useContext, useMemo } from "react";
import { AppContext } from "../../context/AppContext";
import { Heart, ShoppingCart, Eye, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductImage from "../Common/ProductImage";
import { getProductUrl, hasVariants } from "../../utils/productUtils";

const FeaturedProducts = () => {
  const { products, loadingProducts, addToCart, toggleWishlist, isInWishlist } = useContext(AppContext);
  const navigate = useNavigate();

  // Show featured or top active products from API
  const featuredList = useMemo(() => {
    if (!products || products.length === 0) return [];
    const featured = products.filter(
      (p) => p.isFeatured || p.featured || (p.tag && (p.tag.toLowerCase().includes("featured") || p.tag.toLowerCase().includes("bestseller")))
    );
    if (featured.length >= 4) {
      return featured.slice(0, 8);
    }
    return products.filter((p) => p.status?.toLowerCase() !== "inactive").slice(0, 8);
  }, [products]);

  return (
    <section id="best-sellers" className="py-20 md:py-24 bg-[#F7FAFC] select-none">
      <div className="container-custom">
        
        {/* Section Title */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#0874C9]">
            Clinical Best Sellers
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-[#102A43] mt-2 tracking-tight">
            Featured Vet Supplies
          </h2>
          <p className="text-sm text-[#627D98] mt-2">
            Trusted by clinics nationwide. High-quality products sourced directly from pharmaceutical labs.
          </p>
        </div>

        {/* Products Grid or Loading Skeleton */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#D9E8F2] rounded-2xl p-4.5 animate-pulse flex flex-col justify-between h-[420px]"
              >
                <div>
                  <div className="aspect-square w-full bg-slate-100 rounded-xl mb-4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3 mb-3" />
                  <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-full mb-1" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
                <div className="pt-3 border-t border-[#D9E8F2]/60">
                  <div className="h-6 bg-slate-100 rounded w-1/3 mb-4" />
                  <div className="h-10 bg-slate-100 rounded-full w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredList.map((product) => {
            const isWish = isInWishlist(product.id);
            const discount = product.discountPercent;
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
                className="group bg-white border border-[#D9E8F2] hover:border-[#0874C9]/35 rounded-2xl p-4.5 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between relative h-full transform hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0874C9]"
              >
                {/* Top Actions Layer */}
                <div className="relative">
                  {/* Wishlist Indicator Button - commented out on product card */}
                  {/* <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product);
                    }}
                    className={`absolute top-0 right-0 z-10 p-2 bg-white rounded-full shadow-sm hover:shadow-md border border-[#D9E8F2] transition-all hover:scale-105 cursor-pointer ${
                      isWish ? "text-red-500" : "text-[#627D98] hover:text-[#0874C9]"
                    }`}
                    aria-label="Toggle Wishlist"
                  >
                    <Heart className={`w-4 h-4 transition-transform group-active:scale-95 ${isWish ? "fill-red-500" : ""}`} />
                  </button> */}

                  {/* Discount Badge */}
                  {discount > 0 && (
                    <div className="absolute top-0 left-0 z-10 bg-[#F28C18] text-white text-[10px] font-black px-2.5 py-0.5 rounded-md select-none tracking-wide shadow-sm">
                      -{discount}%
                    </div>
                  )}

                  {/* Product Thumbnail */}
                  <div
                    className="aspect-square w-full bg-[#F7FAFC] rounded-xl overflow-hidden mb-4 relative border border-[#D9E8F2] group-hover:border-[#0874C9]/20 transition-colors"
                  >
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      product={product}
                      className="w-full h-full object-cover transform duration-500 group-hover:scale-[1.03]"
                    />
                    {product.tag && (
                      <div className="absolute bottom-2 left-2 bg-[#0B2D4F] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {product.tag}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Metadata */}
                <div className="flex-grow flex flex-col justify-between text-left">
                  <div className="flex-grow">
                    {/* Category and Stock Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0874C9]">
                        {product.category}
                      </span>
                    </div>

                    <h3
                      className="font-heading font-bold text-base text-[#102A43] mt-2.5 line-clamp-1 hover:text-[#0874C9] leading-snug"
                    >
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

                    {/* Description */}
                    <p className="text-[13px] text-[#627D98] leading-relaxed mt-1 line-clamp-2 min-h-[32px]">
                      {product.shortDescription || product.description}
                    </p>
                  </div>

                  {/* Pricing Details */}
                  <div className="flex items-baseline gap-2 mt-4 pt-3 border-t border-[#D9E8F2]/60">
                    <span className="text-base font-extrabold text-[#0874C9]">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-xs text-[#627D98] line-through font-semibold">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  {(() => {
                    const isVar = hasVariants(product);
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isOutOfStock) return;
                          if (isVar) {
                            navigate(getProductUrl(product));
                          } else {
                            addToCart(product, 1);
                          }
                        }}
                        disabled={isOutOfStock}
                        className={`w-full mt-4 font-bold text-xs py-3 rounded-full transition-all duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
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
            );
          })}
        </div>
        )}

        {/* Bottom Call to Shop */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate("/shop")}
            className="inline-flex items-center gap-2.5 bg-[#0B2D4F] hover:bg-[#0874C9] text-white font-bold text-sm px-10 py-4 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#0B2D4F]/10 hover:-translate-y-0.5 cursor-pointer shadow-md"
          >
            Explore Complete Veterinary Catalog
          </button>
        </div>

      </div>
    </section>
  );
};

export default FeaturedProducts;
