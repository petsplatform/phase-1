import { memo, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Star, ShieldCheck, Eye } from "lucide-react";
import { cartApi } from "../../api/cartApi";
import { useToast } from "../../context/ToastContext";
import { getStoredAuthUser } from "../../services/authService";
import { isVetOnly, lacksVetAccess, getProductUrl, hasVariants } from "../../utils/productUtils";
import {
  getWishlistItemId,
  isWishlistItemSaved,
  addStoredWishlistItem,
  removeStoredWishlistItem,
  toggleWishlistItem,
  WISHLIST_UPDATED_EVENT,
} from "../../services/wishlistService";
import {
  buildVariantCartItem,
  getFirstAvailableVariant,
  getProductDisplayPricing,
  getProductVariants,
  getTotalVariantStock,
} from "../../utils/productVariants";

function ProductCard({ product, index, view = "grid" }) {
  const navigate = useNavigate();
  const isList = view === "list";
  const { showToast } = useToast();
  const [isWishlisted, setIsWishlisted] = useState(() => isWishlistItemSaved(product));
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const displayPricing = getProductDisplayPricing(product);
  const variants = getProductVariants(product);
  const firstAvailableVariant = getFirstAvailableVariant(product);
  const stock = getTotalVariantStock(product);
  const isVariantProduct = hasVariants(product);
  const canAddToCart = Boolean(firstAvailableVariant?.isAvailable) && stock > 0;
  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, getStoredAuthUser());

  const visibleSizes = variants
    .slice(0, 3)
    .map((variant) => variant.label)
    .join(", ");
  const discountLabel =
    displayPricing.oldPrice > displayPricing.price
      ? `${Math.round(((displayPricing.oldPrice - displayPricing.price) / displayPricing.oldPrice) * 100)}% OFF`
      : product.discount || "-0%";
  const categoryLabel = String(product.category || "Pet Care").toUpperCase();

  useEffect(() => {
    const syncWishlistState = () => setIsWishlisted(isWishlistItemSaved(product));

    syncWishlistState();
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState);
    window.addEventListener("storage", syncWishlistState);

    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState);
      window.removeEventListener("storage", syncWishlistState);
    };
  }, [product]);

  const handleWishlistClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
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
    event.preventDefault();
    event.stopPropagation();

    if (userLacksVet) {
      navigate(getStoredAuthUser() ? "/account/vet-verification" : "/login");
      return;
    }

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
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.035 }}
        whileHover={{ y: -5 }}
        className={`group relative flex h-full min-w-0 overflow-hidden rounded-[16px] border border-primary/10 bg-white shadow-[0_10px_28px_rgba(20,61,60,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary/45 hover:shadow-[0_18px_42px_rgba(20,61,60,0.13)] sm:rounded-[18px] ${
          isList ? "min-h-[210px] flex-col gap-4 sm:flex-row sm:items-center" : "min-h-[366px] flex-col sm:min-h-[376px]"
        }`}
      >
        {/* Wishlist Button - Commented out as requested */}
        {/*
        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={handleWishlistClick}
          disabled={wishlistBusy}
          className={`absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white text-primary shadow-[0_8px_22px_rgba(20,61,60,0.15)] transition hover:scale-105 sm:right-4 sm:top-4 ${
            isWishlisted ? "text-red" : "text-secondary"
          } disabled:cursor-wait disabled:opacity-70`}
        >
          <Heart
            size={18}
            className={`sm:size-5 ${isWishlisted ? "fill-red" : ""}`}
          />
        </button>
        */}

        <div className={`m-2 relative flex items-center justify-center overflow-hidden rounded-[14px] bg-sageLight/50 ${isList ? "h-[180px] shrink-0 sm:w-[250px]" : "aspect-[1.04/1] shrink-0 sm:aspect-auto sm:h-[172px]"}`}>
          <img src={product.image} alt={product.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {requiresVet && (
            <span className="absolute top-2 left-2 z-10 bg-primaryDark text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <ShieldCheck size={10} className="text-amber-300" />
              Vet Required
            </span>
          )}
        </div>

        <div className={isList ? "flex min-w-0 flex-1 flex-col px-4 pb-4 sm:py-5 sm:pl-0" : "flex min-w-0 flex-1 flex-col px-2.5 pb-2.5 sm:px-4 sm:pb-4"}>
          <div className="mt-0.5 flex items-center justify-between gap-1">
            <span className="min-w-0 truncate text-[8px] font-extrabold uppercase text-orange sm:text-[10px]">
              {categoryLabel}
            </span>
          </div>

          <h3 className={`${isList ? "min-h-0 text-[16px] sm:text-[18px]" : "line-clamp-2 min-h-[32px] text-[12px] sm:min-h-[40px] sm:text-[14px]"} mt-1.5 font-extrabold leading-snug text-primaryDark sm:mt-2.5`}>
            {product.title}
          </h3>

          <p className="hidden sm:block sm:mt-2 sm:line-clamp-2 sm:min-h-[40px] text-[13px] font-semibold leading-[18px] text-muted sm:text-[14px] sm:leading-[20px]">
            {product.description || "Premium nutrition selected for healthy, happy pets with trusted ingredients."}
          </p>

          <div className="mt-1.5 flex h-[24px] min-w-0 items-center gap-1 sm:mt-2.5 sm:h-[26px] sm:gap-2">
            <span className="min-w-0 truncate rounded-full bg-sageLight px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-primaryDark sm:px-2 sm:py-1 sm:text-[9px]">
              Size: {visibleSizes || firstAvailableVariant?.label || "Default"}
            </span>
            {product.rating && Number(product.rating) > 0 ? (
              <span className="ml-auto flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-amber-500 sm:gap-1 sm:text-[11px]">
                <Star size={12} className="fill-amber-400 text-amber-400 sm:size-[13px]" />
                {product.rating}
                {product.reviews > 0 ? <span className="text-muted text-[9px] sm:text-[10px]">({product.reviews})</span> : null}
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="text-[10px] font-extrabold text-primaryDark sm:text-[11px]">
                  From
                </span>
                <span className="text-[16px] font-black leading-tight text-primaryDark sm:text-[19px]">
                  ${displayPricing.price.toFixed(2)}
                </span>
                {displayPricing.oldPrice > displayPricing.price && (
                  <span className="text-[10px] font-bold text-muted line-through sm:text-[11px]">
                    ${displayPricing.oldPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {discountLabel && (
                <div className="mt-1 flex">
                  <span className="inline-flex rounded-full bg-softCream px-2 py-0.5 text-[8px] font-extrabold text-primaryDark sm:text-[9px]">
                    {discountLabel}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              id={`product-action-${product.id}`}
              aria-label={
                userLacksVet
                  ? "Apply for Verification"
                  : isVariantProduct
                  ? `View variants of ${product.title}`
                  : canAddToCart
                  ? `Add ${product.title} to cart`
                  : `${product.title} is out of stock`
              }
              title={
                userLacksVet
                  ? "Apply for Verification"
                  : isVariantProduct
                  ? "View Variant"
                  : canAddToCart
                  ? "Add to Cart"
                  : "Out of Stock"
              }
              onClick={handleAddToCart}
              disabled={cartBusy || (!isVariantProduct && !canAddToCart) || userLacksVet}
              className={`flex items-center justify-center gap-1.5 rounded-[12px] px-3 py-2 text-[11px] sm:text-[12px] font-extrabold transition cursor-pointer shrink-0 ${
                userLacksVet
                  ? "bg-primaryDark/40 text-white cursor-not-allowed opacity-90 shadow-none"
                  : isVariantProduct
                  ? "bg-secondary text-white shadow-[0_6px_18px_rgba(120,147,59,0.25)] hover:-translate-y-0.5 hover:bg-secondaryDark"
                  : canAddToCart
                  ? "bg-primaryDark text-white shadow-[0_6px_18px_rgba(20,61,60,0.2)] hover:-translate-y-0.5 hover:bg-secondary"
                  : "bg-sageLight text-muted cursor-not-allowed opacity-60"
              }`}
            >
              {isVariantProduct ? (
                <Eye size={15} className="sm:size-[16px] shrink-0" />
              ) : (
                <ShoppingCart size={15} className="sm:size-[16px] shrink-0" />
              )}
              <span className="whitespace-nowrap">
                {userLacksVet
                  ? "Apply"
                  : isVariantProduct
                  ? "View Variant"
                  : !canAddToCart
                  ? "Out of Stock"
                  : cartBusy
                  ? "Adding..."
                  : "Add to Cart"}
              </span>
            </button>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

export default memo(ProductCard);
