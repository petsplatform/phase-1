import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, ShoppingCart, Eye, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  isVetOnly,
  lacksVetAccess,
  getProductUrl,
  isFamilyProduct,
  hasVariants,
} from "../../utils/productUtils";

// ─── Badge colour map ─────────────────────────────────────────────────────────
function badgeStyle(badge) {
  if (!badge) return "";
  if (badge === "Best Seller") return "bg-brand-golden text-white";
  if (badge === "New") return "bg-brand-teal text-white";
  if (badge === "Popular") return "bg-brand-deep-teal text-white";
  return "bg-brand-coral text-white"; // Save X%
}

// ─── Star Rating Row ──────────────────────────────────────────────────────────
function RatingRow({ rating, reviewCount }) {
  const numRating = Number(rating) || 0;
  const numReviews = Number(reviewCount) || 0;
  const displayRating = numRating > 0 ? numRating : numReviews > 0 ? 4 : 0;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={
            i < Math.round(displayRating)
              ? "fill-brand-golden text-brand-golden"
              : "text-brand-border"
          }
        />
      ))}
      <span className="font-sans text-[10px] text-brand-muted ml-0.5">
        ({numReviews})
      </span>
    </div>
  );
}

// ─── Product Card (Grid Mode) ─────────────────────────────────────────────────
function GridCard({ product, wishlisted, onToggleWishlist, onAddToCart }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, user);
  const productUrl = getProductUrl(product);
  const productHasVariants = hasVariants(product) && isFamilyProduct(product);
  const [added, setAdded] = useState(false);

  const handleAction = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (userLacksVet) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }
    if (productHasVariants) {
      navigate(productUrl);
      return;
    }
    if (!product.inStock) {
      return;
    }
    if (onAddToCart) {
      onAddToCart(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } else {
      navigate(productUrl);
    }
  };

  const savings = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : null;

  return (
    <article className="group relative bg-brand-surface rounded-2xl border border-brand-border/50 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Image Area Container */}
      <div className="relative overflow-hidden aspect-square bg-brand-bg block">
        <Link to={productUrl} className="w-full h-full block">
          <img
            src={product.image}
            alt={product.alt}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
            style={{ "--tw-scale-x": "1", "--tw-scale-y": "1" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          />

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {requiresVet && (
              <span className="bg-brand-teal text-white text-[10px] font-heading font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                <ShieldCheck size={11} className="text-amber-300" />
                Vet Required
              </span>
            )}
            {product.badge && (
              <span
                className={`${badgeStyle(product.badge)} text-[10px] font-heading font-black px-2.5 py-1 rounded-full shadow-sm self-start`}
              >
                {product.badge}
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-brand-text/30 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-brand-text text-white text-xs font-heading font-black px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </Link>

        {/* Hover action buttons (placed outside the Link but inside the relative container) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 z-10">
          {/* Wishlist commented out on product card as requested */}
          {/*
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 ${
              wishlisted
                ? "bg-brand-coral text-white"
                : "bg-white/90 text-brand-muted hover:text-brand-coral"
            }`}
          >
            <Heart size={14} fill={wishlisted ? "currentColor" : "none"} />
          </button>
          */}
          {/* Quick view Link */}
          <Link
            to={productUrl}
            aria-label="View Details"
            className="w-8 h-8 rounded-full bg-white/90 text-brand-muted hover:text-brand-teal flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
          >
            <Eye size={14} />
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Category */}
        <span className="font-heading font-bold text-[10px] text-brand-teal tracking-wide uppercase">
          {product.category}
        </span>

        {/* Name */}
        <h3 className="font-heading font-black text-sm text-brand-text leading-snug line-clamp-2 hover:text-brand-coral transition-colors">
          <Link to={productUrl}>{product.name}</Link>
        </h3>

        {/* Rating Row */}
        <RatingRow
          rating={product.rating || 0}
          reviewCount={product.reviewCount || 0}
        />

        {/* Description */}
        <p className="font-sans text-[13px] text-brand-muted leading-relaxed line-clamp-2">
          {product.shortDescription}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="font-heading font-black text-base text-brand-coral">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <>
              <span className="font-sans text-xs text-brand-muted line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
              <span className="font-heading font-bold text-[10px] text-brand-teal bg-brand-teal/10 px-1.5 py-0.5 rounded-full">
                -{savings}%
              </span>
            </>
          )}
        </div>

        {/* Action Button: View Variant or Add to Cart */}
        <button
          type="button"
          onClick={handleAction}
          disabled={(!productHasVariants && !product.inStock) || userLacksVet}
          className={`w-full flex items-center justify-center gap-1.5 h-8 mt-1 rounded-lg text-xs font-heading font-black transition-all duration-200 ${
            userLacksVet
              ? "bg-brand-teal/40 text-white cursor-not-allowed border-none shadow-none opacity-90"
              : !productHasVariants && !product.inStock
                ? "bg-brand-border text-brand-muted cursor-not-allowed"
                : "bg-brand-coral text-white hover:bg-brand-coral-dark active:scale-95 cursor-pointer shadow-xs"
          }`}
        >
          {userLacksVet ? null : productHasVariants ? (
            <Eye size={12} />
          ) : (
            <ShoppingCart size={12} />
          )}
          {userLacksVet
            ? "Apply for Verification"
            : !productHasVariants && !product.inStock
              ? "Out of Stock"
              : productHasVariants
                ? "View Variant"
                : added
                  ? "Added!"
                  : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

// ─── Product Card (List Mode) ─────────────────────────────────────────────────
function ListCard({ product, wishlisted, onToggleWishlist, onAddToCart }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, user);
  const productUrl = getProductUrl(product);
  const productHasVariants = hasVariants(product) && isFamilyProduct(product);
  const [added, setAdded] = useState(false);

  const handleAction = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (userLacksVet) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }
    if (productHasVariants) {
      navigate(productUrl);
      return;
    }
    if (!product.inStock) {
      return;
    }
    if (onAddToCart) {
      onAddToCart(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } else {
      navigate(productUrl);
    }
  };

  const savings = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : null;

  return (
    <article className="group flex bg-brand-surface rounded-2xl border border-brand-border/50 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      {/* Image */}
      <Link
        to={productUrl}
        className="relative w-28 sm:w-40 md:w-48 shrink-0 overflow-hidden bg-brand-bg block"
      >
        <img
          src={product.image}
          alt={product.alt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        />
        {product.badge && (
          <span
            className={`absolute top-2 left-2 ${badgeStyle(product.badge)} text-[9px] font-heading font-black px-2 py-0.5 rounded-full`}
          >
            {product.badge}
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-brand-text/25 flex items-center justify-center">
            <span className="bg-brand-text text-white text-[10px] font-heading font-black px-2 py-0.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5 gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <span className="font-heading font-bold text-[10px] text-brand-teal tracking-wide uppercase">
              {product.category}
            </span>
            <h3 className="font-heading font-black text-sm sm:text-base text-brand-text leading-snug mt-0.5 hover:text-brand-coral transition-colors">
              <Link to={productUrl}>{product.name}</Link>
            </h3>
          </div>
          {/* Wishlist commented out on list card as requested */}
          {/*
          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            className={`p-1.5 rounded-full transition-all shrink-0 hover:scale-110 ${
              wishlisted
                ? "text-brand-coral"
                : "text-brand-muted hover:text-brand-coral"
            }`}
          >
            <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
          </button>
          */}
        </div>

        <p className="font-sans text-xs text-brand-muted leading-relaxed line-clamp-2">
          {product.shortDescription}
        </p>
        <RatingRow rating={product.rating} reviewCount={product.reviewCount} />

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 mt-auto pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-base text-brand-coral">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <>
                <span className="font-sans text-xs text-brand-muted line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
                <span className="font-heading font-bold text-[10px] text-brand-teal bg-brand-teal/10 px-1.5 py-0.5 rounded-full">
                  -{savings}%
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={handleAction}
              disabled={
                (!productHasVariants && !product.inStock) || userLacksVet
              }
              className={`flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-heading font-black transition-all duration-200 whitespace-nowrap ${
                userLacksVet
                  ? "bg-brand-teal/40 text-white cursor-not-allowed border-none shadow-none opacity-90"
                  : !productHasVariants && !product.inStock
                    ? "bg-brand-border text-brand-muted cursor-not-allowed"
                    : "bg-brand-coral text-white hover:bg-brand-coral-dark active:scale-95 cursor-pointer shadow-xs"
              }`}
            >
              {userLacksVet ? null : productHasVariants ? (
                <Eye size={12} />
              ) : (
                <ShoppingCart size={12} />
              )}
              {userLacksVet
                ? "Apply for Verification"
                : !productHasVariants && !product.inStock
                  ? "Out of Stock"
                  : productHasVariants
                    ? "View Variant"
                    : added
                      ? "Added!"
                      : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function ProductCard({
  product,
  wishlisted,
  onToggleWishlist,
  onAddToCart,
  viewMode = "grid",
}) {
  const props = { product, wishlisted, onToggleWishlist, onAddToCart };
  return viewMode === "list" ? (
    <ListCard {...props} />
  ) : (
    <GridCard {...props} />
  );
}
