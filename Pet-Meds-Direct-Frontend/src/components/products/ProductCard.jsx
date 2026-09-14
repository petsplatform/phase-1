import { useState } from "react";
import { Heart, Star, Plus, Eye, ShieldCheck, ShoppingCart } from "lucide-react";
import { showToast } from "../common/toast/ToastHelper";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { isVetOnly, lacksVetAccess, getProductUrl, hasVariants, isFamilyProduct } from "../../utils/productUtils";
import { Link, useNavigate } from "react-router-dom";

export default function ProductCard({ product, showWishlistButton = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);
  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, user);
  const productHasVariants = hasVariants(product) && isFamilyProduct(product);
  const firstAvailableVariant = product.optionVariants?.find(
    (variant) => variant.isAvailable !== false && String(variant.status || "Active").toLowerCase() !== "inactive",
  );
  const firstVariantLabel = firstAvailableVariant?.label || firstAvailableVariant?.name || firstAvailableVariant?.variantName;

  const {
    id,
    name,
    category,
    description,
    image,
    actualPrice,
    sellingPrice,
    discount,
    inStock,
    rating = 0,
    reviewsCount = 0,
  } = product;

  const { addToCart } = useCart();
  const { toggleWishlist: toggleWishlistInContext, isWishlisted } = useWishlist();
  
  const wishlisted = isWishlisted(id);

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlistInContext(product);
    if (!wishlisted) {
      showToast.wishlist(`${name} added to wishlist!`, true);
    } else {
      showToast.wishlist(`${name} removed from wishlist.`, false);
    }
  };

  const productUrl = getProductUrl(product);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (userLacksVet) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }
    if (productHasVariants) {
      navigate(productUrl);
      return;
    }
    const variantInStock = Number(firstAvailableVariant?.inventory?.stockQuantity ?? firstAvailableVariant?.stock ?? 0) > 0;
    if (!inStock && !variantInStock) {
      showToast.error(`${name} is out of stock.`);
      return;
    }
    addToCart(product, 1);
    showToast.success(`${name}${firstVariantLabel ? ` — ${firstVariantLabel}` : ""} added to cart!`);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group relative flex flex-col w-full bg-white rounded-[2rem] border border-slate-100 p-3 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(15,45,82,0.12)] hover:border-primary-green/20 hover:-translate-y-2">
      {/* Product Image Canvas */}
      <div className="relative aspect-square w-full rounded-[1.6rem] bg-gradient-to-b from-[#f8fafc] via-[#f8fafc] to-[#f1f5f9] overflow-hidden flex items-center justify-center p-3 transition-all duration-500 group-hover:from-white group-hover:via-white group-hover:to-soft-mint/20">
        
        {/* Main Image Link - Routes via getProductUrl */}
        <Link
          to={productUrl}
          className="absolute inset-0 flex items-center justify-center p-3 z-0"
        >
          {/* Core Image with soft shadow and blur/scale transitions */}
          <img
            src={image}
            alt={name}
            className="max-h-[92%] max-w-[92%] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.06)] transition-all duration-700 ease-out group-hover:scale-106 group-hover:rotate-1 group-hover:blur-[2px]"
          />

          {/* Eye Icon Hover Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-deep-navy/5 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/90 shadow-md border border-white/80 text-primary-green transform scale-75 group-hover:scale-100 transition-all duration-300">
              <Eye className="w-5.5 h-5.5 stroke-[2.5]" />
            </div>
          </div>
        </Link>

        {/* Wishlist Button - Commented out on catalog/bestseller cards as requested */}
        {showWishlistButton && (
          <button
            onClick={toggleWishlist}
            className="absolute top-3 right-3 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/70 border border-white/60 text-deep-navy/70 shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white hover:text-rose-500 active:scale-95 cursor-pointer"
            aria-label="Add to Wishlist"
          >
            <Heart
              className={`w-4.5 h-4.5 transition-all duration-300 ${
                wishlisted
                  ? "fill-rose-500 text-rose-500 scale-110"
                  : "text-deep-navy/80"
              }`}
            />
          </button>
        )}

        {/* Stock status overlay */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {requiresVet && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-md bg-primary-green text-white shadow-sm">
              <ShieldCheck className="w-3 h-3 text-amber-300" />
              Vet Required
            </span>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-col flex-1 px-3.5 pt-4.5 pb-2.5">
        {/* Category & Ratings */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-extrabold text-primary-green uppercase tracking-widest leading-none">
            {category}
          </span>
          {/* Star Rating ONLY (Shown if product has rating or reviews) */}
          {Boolean((rating && Number(rating) > 0) || (reviewsCount && Number(reviewsCount) > 0)) && (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(Number(rating) || 0)
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-200 fill-slate-100"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Title */}
        <Link to={productUrl}>
          <h3 className="font-display font-extrabold text-[1.125rem] text-deep-navy leading-tight tracking-tight mb-2 group-hover:text-primary-green transition-colors duration-300">
            {name}
          </h3>
        </Link>

        {/* Brief Description */}
        <p className="text-[13px] font-medium text-deep-navy/55 leading-relaxed mb-5 line-clamp-2">
          {description}
        </p>

        {/* Price & Action Footer Row */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-0.5 h-4.5">
              {discount ? (
                <>
                  <span className="text-[11px] font-bold text-deep-navy/35 line-through">
                    ${actualPrice.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 tracking-wide uppercase">
                    {discount}
                  </span>
                </>
              ) : (
                <span className="text-[11px] font-bold text-deep-navy/30">Regular Price</span>
              )}
            </div>
            <span className="text-[1.35rem] font-black text-[#0f2d52] tracking-tight leading-none">
              ${sellingPrice.toFixed(2)}
            </span>
          </div>

          {/* Minimal Modern Add Button */}
          <button
            onClick={handleAddToCart}
            disabled={(!productHasVariants && !inStock) || userLacksVet}
            className={`flex items-center justify-center gap-1.5 pl-4 pr-5 py-3 rounded-2xl font-extrabold text-xs tracking-wider uppercase transition-all duration-300 ${
              userLacksVet
                ? "bg-primary-green/40 text-white cursor-not-allowed border-none shadow-none opacity-80"
                : productHasVariants
                ? "bg-deep-navy text-white shadow-[0_10px_20px_-5px_rgba(15,45,82,0.2)] hover:bg-deep-navy/90 hover:scale-[1.03] active:scale-97 cursor-pointer"
                : inStock
                ? "bg-primary-green text-white shadow-[0_10px_20px_-5px_rgba(15,45,82,0.2)] hover:bg-dark-green hover:shadow-[0_10px_20px_-5px_rgba(88,185,71,0.3)] hover:scale-[1.03] active:scale-97 cursor-pointer"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50"
            }`}
          >
            {productHasVariants ? (
              <Eye className="w-4 h-4 stroke-[2.5]" />
            ) : !userLacksVet ? (
              <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
            ) : null}
            <span>
              {userLacksVet
                ? "Apply for Verification"
                : productHasVariants
                ? "View Variant"
                : !inStock
                ? "Out of Stock"
                : added
                ? "Added!"
                : "Add To Cart"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
