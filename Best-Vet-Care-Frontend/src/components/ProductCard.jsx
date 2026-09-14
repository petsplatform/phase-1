import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartIcon, HeartIcon, StarIcon } from "./common/HeaderIcons";
import { reviewApi } from "../api/reviewApi";
import {
  createWishlistSlug,
  isWishlistItemSaved,
  removeWishlistProduct,
  toggleWishlistItem,
  WISHLIST_UPDATED_EVENT,
} from "../utils/wishlist";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getFamilyVariants, getSelectedVariantPrice, hasPurchasableVariants } from "../utils/catalog";

const getDefaultVariant = (product) => {
  const variants = product.optionVariants?.length ? product.optionVariants : product.sizes || [];
  if (!hasPurchasableVariants(product) && variants.length === 0) return null;
  return (
    variants.find((variant) => variant.isAvailable) ||
    variants.find((variant) => {
      const status = String(variant.status || "Active").toLowerCase();
      const stock = Number(variant.inventory?.stockQuantity ?? variant.stock ?? 0);
      return status === "active" && stock > 0;
    }) ||
    variants.find((variant) => String(variant.status || "Active").toLowerCase() !== "inactive") ||
    null
  );
};

const getVariantLabel = (variant) =>
  variant?.label ||
  variant?.name ||
  variant?.variantName ||
  variant?.size ||
  variant?.weightRange ||
  variant?.packLabel ||
  "";

const optionalId = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
};

