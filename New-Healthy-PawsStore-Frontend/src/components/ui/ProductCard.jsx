import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { cartApi } from "../../api/cartApi";
import { useToast } from "../../context/ToastContext";
import {
  addStoredWishlistItem,
  getWishlistItemId,
  isWishlistItemSaved,
  removeStoredWishlistItem,
  toggleWishlistItem,
  WISHLIST_UPDATED_EVENT,
} from "../../services/wishlistService";
import {
  buildVariantCartItem,
  getFirstAvailableVariant,
  getProductDisplayPricing,
} from "../../utils/productVariants";
import { getProductUrl, hasVariants } from "../../utils/productUtils";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isWishlisted, setIsWishlisted] = useState(() =>
    isWishlistItemSaved(product),
  );
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const displayPricing = getProductDisplayPricing(product);
  const firstAvailableVariant = getFirstAvailableVariant(product);
  const isVariantProduct = hasVariants(product);
  const stock = Math.max(
    0,
    Number(firstAvailableVariant?.stock ?? product.stock ?? 0),
  );
  const canAddToCart = Boolean(firstAvailableVariant?.isAvailable) && stock > 0;

  useEffect(() => {
    const syncWishlistState = () =>
      setIsWishlisted(isWishlistItemSaved(product));

    syncWishlistState();
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState);
    window.addEventListener("storage", syncWishlistState);

    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState);
      window.removeEventListener("storage", syncWishlistState);
    };
  }, [product]);

  const handleWishlistClick = async () => {
    if (wishlistBusy || !getWishlistItemId(product)) return;

    const previousState = isWishlisted;
    setWishlistBusy(true);
    setIsWishlisted(!previousState);

    try {
      const result = await toggleWishlistItem(product);
      setIsWishlisted(result.saved);
      showToast(
        result.saved
          ? `${product.title} added to wishlist.`
          : `${product.title} removed from wishlist.`,
        "success",
      );
    } catch (error) {
      if (previousState) {
        addStoredWishlistItem(product);
      } else {
        removeStoredWishlistItem(product);
      }
      setIsWishlisted(previousState);
      showToast(error.message || "Wishlist update failed.", "error");
    } finally {
      setWishlistBusy(false);
    }
  };

  const productUrl = getProductUrl(product);

  const handleAddToCart = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (isVariantProduct) {
      navigate(productUrl);
      return;
    }

    if (!canAddToCart) {
      showToast(`${product.title || "Product"} is out of stock.`, "error");
      return;
    }

    try {
      setCartBusy(true);
      const cartItem = buildVariantCartItem(product, firstAvailableVariant, 1);
      await cartApi.addItem(cartItem);
      showToast(`${product.title || "Product"}${firstAvailableVariant?.label ? ` — ${firstAvailableVariant.label}` : ""} added to cart.`, "success");
    } catch (error) {
      showToast(error.message || "Could not add product to cart.", "error");
    } finally {
      setCartBusy(false);
    }
  };

  return (
    <Link to={productUrl} className="block h-full">
      <motion.article
        whileHover={{ y: -7 }}
        className="group relative min-h-[265px] overflow-hidden rounded-xl border border-borderSoft bg-white shadow-card sm:min-h-[345px]"
      >
        <span className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-secondaryDark text-[10px] font-extrabold text-white sm:left-3 sm:top-3 sm:size-10 sm:text-xs">
          {product.discount}
        </span>
        <div className="m-2 flex h-32 items-center justify-center overflow-hidden rounded-lg bg-sageLight/50 sm:h-44">
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        {product.rating && Number(product.rating) > 0 ? (
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-500">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{product.rating}</span>
            {product.reviews > 0 ? <span className="text-[10px] font-semibold text-muted">({product.reviews})</span> : null}
          </div>
        ) : null}
        <h3 className="mt-1.5 min-h-[46px] text-[12px] font-extrabold leading-tight text-textMain sm:min-h-[40px] sm:text-sm">
          {product.title}
        </h3>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="block text-[15px] font-extrabold leading-none text-primary sm:inline sm:text-lg">
              ${displayPricing.price.toFixed(2)}
            </span>
            {displayPricing.oldPrice > displayPricing.price && (
              <span className="mt-1 block text-[11px] font-bold text-muted line-through sm:ml-2 sm:inline sm:text-xs">
                ${displayPricing.oldPrice.toFixed(2)}
              </span>
            )}
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleAddToCart}
            disabled={cartBusy || (!isVariantProduct && !canAddToCart)}
            className={`grid size-9 shrink-0 place-items-center rounded-md text-white disabled:cursor-not-allowed disabled:opacity-55 sm:size-10 cursor-pointer ${
              isVariantProduct ? "bg-secondary hover:bg-secondaryDark" : "bg-secondaryDark hover:bg-primaryDark"
            }`}
            aria-label={
              isVariantProduct
                ? `View variants of ${product.title}`
                : canAddToCart
                ? `Add ${product.title} to cart`
                : `${product.title} is out of stock`
            }
            title={isVariantProduct ? "View Variant" : canAddToCart ? "Add to Cart" : "Out of Stock"}
          >
            {isVariantProduct ? <Eye size={17} /> : <ShoppingCart size={17} />}
          </motion.button>
        </div>
      </div>
    </motion.article>
  </Link>
);
}
