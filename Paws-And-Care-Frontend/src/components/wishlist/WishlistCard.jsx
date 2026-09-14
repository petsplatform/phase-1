import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Trash2,
  Star,
  ShoppingCart,
  Eye,
  Check,
} from "lucide-react";
import { getProductUrl, hasVariants } from "../../utils/productUtils";

export default function WishlistCard({ product, onRemove, onAddToCart }) {
  const navigate = useNavigate();
  const productUrl = getProductUrl(product);
  const productHasVariants = hasVariants(product);
  const [added, setAdded] = useState(false);

  const handleAction = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (productHasVariants) {
      navigate(productUrl);
      return;
    }
    if (!product.inStock) return;
    if (onAddToCart) {
      onAddToCart(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } else {
      navigate(productUrl);
    }
  };

  const priceNum = Number(product.price || 0);
  const origPriceNum = Number(product.originalPrice || 0);
  const savings = origPriceNum > priceNum
    ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100)
    : null;

  return (
    <article className="group relative bg-brand-surface rounded-[2rem] border border-brand-border/60 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between text-left p-4 min-h-[430px]">
      <div>
        {/* Visual Area */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-bg border border-brand-border/30 mb-4">
          <Link to={productUrl} className="block w-full h-full">
            <img
              src={product.image}
              alt={product.alt || product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              draggable={false}
            />
          </Link>

          {/* Badges */}
          {product.badge && (
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
              <span className="bg-brand-coral text-white font-heading font-black text-[9px] px-2.5 py-1 rounded-full shadow-xs tracking-wide uppercase">
                {product.badge}
              </span>
            </div>
          )}

          {/* Remove Button overlay */}
          <button
            type="button"
            onClick={() => onRemove(product.id)}
            className="absolute top-3 right-3 h-8.5 w-8.5 rounded-full bg-white/95 border border-brand-border/40 shadow-sm flex items-center justify-center text-brand-muted hover:text-brand-coral hover:bg-brand-bg transition-all active:scale-90"
            aria-label="Remove item from Wishlist"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Content/Text details */}
        <div className="space-y-1.5 px-1">
          <span className="font-heading font-bold text-[10px] text-brand-teal uppercase tracking-wide">
            {product.category}
          </span>
          <h3 className="font-heading font-black text-sm text-brand-text leading-snug group-hover:text-brand-coral transition-colors line-clamp-1">
            <Link to={productUrl}>{product.name}</Link>
          </h3>

          {/* Rating Row */}
          <div className="flex items-center gap-1 py-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={
                  i < Math.round(product.rating || 4.8)
                    ? "fill-brand-golden text-brand-golden"
                    : "text-brand-border"
                }
              />
            ))}
            <span className="font-sans text-[10px] text-brand-muted ml-0.5">
              ({product.reviewCount || 120})
            </span>
          </div>
          <p className="font-sans text-xs text-brand-muted line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
          {/* Pricing */}
          <div className="flex items-baseline gap-2 pt-2">
            <span className="font-heading font-black text-lg text-brand-coral">
              ${priceNum.toFixed(2)}
            </span>
            {origPriceNum > priceNum && (
              <>
                <span className="font-sans text-xs text-brand-muted line-through">
                  ${origPriceNum.toFixed(2)}
                </span>
                <span className="font-heading font-black text-[9px] text-brand-teal bg-brand-teal/10 px-1.5 py-0.5 rounded-full">
                  -{savings}%
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Container */}
      <div className="mt-4 pt-3 border-t border-brand-border/40 space-y-2">
        {/* Main Action: View Variant or Add to Cart */}
        {productHasVariants ? (
          <Link
            to={productUrl}
            className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-heading font-black bg-brand-coral text-white hover:bg-brand-coral-dark active:scale-95 transition-all duration-200 shadow-xs cursor-pointer"
          >
            <Eye size={12} />
            View Variant
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAction}
            disabled={!product.inStock}
            className={`w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-heading font-black transition-all duration-200 ${
              product.inStock
                ? added
                  ? "bg-brand-teal text-white"
                  : "bg-brand-coral text-white hover:bg-brand-coral-dark active:scale-95 cursor-pointer shadow-xs"
                : "bg-brand-border text-brand-muted cursor-not-allowed"
            }`}
          >
            {added ? <Check size={12} /> : <ShoppingCart size={11} />}
            {added ? "Added!" : "Add to Cart"}
          </button>
        )}

        {/* View Details full width button */}
        <Link
          to={productUrl}
          className="w-full inline-flex items-center justify-center gap-1.5 h-8 border border-brand-teal text-brand-teal hover:bg-brand-teal/5 rounded-lg text-xs font-heading font-bold transition-all"
        >
          <Eye size={12} />
          <span>View Details</span>
        </Link>
      </div>
    </article>
  );
}
