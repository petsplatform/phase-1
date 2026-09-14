import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Minus, PawPrint, Plus, ShoppingCart, Star, ShieldCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { cartApi } from "../../api/cartApi";
import { reviewApi } from "../../api/reviewApi";
import { useToast } from "../../context/ToastContext";
import { getStoredAuthUser } from "../../services/authService";
import { isVetOnly, lacksVetAccess, isFamilyProduct } from "../../utils/productUtils";
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
  getProductVariants,
} from "../../utils/productVariants";
import { isSlugLike } from "../../utils/htmlUtils";

const BUY_NOW_STORAGE_KEY = "healthy_paws_buy_now_checkout";

const splitSizeAndPackLabel = (label) => {
  const value = String(label || "").trim();
  const plusParts = value.split(/\s*\+\s*/).map((part) => part.trim()).filter(Boolean);
  const trailingPack = value.match(/^(.*?[A-Za-z])[\s-]*(\d+(?:\s*(?:tablets?|doses?|capsules?|packs?|count|ct))?)$/i);
  const parts = plusParts.length > 1
    ? plusParts
    : trailingPack
      ? [trailingPack[1].trim(), trailingPack[2].trim()]
      : [value];
  return { size: parts[0] || value, pack: parts.slice(1).join(" + ") };
};

