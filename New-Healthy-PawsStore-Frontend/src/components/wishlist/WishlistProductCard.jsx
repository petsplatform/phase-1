import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, ShoppingCart, Star, Trash2, X } from "lucide-react";
import {
  getFirstAvailableVariant,
  getTotalVariantStock,
} from "../../utils/productVariants";
import { getProductUrl } from "../../utils/productUtils";

export default function WishlistProductCard({
  product,
  index,
  view,
  onRemove,
  onMoveToCart,
}) {
  const reduceMotion = useReducedMotion();
  const isList = view === "list";
  const firstAvailableVariant = getFirstAvailableVariant(product);
  const stock = getTotalVariantStock(product);
  const canMoveToCart = Boolean(firstAvailableVariant?.isAvailable) && stock > 0;

  const productUrl = getProductUrl(product);

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.28, delay: index * 0.035 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className={`group relative flex overflow-hidden rounded-[16px] border border-borderSoft bg-white shadow-[0_10px_28px_var(--color-shadow)] sm:rounded-[18px] ${
        isList
          ? "min-h-[190px] flex-col sm:flex-row sm:items-center"
          : "min-h-[310px] flex-col sm:min-h-[350px]"
      }`}
    >
      <Heart
        className="absolute left-3 top-3 z-10 size-4.5 fill-red text-red sm:left-5 sm:top-5 sm:size-5"
        aria-hidden="true"
      />
      <button
        type="button"
        aria-label={`Remove ${product.title} from wishlist`}
        onClick={() => onRemove(product.id)}
        className="absolute right-2.5 top-2.5 z-10 grid size-7 place-items-center rounded-full border border-borderSoft bg-white text-textMain transition hover:bg-sageLight sm:right-4 sm:top-4 sm:size-8"
      >
        <X size={15} className="sm:size-[17px]" />
      </button>

      <Link
        to={productUrl}
        className={`m-1.5 flex items-center justify-center overflow-hidden rounded-[14px] bg-sageLight/40 ${
          isList ? "h-[150px] shrink-0 sm:w-[220px]" : "aspect-[1.1/1] shrink-0 sm:aspect-auto sm:h-[188px]"
        }`}
      >
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col px-2.5 pb-2.5 sm:px-4 sm:pb-4">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          <span className="truncate rounded-[5px] bg-sageLight px-2 py-0.5 text-[9px] font-extrabold text-secondaryDark sm:px-3 sm:py-1 sm:text-[11px]">
            {product.category}
          </span>
          {canMoveToCart ? (
            product.rating && Number(product.rating) > 0 ? (
              <div className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-amber-500 sm:text-[12px]">
                <Star size={12} className="fill-amber-400 text-amber-400 sm:size-3.5" />
                <span>{product.rating}</span>
                {product.reviews > 0 ? <span className="text-[9px] font-semibold text-muted sm:text-[11px]">({product.reviews})</span> : null}
              </div>
            ) : null
          ) : (
            <span className="shrink-0 rounded-full bg-red/10 px-2 py-0.5 text-[9px] font-extrabold text-error sm:px-2.5 sm:text-[10px]">
              Out of Stock
            </span>
          )}
        </div>
        <Link
          to={productUrl}
          className="hover:text-secondaryDark transition-colors"
        >
          <h2 className="mt-1.5 line-clamp-2 min-h-[32px] text-[12px] font-extrabold leading-snug text-textMain sm:mt-3 sm:min-h-[48px] sm:text-[16px]">
            {product.title}
          </h2>
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-1 sm:gap-3 sm:pt-2">
          <span className="text-[15px] font-extrabold text-textMain sm:text-[18px]">
            ${product.price.toFixed(2)}
          </span>
          {product.oldPrice > product.price && (
            <span className="text-[11px] font-bold text-muted line-through sm:text-[13px]">
              ${product.oldPrice.toFixed(2)}
            </span>
          )}
        </div>

        <div className="mt-2.5 grid grid-cols-[1fr_36px] gap-1.5 sm:mt-4 sm:grid-cols-[1fr_44px] sm:gap-3">
          <button
            type="button"
            onClick={() => onMoveToCart(product.id)}
            disabled={!canMoveToCart}
            aria-label={
              canMoveToCart
                ? `Add ${product.title} to cart`
                : `${product.title} is out of stock`
            }
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-secondaryDark px-2.5 text-[11px] font-extrabold text-white transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-sageLight disabled:text-muted sm:h-10 sm:gap-2 sm:px-4 sm:text-[13px]"
          >
            <ShoppingCart size={15} className="sm:size-[16px]" />
            <span className="hidden sm:inline">
              {canMoveToCart ? "Add to Cart" : "Out of Stock"}
            </span>
            <span className="sm:hidden">
              {canMoveToCart ? "Add" : "Stock"}
            </span>
          </button>
          <button
            type="button"
            aria-label={`Delete ${product.title}`}
            onClick={() => onRemove(product.id)}
            className="grid h-9 place-items-center rounded-lg border border-borderSoft bg-white text-textMain transition hover:bg-sageLight sm:h-10"
          >
            <Trash2 size={15} className="sm:size-[17px]" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
