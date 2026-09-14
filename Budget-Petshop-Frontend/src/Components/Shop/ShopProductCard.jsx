import { ShoppingCart, Heart, Eye, Star, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProductCategory } from "../../utils/shopFilters";
import { reviewApi } from "../../api/reviewApi";
import { useAuth } from "../../utils/AuthContext";
import {
  isVetOnly,
  lacksVetAccess,
  getProductUrl,
  hasVariants,
  isFamilyProduct,
} from "../../utils/productUtils";

// Tag color map for variety
const TAG_COLORS = {
  Bestseller: { bg: "#8a72c7", text: "#fff" },
  Popular: { bg: "#176b59", text: "#fff" },
  "Top Rated": { bg: "#e58b5d", text: "#fff" },
  "New Arrival": { bg: "#60b496", text: "#fff" },
  "Limited Offer": { bg: "#e8546a", text: "#fff" },
  "Best Choice": { bg: "#176b59", text: "#fff" },
};

const CATEGORY_BADGE_COLORS = {
  food: { bg: "#fff5ec", text: "#c2612e" },
  grooming: { bg: "#f0ebff", text: "#6c48c4" },
  accessories: { bg: "#edfaf3", text: "#176b59" },
  beds: { bg: "#fdf3ec", text: "#b85c1e" },
  toys: { bg: "#fff8e6", text: "#9a6e10" },
  travel: { bg: "#eff7ff", text: "#1e5da8" },
};