export default function ProductInfo({
  product,
  isFamily: propIsFamily,
  familyVariants: propFamilyVariants,
  activeFamilyVariant: propActiveFamilyVariant,
  sizes: propSizes,
  activeSizeIndex: propActiveSizeIndex = 0,
  activeSizeObj: propActiveSizeObj,
  onSelectFamilyVariant,
  onSelectSizeIndex,
  onSelectVariant,
  activeVariantIndex = 0,
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const defaultVariants = getProductVariants(product);

  const isFamily =
    propIsFamily !== undefined ? propIsFamily : isFamilyProduct(product);
  const familyVariants =
    propFamilyVariants ||
    (isFamily && Array.isArray(product?.familyVariants)
      ? product.familyVariants
      : []);
  const activeFamilyVariant =
    propActiveFamilyVariant ||
    (familyVariants.length > 0 ? familyVariants[0] : null);

  const sizes =
    Array.isArray(propSizes) && propSizes.length > 0
      ? propSizes
      : defaultVariants;

  const [localVariantIndex, setLocalVariantIndex] = useState(
    activeVariantIndex || 0,
  );
  const currentSizeIndex =
    typeof propActiveSizeIndex === "number"
      ? propActiveSizeIndex
      : localVariantIndex;
  const activeSize =
    propActiveSizeObj || sizes[currentSizeIndex] || sizes[0] || {};
  const parsedSizes = sizes.map((sizeOption) => ({
    ...sizeOption,
    ...splitSizeAndPackLabel(sizeOption.displayLabel || sizeOption.label),
  }));
  const hasSeparateSizeAndPack = parsedSizes.some((option) => option.pack);
  const selectedSizePack = splitSizeAndPackLabel(activeSize.displayLabel || activeSize.label);
  const sizeChoices = [...new Set(parsedSizes.map((option) => option.size).filter(Boolean))];
  const packChoices = parsedSizes.filter(
    (option, index, options) =>
      option.pack &&
      (!selectedSizePack.size || option.size === selectedSizePack.size) &&
      options.findIndex(
        (candidate) => candidate.size === option.size && candidate.pack === option.pack,
      ) === index,
  );
  const selectSizeIndex = (index) => {
    if (onSelectSizeIndex) onSelectSizeIndex(index);
    else {
      setLocalVariantIndex(index);
      onSelectVariant?.(sizes[index], index);
    }
  };
  const chooseSize = (size) => {
    const match = parsedSizes.findIndex(
      (option) => option.size === size && (!selectedSizePack.pack || option.pack === selectedSizePack.pack),
    );
    selectSizeIndex(match >= 0 ? match : parsedSizes.findIndex((option) => option.size === size));
  };
  const choosePack = (pack) => {
    const match = parsedSizes.findIndex(
      (option) => option.pack === pack && (!selectedSizePack.size || option.size === selectedSizePack.size),
    );
    if (match >= 0) selectSizeIndex(match);
  };

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(() =>
    isWishlistItemSaved(product),
  );
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [reviews, setReviews] = useState([]);

  const selectedStock = Math.max(0, Number(activeSize?.stock || 0));
  const isOutOfStock =
    activeSize?.isAvailable === false || selectedStock <= 0;
  const price = Number(
    activeSize?.price ?? activeSize?.finalPrice ?? product.price ?? 0,
  );
  const oldPrice = Number(
    activeSize?.originalPrice ??
      activeSize?.regularPrice ??
      product.oldPrice ??
      price,
  );
  const savingsPercent =
    oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, getStoredAuthUser());

  const cleanDesc = (str) => {
    if (!str || typeof str !== "string") return "";
    const trimmed = str.trim();
    if (!trimmed || isSlugLike(trimmed)) return "";
    return trimmed;
  };

  const displayedDescription = isFamily
    ? cleanDesc(activeFamilyVariant?.description) ||
      cleanDesc(activeFamilyVariant?.shortDescription) ||
      cleanDesc(activeFamilyVariant?.details) ||
      cleanDesc(activeSize?.description) ||
      cleanDesc(activeSize?.details) ||
      cleanDesc(product?.familyVariants?.[0]?.description) ||
      cleanDesc(product?.familyVariants?.[0]?.shortDescription) ||
      cleanDesc(product?.shortDescription) ||
      cleanDesc(product?.description) ||
      cleanDesc(product?.productDetails?.overview) ||
      ""
    : cleanDesc(product?.shortDescription) ||
      cleanDesc(product?.description) ||
      cleanDesc(activeSize?.description) ||
      cleanDesc(activeSize?.details) ||
      "";

  useEffect(() => {
    setQuantity(1);
  }, [product.id, activeFamilyVariant?.id, activeSize?.id]);

  useEffect(() => {
    if (!product?.id) return;
    reviewApi.getProductReviews(product.id).then((res) => {
      setReviews(res || []);
    });
  }, [product?.id]);

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / totalReviews).toFixed(1)
    : null;

  useEffect(() => {
    setQuantity((current) => Math.min(Math.max(1, current), Math.max(selectedStock, 1)));
  }, [selectedStock, activeSize?.id]);

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

  const handleAddToCart = async () => {
    if (userLacksVet) {
      navigate(getStoredAuthUser() ? "/account/vet-verification" : "/login");
      return;
    }

    if (isOutOfStock) {
      showToast(`${activeSize?.displayLabel || activeSize?.label || product.title} is out of stock.`, "error");
      return;
    }

    if (quantity > selectedStock) {
      setQuantity(selectedStock);
      showToast(`Only ${selectedStock} item${selectedStock === 1 ? "" : "s"} available.`, "error");
      return;
    }

    setCartBusy(true);
    try {
      const variantLabel = activeSize?.displayLabel || activeSize?.label || "Default";
      const titleWithVariant = isFamily && activeFamilyVariant?.name
        ? `${product.title} (${activeFamilyVariant.name} - ${variantLabel})`
        : `${product.title} (${variantLabel})`;

      const itemToAdd = {
        ...product,
        id: `${product.id}:${activeSize?.id || "std"}`,
        productId: product.id,
        variantId: activeSize?.id,
        variantLabel,
        selectedOption: variantLabel,
        title: titleWithVariant,
        name: titleWithVariant,
        price,
        oldPrice,
        quantity,
        variantStock: selectedStock,
        stock: selectedStock,
        image: activeSize?.image || activeFamilyVariant?.image || product.image,
      };

      await cartApi.addItem(itemToAdd);
      showToast(`${titleWithVariant} added to cart.`, "success");
    } catch (error) {
      showToast(error.message || "Could not add product to cart.", "error");
    } finally {
      setCartBusy(false);
    }
  };

  const handleBuyNow = () => {
    if (userLacksVet) {
      navigate(getStoredAuthUser() ? "/account/vet-verification" : "/login");
      return;
    }

    if (isOutOfStock) {
      showToast(`${activeSize?.displayLabel || activeSize?.label || product.title} is out of stock.`, "error");
      return;
    }

    if (quantity > selectedStock) {
      setQuantity(selectedStock);
      showToast(`Only ${selectedStock} item${selectedStock === 1 ? "" : "s"} available.`, "error");
      return;
    }

    const variantLabel = activeSize?.displayLabel || activeSize?.label || "Default";
    const titleWithVariant = isFamily && activeFamilyVariant?.name
      ? `${product.title} (${activeFamilyVariant.name} - ${variantLabel})`
      : `${product.title} (${variantLabel})`;

    const checkoutItem = {
      ...product,
      id: `${product.id}:${activeSize?.id || "std"}`,
      productId: product.id,
      variantId: activeSize?.id,
      variantLabel,
      selectedOption: variantLabel,
      title: titleWithVariant,
      name: titleWithVariant,
      price,
      oldPrice,
      quantity,
      variantStock: selectedStock,
      stock: selectedStock,
      image: activeSize?.image || activeFamilyVariant?.image || product.image,
    };

    try {
      window.sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(checkoutItem));
      showToast(`${titleWithVariant} ready for checkout.`, "success");
      navigate("/checkout?buyNow=1");
    } catch {
      showToast("Checkout could not be opened. Please try again.", "error");
    }
  };

  const increaseQuantity = () => {
    setQuantity((current) => {
      const nextQuantity = Math.min(current + 1, selectedStock);
      if (current >= selectedStock) {
        showToast(`Only ${selectedStock} item${selectedStock === 1 ? "" : "s"} available.`, "error");
      }
      return nextQuantity;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="text-primaryDark"
    >
      <div className="flex items-start gap-4">
        <h1 className="min-w-0 flex-1 font-display text-[34px] font-extrabold leading-tight text-primaryDark">
          {product.title}
        </h1>
        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          disabled={wishlistBusy}
          onClick={handleWishlistClick}
          className={`grid size-11 shrink-0 place-items-center rounded-full border border-borderSoft bg-white transition hover:bg-sageLight ${
            isWishlisted ? "text-red" : "text-secondaryDark"
          } disabled:cursor-wait disabled:opacity-70`}
        >
          <Heart size={21} className={isWishlisted ? "fill-red" : ""} />
        </button>
      </div>

      {/* Star Rating display - only if product has actual reviews */}
      {totalReviews > 0 && avgRating && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={
                  star <= Math.round(Number(avgRating))
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300 fill-transparent"
                }
              />
            ))}
          </div>
          <span className="text-[13px] font-extrabold text-primaryDark">{avgRating}</span>
          <span className="text-[13px] font-semibold text-muted">
            ({totalReviews} review{totalReviews === 1 ? "" : "s"})
          </span>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <span className="block text-[11px] font-extrabold uppercase tracking-wide text-muted">Price</span>
          <span className="mt-1 block text-[30px] font-extrabold leading-none text-orange">${price.toFixed(2)}</span>
        </div>
        <div>
          <span className="block text-[11px] font-extrabold uppercase tracking-wide text-muted">You Pay</span>
          <span className="mt-1 block text-[16px] font-extrabold text-muted line-through">${oldPrice.toFixed(2)}</span>
        </div>
        {oldPrice > price && (
          <span className="mb-1 rounded-lg bg-softCream px-3 py-2 text-[13px] font-extrabold text-primaryDark">
            {savingsPercent}% OFF
          </span>
        )}
      </div>

      {isOutOfStock && (
        <span className="mt-4 inline-flex rounded-md px-3 py-1 text-[12px] font-extrabold uppercase bg-red/10 text-error">
          Out of stock
        </span>
      )}

      {displayedDescription ? (
        <div className="mt-5 max-w-[560px] text-[14px] font-semibold leading-relaxed text-primaryDark">
          {typeof displayedDescription === "string" && /<[a-z][\s\S]*>/i.test(displayedDescription) ? (
            <div dangerouslySetInnerHTML={{ __html: displayedDescription }} />
          ) : (
            <p className="whitespace-pre-line">{displayedDescription}</p>
          )}
        </div>
      ) : null}

      {/* ── VARIANT SELECTOR SECTION ── */}
      <div className="mt-6 border-t border-b border-borderSoft py-5 space-y-5">
        {/* Pack Size / Options Selector */}
        {sizes && sizes.length > 0 && !hasSeparateSizeAndPack && (
          <div className="flex flex-col text-left">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-muted">
                {product.optionLabel || product.optionType || (isFamily ? "Select Pack Size" : "Select Option")}:{" "}
                <span className="text-primaryDark font-extrabold normal-case">
                  {activeSize?.displayLabel || activeSize?.label}
                </span>
              </h3>
              {isFamily && (
                <Link
                  to={`/products/${product.productId || product.id || product.slug}/variants`}
                  className="text-[11px] font-extrabold text-orange hover:underline inline-flex items-center gap-1"
                >
                  <span>Dosage &amp; Variant Matrix &rarr;</span>
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {sizes.map((sizeOption, idx) => {
                const isSelected = idx === currentSizeIndex;
                const optPrice = Number(sizeOption.price ?? sizeOption.finalPrice ?? price);
                const optStock = sizeOption.stock;
                const optAvailable = sizeOption.isAvailable !== false && (optStock === undefined || optStock > 0);

                return (
                  <button
                    key={sizeOption.id || `sz-${idx}`}
                    type="button"
                    onClick={() => {
                      if (onSelectSizeIndex) {
                        onSelectSizeIndex(idx);
                      } else {
                        setLocalVariantIndex(idx);
                        onSelectVariant?.(sizeOption, idx);
                      }
                    }}
                    className={`flex min-w-[95px] flex-col items-center rounded-xl border px-4 py-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-orange bg-softCream text-primaryDark shadow-xs"
                        : "border-borderSoft bg-white text-muted hover:border-secondary/50 hover:bg-sageLight/30"
                    } ${!optAvailable ? "opacity-60" : ""}`}
                  >
                    <span className="text-[14px] font-extrabold text-primaryDark">
                      {sizeOption.displayLabel || sizeOption.label || `Option ${idx + 1}`}
                    </span>
                    <span className="mt-0.5 text-[12px] font-black text-secondaryDark">
                      ${optPrice.toFixed(2)}
                    </span>
                    {/* {optStock !== undefined && optStock !== null && (
                      <span className={`mt-0.5 text-[9px] font-bold ${optAvailable ? "text-muted" : "text-error"}`}>
                        {optAvailable ? `${optStock} left` : "Out of stock"}
                      </span>
                    )} */}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {hasSeparateSizeAndPack && (
          <div className="flex flex-col gap-5 text-left">
            <div>
              <h3 className="mb-2.5 text-[11px] font-black uppercase tracking-wider text-muted">Size:</h3>
              <div className="flex flex-wrap gap-2.5">
                {sizeChoices.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => chooseSize(size)}
                    className={`rounded-xl border px-4 py-2.5 text-[14px] font-extrabold transition-all ${
                      selectedSizePack.size === size
                        ? "border-orange bg-softCream text-primaryDark shadow-xs"
                        : "border-borderSoft bg-white text-muted hover:border-secondary/50 hover:bg-sageLight/30"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2.5 text-[11px] font-black uppercase tracking-wider text-muted">Dose / Pack:</h3>
              <div className="flex flex-wrap gap-2.5">
                {packChoices.map((option) => (
                  <button
                    key={`${option.size}-${option.pack}`}
                    type="button"
                    onClick={() => choosePack(option.pack)}
                    className={`flex min-w-[95px] flex-col items-center rounded-xl border px-4 py-2.5 transition-all ${
                      selectedSizePack.pack === option.pack
                        ? "border-orange bg-softCream text-primaryDark shadow-xs"
                        : "border-borderSoft bg-white text-muted hover:border-secondary/50 hover:bg-sageLight/30"
                    }`}
                  >
                    <span className="text-[14px] font-extrabold">{option.pack}</span>
                    <span className="mt-0.5 text-[12px] font-black text-secondaryDark">
                      ${Number(option.price ?? option.finalPrice ?? price).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <span className="text-[15px] font-extrabold text-primaryDark">Quantity:</span>
        <div className="flex items-center overflow-hidden rounded-xl border border-borderSoft bg-white">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            aria-label="Decrease quantity"
            disabled={quantity <= 1 || isOutOfStock}
            className="flex h-10 w-10 items-center justify-center text-muted transition hover:bg-softCream hover:text-textMain disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Minus size={16} />
          </button>
          <span className="flex h-10 w-12 items-center justify-center border-x border-borderSoft text-[14px] font-extrabold text-primaryDark">
            {quantity}
          </span>
          <button
            type="button"
            onClick={increaseQuantity}
            aria-label="Increase quantity"
            disabled={quantity >= selectedStock || isOutOfStock}
            className="flex h-10 w-10 items-center justify-center text-muted transition hover:bg-softCream hover:text-textMain disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {requiresVet && (
        <div className="mt-4 mb-2 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primaryDark px-3.5 py-1.5 text-xs font-extrabold uppercase text-white shadow-xs">
            <ShieldCheck size={14} className="text-amber-300" />
            VERIFIED VETERINARIAN REQUIRED
          </span>
          {userLacksVet && (
            <Link
              to={getStoredAuthUser() ? "/account/vet-verification" : "/login"}
              className="text-xs font-extrabold text-[#d9aa3d] hover:text-amber-700 underline cursor-pointer"
            >
              Apply for Verification
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={cartBusy || isOutOfStock || userLacksVet}
          className={`flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-extrabold transition ${
            userLacksVet
              ? "bg-primaryDark/40 text-white cursor-not-allowed shadow-none border-none opacity-90"
              : "bg-primaryDark text-white hover:bg-primary disabled:cursor-not-allowed disabled:opacity-55 cursor-pointer"
          }`}
        >
          {!userLacksVet && <ShoppingCart size={17} />}
          {userLacksVet ? "Apply for Verification" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={cartBusy || isOutOfStock || userLacksVet}
          className={`flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-extrabold transition ${
            userLacksVet
              ? "border border-[#17345f1a] bg-gray-100 text-[#122a50]/40 cursor-not-allowed shadow-none"
              : "border border-primaryDark bg-white text-primaryDark hover:bg-sageLight disabled:cursor-not-allowed disabled:opacity-55 cursor-pointer"
          }`}
        >
          {!userLacksVet && <PawPrint size={17} fill="currentColor" />}
          <span>Buy Now</span>
        </button>
      </div>

      <button
        type="button"
        onClick={handleWishlistClick}
        disabled={wishlistBusy}
        className="mt-4 inline-flex items-center gap-2 text-[14px] font-extrabold text-primaryDark transition hover:text-secondaryDark disabled:cursor-wait disabled:opacity-60"
      >
        <Heart size={18} className={isWishlisted ? "fill-red text-red" : ""} />
        {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      </button>
    </motion.div>
  );
}