const cardPriceLabel = (product) =>
  String(product.displayPriceLabel || `$${product.price}`).replace(/^From\s+/i, "");

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, isProductInCart } = useCart();
  const { customer } = useAuth();
  const { showToast } = useToast();
  const productSlug = product.slug || createWishlistSlug(product.name);
  const savedFamilyVariants = getFamilyVariants(product);
  const isFamilyProduct = product.productType === "FAMILY" || savedFamilyVariants.length > 0;
  const detailPath = `${isFamilyProduct ? "/products" : "/product"}/${productSlug}`;
  const badgeText = product.badge || product.discount;
  const isOutOfStock = product.inventory?.isInStock === false || Number(product.stock) <= 0;
  const requiresVariantSelection = hasPurchasableVariants(product) || product.sizes?.length > 0;
  const defaultVariant = getDefaultVariant(product);
  const canAddFromCard = !isFamilyProduct && (!requiresVariantSelection || Boolean(defaultVariant));
  const requiresVet = Boolean(product.vetOnly);
  const lacksVetAccess = requiresVet && !customer?.isVetVerified;
  const [isWishlisted, setIsWishlisted] = useState(() => isWishlistItemSaved(product));
  const isInCart = isProductInCart(product);
  const [isAdding, setIsAdding] = useState(false);
  const displayImage =
    product.image ||
    product.optionVariants?.[0]?.image ||
    product.optionVariants?.[0]?.mainImage ||
    "";
  const [reviews, setReviews] = useState(() => (Array.isArray(product.reviews) ? product.reviews : []));

  useEffect(() => {
    if (product.rating || product.avgRating) return;
    const pId = product.id || product._id || product.slug;
    if (pId) {
      reviewApi
        .getProductReviews(pId)
        .then((data) => {
          if (Array.isArray(data)) setReviews(data);
        })
        .catch(() => {});
    }
  }, [product.id, product._id, product.slug, product.rating, product.avgRating]);

  const reviewsCount = Number(
    product.reviewsCount ||
      product.ratingCount ||
      (Array.isArray(product.reviews) ? product.reviews.length : (typeof product.reviews === "number" ? product.reviews : 0)) ||
      reviews.length
  );

  const ratingValue = Number(
    product.rating ||
      product.avgRating ||
      (reviews.length > 0
        ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
        : 0)
  );

  const hasRating = (ratingValue > 0 || reviewsCount > 0) && reviewsCount > 0;

  useEffect(() => {
    const syncWishlistState = () => {
      if (isProductInCart(product)) {
        removeWishlistProduct(product);
        setIsWishlisted(false);
        return;
      }
      setIsWishlisted(isWishlistItemSaved(product));
    };
    syncWishlistState();
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState);
    window.addEventListener("storage", syncWishlistState);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState);
      window.removeEventListener("storage", syncWishlistState);
    };
  }, [product, isProductInCart]);

  const openProductDetails = () => {
    navigate(detailPath, { state: { product } });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProductDetails();
    }
  };

  const stopCardNavigation = (event) => {
    event.stopPropagation();
  };

  const handleWishlistClick = (event) => {
    stopCardNavigation(event);
    updateWishlist();
  };

  const updateWishlist = () => {
    if (isProductInCart(product)) {
      removeWishlistProduct(product);
      setIsWishlisted(false);
      showToast(`${product.name} is already in your cart`, "warning");
      return;
    }
    const result = toggleWishlistItem(product);
    setIsWishlisted(Boolean(result.added));
    showToast(
      result.added
        ? `${product.name} added to wishlist`
        : `${product.name} removed from wishlist`,
    );
  };

  const handleAddToCart = (event) => {
    stopCardNavigation(event);
    if (isAdding) return;
    if (isFamilyProduct) {
      navigate(detailPath, { state: { product } });
      return;
    }
    if (isOutOfStock || (requiresVariantSelection && !defaultVariant)) {
      showToast(`${product.name} is out of stock`, "error");
      return;
    }
    if (lacksVetAccess) {
      showToast("This product is available only for verified veterinarians.", "error");
      navigate("/account/vet-verification");
      return;
    }
    setIsAdding(true);
    const variantPricing = defaultVariant
      ? getSelectedVariantPrice(product, defaultVariant.id)
      : null;
    const selectedSize = defaultVariant
      ? {
          ...defaultVariant,
          price: Number(variantPricing?.price ?? defaultVariant.price ?? product.price),
          oldPrice: variantPricing?.oldPrice ?? defaultVariant.regularPrice ?? null,
          pricing: variantPricing?.pricing || defaultVariant.pricing,
          inventory: defaultVariant.inventory,
        }
      : product.capacities?.[0]
        ? { label: product.capacities[0], price: product.price }
        : null;
    const nextProduct = {
      ...product,
      price: Number(variantPricing?.price ?? selectedSize?.price ?? product.price),
      oldPrice: variantPricing?.oldPrice ?? product.oldPrice,
      stock: Number(defaultVariant?.inventory?.stockQuantity ?? defaultVariant?.stock ?? product.stock),
      inventory: defaultVariant?.inventory || product.inventory,
      pricing: variantPricing?.pricing || product.pricing,
      variantId: optionalId(defaultVariant?.id),
    };
    const result = addToCart({
      ...nextProduct,
      selectedSize,
      selectedColor: product.colorVariants?.[0] || null,
    });
    if (result?.outOfStock) {
      showToast(`${product.name} is out of stock`, "error");
    } else {
      const variantLabel = getVariantLabel(selectedSize);
      const addedMessage = variantLabel ? `${product.name} — ${variantLabel}` : product.name;
      showToast(
          result?.capped
            ? `Only ${result.limit} in stock - added the maximum available quantity of ${addedMessage}`
            : `${addedMessage} added to cart`,
        result?.capped ? "warning" : "success",
      );
    }
    window.setTimeout(() => setIsAdding(false), 350);
  };

  return (
    <article
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#17345f14] bg-white shadow-[0_10px_28px_rgba(18,42,80,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d9aa3d]/50 hover:shadow-[0_18px_42px_rgba(18,42,80,0.14)] focus-within:ring-2 focus-within:ring-[#d9aa3d]/40"
      onClick={openProductDetails}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`View details for ${product.name}`}
    >
      <div className="relative m-2 h-[188px] overflow-hidden rounded-xl bg-white sm:h-[208px]">
        {badgeText && (
          <span className="absolute left-3 top-3 rounded-full bg-[#17345f] px-2.5 py-1 text-[10px] font-extrabold uppercase leading-none text-white shadow-[0_8px_18px_rgba(18,42,80,0.18)]">
            {badgeText}
          </span>
        )}
        {requiresVet && (
          <span className="absolute left-3 top-10 rounded-full bg-[#d9aa3d] px-2.5 py-1 text-[10px] font-extrabold uppercase leading-none text-[#17345f] shadow-[0_8px_18px_rgba(18,42,80,0.18)]">
            Vet Required
          </span>
        )}
        <button
          type="button"
          className={`absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_8px_18px_rgba(18,42,80,0.16)] transition-all hover:scale-105 ${
            isInCart ? "cursor-not-allowed text-[#122a50]/45 hover:scale-100" : isWishlisted ? "text-[#EF4444]" : "text-[#122a50] hover:text-[#d9aa3d]"
          }`}
          onClick={handleWishlistClick}
          disabled={isInCart}
          title={isInCart ? "Already in cart" : undefined}
          aria-label={isInCart ? `${product.name} is already in cart` : `${isWishlisted ? "Saved in wishlist" : "Add"} ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
        >
          <HeartIcon className={`h-4 w-4 ${isWishlisted ? "fill-[#EF4444]" : ""}`} />
        </button>
        <img
          src={displayImage}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5">
        <div className="mb-2 flex items-center gap-2">
          <span className="truncate text-[11px] font-extrabold uppercase tracking-wide text-[#d9aa3d]">
            {typeof product.category === "object" && product.category
              ? product.category.name
              : product.category || product.brand || "Best-Vet-Care"}
          </span>
        </div>

        <h3 className="line-clamp-2 min-h-[42px] text-[15px] font-extrabold leading-5 text-[#122a50] transition-colors group-hover:text-[#17345f]">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-1 min-h-[20px] text-xs font-semibold leading-5 text-[#122a50a6]">
          {product.description}
        </p>

        {hasRating && (
          <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[#122a50b2]">
            <span className="flex items-center gap-0.5 text-[#d9aa3d]">
              {Array.from({ length: 5 }).map((_, index) => (
                <StarIcon
                  key={index}
                  className={`h-3 w-3 ${
                    index < Math.round(ratingValue || 5)
                      ? "fill-[#d9aa3d] text-[#d9aa3d]"
                      : "fill-[#17345f1a] text-[#17345f1a]"
                  }`}
                />
              ))}
            </span>
            {ratingValue > 0 && <span className="ml-1 text-[11px] font-extrabold text-[#122a50]">{ratingValue.toFixed(1)}</span>}
            {reviewsCount > 0 && <span className="text-[10px] text-[#122a50a6]">({reviewsCount})</span>}
          </div>
        )}

        {(isFamilyProduct || product.colorVariants?.length > 0 || product.capacities?.length > 0) && (
          <div className="mt-2 flex min-h-[22px] items-center gap-2">
            {isFamilyProduct && (
              <span className="truncate rounded-full bg-[#17345f0d] px-2 py-1 text-[10px] font-extrabold uppercase text-[#17345f]">
                {product.variantCount || product.familyVariants?.length || 0} variants available
              </span>
            )}
            {product.colorVariants?.length > 0 && (
              <div className="flex -space-x-1">
                {product.colorVariants.slice(0, 4).map((variant) => (
                  <span
                    key={variant.id || variant.label}
                    className="h-4 w-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: variant.color || "#ffffff" }}
                    title={variant.label}
                  />
                ))}
              </div>
            )}
            {product.capacities?.length > 0 && (
              <span className="truncate rounded-full bg-[#17345f0d] px-2 py-1 text-[10px] font-extrabold uppercase text-[#17345f]">
                {product.optionLabel || "Size"}: {product.capacities.slice(0, 2).join(", ")}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
              <span className="flex flex-col">
                <span className="text-[10px] font-extrabold uppercase leading-none text-[#122a50a6]">
                  Selling Price
                </span>
                <span className="mt-1 text-xl font-extrabold leading-none text-[#122a50]">
                  {cardPriceLabel(product)}
                </span>
              </span>
              {product.oldPrice && (
                <span className="flex flex-col">
                  <span className="text-[10px] font-extrabold uppercase leading-none text-[#122a5070]">
                    MRP
                  </span>
                  <span className="mt-1 text-[11px] font-semibold text-[#122a50b2] line-through">
                    ${product.oldPrice}
                  </span>
                </span>
              )}
            </div>
            {product.discount && (
              <span className="mt-1.5 inline-flex rounded-full bg-[#f8f1df] px-2 py-1 text-[10px] font-extrabold uppercase leading-none text-[#17345f]">
                {product.discount}
              </span>
            )}
          </div>
          <button
            type="button"
            className={`inline-flex h-9 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-extrabold text-white shadow-[0_10px_20px_rgba(18,42,80,0.24)] transition-all ${
              (!isFamilyProduct && (isOutOfStock || !canAddFromCard || lacksVetAccess)) || isAdding
                ? "cursor-not-allowed bg-[#17345f]/40 shadow-none"
                : "bg-[#17345f] hover:-translate-y-0.5 hover:bg-[#d9aa3d]"
            }`}
            onClick={handleAddToCart}
            disabled={(!isFamilyProduct && (isOutOfStock || !canAddFromCard || lacksVetAccess)) || isAdding}
            aria-label={isFamilyProduct ? `View options for ${product.name}` : canAddFromCard ? `Add ${product.name} to cart` : `Select a variant for ${product.name}`}
          >
            {!isFamilyProduct && <CartIcon className="h-4 w-4" />}
            <span>{isFamilyProduct ? "View Variants" : "Add to Cart"}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