function ShopProductCard({ product, onAddToCart, isWished, onToggleWishlist }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, user);
  const { tag, title, originalPrice, salePrice, image, description } = product;
  const [localWished, setLocalWished] = useState(false);
  const wished = isWished !== undefined ? isWished : localWished;
  const [added, setAdded] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    avgRating: null,
    totalReviews: 0,
  });

  useEffect(() => {
    if (!product?.id) return;
    let active = true;
    reviewApi
      .getProductReviews(product.id)
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        const total = list.length;
        const avg = total
          ? (
              list.reduce(
                (s, r) => s + Number(r.rating ?? r.star ?? r.stars ?? 0),
                0,
              ) / total
            ).toFixed(1)
          : null;
        setReviewStats({ avgRating: avg, totalReviews: total });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [product?.id]);
  const catId = getProductCategory(product);
  const catBadge =
    CATEGORY_BADGE_COLORS[catId] || CATEGORY_BADGE_COLORS.accessories;
  const tagColor = tag ? TAG_COLORS[tag] : null;
  const firstAvailableVariant =
    product.optionVariants?.find(
      (variant) =>
        variant.isAvailable !== false &&
        String(variant.status || "Active").toLowerCase() !== "inactive",
    ) ||
    product.sizes?.find(
      (variant) =>
        variant.isAvailable !== false &&
        String(variant.status || "Active").toLowerCase() !== "inactive",
    );
  const firstVariantLabel =
    firstAvailableVariant?.label ||
    firstAvailableVariant?.name ||
    firstAvailableVariant?.variantName;
  const isOutOfStock = product.stock === 0 && !firstAvailableVariant;

  const discount =
    originalPrice && salePrice
      ? Math.round(
          (1 -
            parseFloat(String(salePrice).replace(/[^0-9.]/g, "")) /
              parseFloat(String(originalPrice).replace(/[^0-9.]/g, ""))) *
            100,
        )
      : 0;

  const productUrl = getProductUrl(product);
  const productHasVariants = hasVariants(product) && isFamilyProduct(product);

  function handleAddToCart() {
    if (userLacksVet) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }
    if (isOutOfStock) return;
    if (productHasVariants) {
      navigate(productUrl);
      return;
    }
    if (onAddToCart) {
      const productToAdd = firstAvailableVariant
        ? {
            ...product,
            id: `${product.id}__${firstAvailableVariant.id || firstVariantLabel}`,
            productId: product.id,
            variantId: firstAvailableVariant.id,
            variantLabel: firstVariantLabel,
            selectedVariant: firstVariantLabel,
            selectedOption: firstVariantLabel,
            price:
              firstAvailableVariant.price ??
              firstAvailableVariant.pricing?.finalPrice ??
              product.price,
            stock:
              firstAvailableVariant.stock ??
              firstAvailableVariant.inventory?.stockQuantity ??
              product.stock,
          }
        : product;
      onAddToCart(productToAdd, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } else {
      navigate(productUrl);
    }
  }

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_64px_rgba(28,40,33,0.13)]"
      style={{
        border: "1.5px solid #e7ddd0",
        boxShadow: "0 4px 20px rgba(28,40,33,0.06)",
      }}
    >
      {/* Image area */}
      <div className="relative overflow-hidden h-[240px] sm:h-[280px]">
        <Link
          to={productUrl}
          aria-label={`View variants and details for ${title}`}
          className="absolute inset-0 block"
        >
          <img
            src={image}
            alt={title}
            loading="lazy"
            className={`product-card-img h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.07] group-hover:blur-[2px] ${
              isOutOfStock ? "opacity-60 grayscale-[30%]" : ""
            }`}
          />

          {/* Overlay on hover */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 backdrop-blur-[1.5px]"
            style={{ background: "rgba(23,107,89,0.08)" }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-white transition group-hover:scale-110 shadow-md">
              <Eye size={18} />
            </span>
          </div>
        </Link>

        {/* Badges (Top-Left) */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
          {requiresVet && (
            <span className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest shadow-sm bg-[#8a72c7] text-white flex items-center gap-1">
              <ShieldCheck size={12} className="text-amber-300" />
              Vet Required
            </span>
          )}
          {tag && tagColor && (
            <span
              className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest shadow-sm text-center"
              style={{ background: tagColor.bg, color: tagColor.text }}
            >
              {tag}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link
          to={productUrl}
          className="text-base sm:text-lg leading-snug text-[#1A1A1A] hover:text-secondary transition-colors font-extrabold line-clamp-2 min-h-[44px] sm:min-h-[50px]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </Link>

        {/* Rating Stars Row — only shown when real added reviews exist */}
        {reviewStats.avgRating && reviewStats.totalReviews > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={13}
                  className={
                    star <= Math.round(parseFloat(reviewStats.avgRating))
                      ? "fill-amber-400 text-amber-500"
                      : "fill-none text-neutral-300"
                  }
                />
              ))}
            </div>
            <span className="text-xs font-bold text-on-background">
              {reviewStats.avgRating}
            </span>
            <span className="text-[11px] text-charcoal-text font-medium">
              ({reviewStats.totalReviews})
            </span>
          </div>
        )}

        <p
          className="mt-2 line-clamp-2 min-h-[42px] sm:min-h-[48px] text-[14px] sm:text-[16px] leading-relaxed text-[#5F5F5F]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {typeof description === "string"
            ? description
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, " ")
                .replace(/<[^>]*>?/gm, "")
                .replace(/\s+/g, " ")
                .trim()
            : description}
        </p>

        {/* Price + CTA Footer */}
        <div className="mt-auto pt-3 border-t border-outline/50 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-baseline gap-1.5 shrink-0">
            <span className="text-lg sm:text-[22px] text-secondary font-extrabold">
              {salePrice}
            </span>
            {originalPrice && (
              <span className="text-xs sm:text-sm text-[#9A9A9A] font-semibold line-through">
                {originalPrice}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
            <button
              type="button"
              id={`action-btn-${product.id}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock || userLacksVet}
              className={`flex items-center gap-1.5 rounded-2xl px-3.5 sm:px-4 py-2 text-xs sm:text-[13px] font-bold text-white transition-all duration-200 whitespace-nowrap shrink-0 ${
                userLacksVet
                  ? "bg-[#17345f]/40 text-white cursor-not-allowed shadow-none opacity-80"
                  : isOutOfStock
                    ? "bg-gray-300 text-gray-500 border border-gray-400 cursor-not-allowed opacity-80"
                    : "bg-secondary active:scale-95 cursor-pointer shadow-xs hover:bg-secondary/95"
              }`}
            >
              {productHasVariants ? (
                <Eye size={14} className="shrink-0" />
              ) : (
                <ShoppingCart size={14} className="shrink-0" />
              )}
              <span>
                {userLacksVet
                  ? "Apply for Verification"
                  : isOutOfStock
                    ? "Out of Stock"
                    : productHasVariants
                      ? "View Variant"
                      : added
                        ? "Added!"
                        : "Add to Cart"}
              </span>
            </button>

            {/* Wishlist Button - Commented out as requested */}
            {/*
            <button
              type="button"
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              onClick={
                onToggleWishlist
                  ? () => onToggleWishlist(product)
                  : () => setLocalWished(!localWished)
              }
              className="flex h-9 w-9 sm:h-[38px] sm:w-[38px] shrink-0 items-center justify-center rounded-2xl bg-[#fbf7f0] border border-[#e7ddd0] hover:bg-[#8a72c7]/10 hover:border-[#8a72c7]/30 transition hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            >
              <Heart
                size={16}
                fill={wished ? "#e8546a" : "none"}
                stroke={wished ? "#e8546a" : "#6d776f"}
              />
            </button>
            */}
          </div>
        </div>
      </div>
    </article>
  );
}

export default ShopProductCard;
