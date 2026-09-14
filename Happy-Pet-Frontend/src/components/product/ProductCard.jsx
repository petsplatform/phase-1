import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Eye, Star, FileText, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { isPrescriptionRequired, isVetOnly, lacksVetAccess, getProductUrl, hasVariants, isFamilyProduct } from "../../utils/productUtils";
import { useAuth } from "../../store/authentication/authContext";

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
}) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    id,
    name,
    originalPrice,
    sellPrice,
    discountPercentage,
    description,
    categoryName,
    inStock,
    image,
  } = product;

  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, currentUser);

  const productUrl = getProductUrl(product);
  const productHasVariants = hasVariants(product);
  const [added, setAdded] = useState(false);

  const ratingScore = Number(product.rating || product.averageRating || 0);
  const reviewCount = Number(
    product.reviewCount ||
    product.reviewsCount ||
    (Array.isArray(product.reviews) ? product.reviews.length : 0) ||
    0,
  );

  const [wishlistActive, setWishlistActive] = useState(isWishlisted);

  useEffect(() => {
    setWishlistActive(isWishlisted);
  }, [isWishlisted]);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistActive(!wishlistActive);
    if (onToggleWishlist) {
      onToggleWishlist(id, product);
    }
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (userLacksVet) {
      toast.error("This product is available only for verified veterinarians.");
      navigate(currentUser ? "/profile?tab=vet-verification" : "/login");
      return;
    }

    if (!inStock) {
      toast.error(`${name} is out of stock.`);
      return;
    }

    if (productHasVariants && isFamilyProduct(product)) {
      navigate(productUrl);
      return;
    }

    if (onAddToCart) {
      const defaultVariant = product.optionVariants?.find((item) => item.isAvailable !== false) || product.sizes?.find((item) => item.isAvailable !== false);
      const variantName = defaultVariant?.label || defaultVariant?.name || defaultVariant?.variantName || defaultVariant?.displayLabel;
      onAddToCart(product, 1, variantName);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } else {
      navigate(productUrl);
    }
  };

  return (
    <div className="group relative flex flex-col bg-white border border-brand-purple/5 rounded-[14px] p-4.5 transition-all duration-500 shadow-md hover:shadow-[0_30px_60px_rgba(75,0,75,0.06)] hover:-translate-y-1.5 w-full select-none justify-between">
      {/* Product Image Frame */}
      <div className="relative w-full h-64 sm:h-72 rounded-[14px] overflow-hidden bg-brand-cream/15 mb-5 flex-shrink-0">
        <Link to={productUrl} className="block w-full h-full" title="View product">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover scale-101 group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />

          {/* Hover Overlay with Eye Icon */}
          <div className="absolute inset-0 bg-brand-purple/20 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/95 text-brand-purple flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-brand-peach hover:text-brand-purple hover:scale-110">
              <Eye className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-3.5 left-3.5 pointer-events-none z-10 flex flex-col gap-1.5">
          {requiresVet && (
            <span className="inline-flex items-center gap-1 bg-brand-purple text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
              <ShieldCheck className="w-3 h-3 text-brand-peach" />
              Vet Required
            </span>
          )}
          {isPrescriptionRequired(product) && (
            <span className="inline-flex items-center gap-1 bg-brand-purple/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
              <FileText className="w-3 h-3 text-brand-peach" />
              Rx Required
            </span>
          )}
        </div>

        {/* Top Overlay Badge & Wishlist Button - Commented out as requested */}
        {/*
        <div className="absolute top-3.5 right-3.5 pointer-events-auto z-10">
          <button
            onClick={handleWishlistClick}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ${
              wishlistActive
                ? "bg-brand-purple text-brand-peach border-none"
                : "bg-white/90 backdrop-blur-sm text-brand-purple border border-white hover:text-red-500"
            }`}
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-4.5 h-4.5 ${wishlistActive ? "fill-current text-brand-peach" : ""}`}
            />
          </button>
        </div>
        */}
      </div>

      {/* Product Card Content Info */}
      <div className="px-1 flex flex-col justify-between flex-grow">
        <Link to={productUrl} className="block text-left">
          {/* Category Row */}
          <div className="flex items-center text-[11px] font-bold uppercase tracking-wider">
            <span className="text-brand-purple/60">{categoryName}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-brand-purple font-display font-semibold text-[16px] line-clamp-2 mt-3 leading-tight group-hover:text-brand-peach transition-colors duration-300 min-h-[2.5rem]">
            {name}
          </h3>

          {/* Star Rating Summary */}
          {reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(ratingScore)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-extrabold text-brand-purple">
              {ratingScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-brand-brown/50 font-bold">
              ({reviewCount})
            </span>
          </div>
          )}

          {/* Product Description */}
          <p className="text-[16px] text-brand-brown/70 font-medium line-clamp-2 mt-2 leading-relaxed min-h-[2.6rem]">
            {stripHtml(description)}
          </p>


          {/* Price Row */}
          <div className="flex items-center gap-2 mt-4.5">
            <div className="flex items-baseline">
              <span className="text-xl font-bold text-brand-purple">
                ${sellPrice.toFixed(2)}
              </span>
              {originalPrice > sellPrice && (
                <span className="text-xs text-brand-brown/40 line-through font-semibold ml-2">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Discount Badge on the right */}
            {discountPercentage > 0 && (
              <div className="ml-auto bg-brand-peach text-brand-purple text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {discountPercentage}% OFF
              </div>
            )}
          </div>
        </Link>

        {/* Full-width Cart / Action Button */}
        <button
          onClick={handleCartClick}
          disabled={!inStock || userLacksVet}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-300 mt-5 shadow-sm ${
            userLacksVet
              ? "bg-[#17345f]/40 text-white cursor-not-allowed shadow-none opacity-80"
              : inStock
              ? "bg-brand-purple hover:bg-brand-peach text-brand-cream hover:text-brand-purple cursor-pointer active:scale-98 hover:shadow-md"
              : "bg-brand-brown/5 text-brand-brown/30 border border-brand-brown/10 cursor-not-allowed"
          }`}
        >
          {productHasVariants && isFamilyProduct(product) ? (
            <Eye className="w-4 h-4" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          <span>
            {userLacksVet
              ? "Apply for Verification"
              : !inStock
              ? "Out of Stock"
              : productHasVariants && isFamilyProduct(product)
              ? "View Variant"
              : added
              ? "Added!"
              : "Add to Cart"}
          </span>
        </button>
      </div>
    </div>
  );
}

