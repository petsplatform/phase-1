import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AccountLayout from "../components/account/AccountLayout";
import { CartIcon, HeartIcon } from "../components/common/HeaderIcons";
import {
  getWishlistItems,
  removeWishlistItem,
  saveWishlistItems,
  syncWishlistFromApi,
  WISHLIST_UPDATED_EVENT,
} from "../utils/wishlist";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/common/ConfirmModal";
import { productApi } from "../api/productApi";
import { wishlistApi } from "../api/wishlistApi";
import { reviewApi } from "../api/reviewApi";

const isSameWishlistItem = (item, product) =>
  item.id === product.id ||
  item.slug === product.slug ||
  item.productId === product.productId ||
  item.productId === product.id ||
  item.id === product.productId;

const ShareIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM18 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM8.7 14.9l6.6-3.8M8.7 19.1l6.6 3.8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const TrashIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StarRating = ({ rating = 5 }) => (
  <span
    className="flex items-center gap-0.5 text-[#d9aa3d]"
    aria-label={`${rating} star rating`}
  >
    {Array.from({ length: 5 }).map((_, index) => (
      <svg
        key={index}
        className={`h-3.5 w-3.5 ${index < Math.round(rating) ? "fill-current" : "fill-[#17345f1a] text-[#17345f1a]"}`}
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="m10 1.7 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8 2.5-5Z" />
      </svg>
    ))}
  </span>
);

const WishlistCard = ({ product, onRemove, onAddToCart }) => {
  const [reviews, setReviews] = useState(() =>
    Array.isArray(product.reviews) ? product.reviews : [],
  );

  useEffect(() => {
    const pId = product.productId || product.id || product._id || product.slug;
    if (pId) {
      reviewApi
        .getProductReviews(pId)
        .then((data) => {
          if (Array.isArray(data)) setReviews(data);
        })
        .catch(() => {});
    }
  }, [product.productId, product.id, product._id, product.slug]);

  const reviewsCount =
    reviews.length > 0
      ? reviews.length
      : Number(
          product.reviewsCount ||
            product.ratingCount ||
            (Array.isArray(product.reviews)
              ? product.reviews.length
              : typeof product.reviews === "number"
                ? product.reviews
                : 0),
        );

  const ratingValue =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
        reviews.length
      : Number(product.rating || product.avgRating || 0);

  const hasRating = reviewsCount > 0 && ratingValue > 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#17345f1a] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <button
        type="button"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#EF4444] shadow-[0_6px_18px_rgba(17,17,17,0.08)] transition-transform hover:scale-105"
        aria-label={`Remove ${product.name} from favorites`}
        onClick={() => onRemove(product.id)}
      >
        <HeartIcon className="h-5 w-5 fill-[#EF4444]" />
      </button>

      <div className="flex aspect-square items-center justify-center bg-white px-5 pb-3 pt-8">
        <img
          src={product.image}
          alt={product.name}
          className="h-full max-h-[190px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col px-4 pb-5">
        <h3 className="min-h-[44px] text-sm font-extrabold leading-[22px] text-[#122a50]">
          {product.name}
        </h3>
        <p className="mt-1 text-xs font-semibold text-[#122a50b2]">
          {product.description}
        </p>

        {hasRating && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#122a50b2]">
            <StarRating rating={ratingValue} />
            <span className="text-[11px] font-extrabold text-[#122a50]">
              {ratingValue.toFixed(1)}
            </span>
            <span className="text-[10px] text-[#122a50a6]">
              ({reviewsCount})
            </span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-lg font-extrabold text-[#d9aa3d]">
            ${product.price}
          </span>
          {product.oldPrice && (
            <span className="text-xs font-bold text-[#122a50b2] line-through">
              ${product.oldPrice}
            </span>
          )}
          {product.discount && (
            <span className="rounded-md bg-[#f8f1df] px-2 py-1 text-[10px] font-extrabold uppercase text-[#17345f]">
              {product.discount}
            </span>
          )}
        </div>
        <div className="mt-auto pt-5">
          <button
            type="button"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#17345f] bg-white text-sm font-extrabold text-[#17345f] transition-all hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
            onClick={() => onAddToCart(product)}
          >
            <CartIcon className="h-4 w-4" />
            Add to Cart
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#122a50b2] transition-colors hover:bg-[#FEF2F2] hover:text-[#EF4444]"
            onClick={() => onRemove(product.id)}
          >
            <TrashIcon className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
};

const Wishlist = () => {
  const { addToCart, addManyToCart } = useCart();
  const { showToast } = useToast();
  const [wishlistItems, setWishlistItems] = useState(getWishlistItems);
  const [removeTarget, setRemoveTarget] = useState(null);

  const requestRemoveItem = (productId) => {
    setRemoveTarget(
      wishlistItems.find((item) => item.id === productId) || { id: productId },
    );
  };

  const confirmRemoveItem = () => {
    if (!removeTarget) return;
    const nextItems = removeWishlistItem(removeTarget.id);
    setWishlistItems(nextItems);
    setRemoveTarget(null);
    showToast("Removed from wishlist");
  };

  const removeMovedWishlistItems = (products = []) => {
    const movedProducts = products.filter(Boolean);
    if (!movedProducts.length) return getWishlistItems();

    const nextItems = getWishlistItems().filter(
      (item) =>
        !movedProducts.some((product) => isSameWishlistItem(item, product)),
    );
    saveWishlistItems(nextItems);
    setWishlistItems(nextItems);
    wishlistApi.syncWishlist(nextItems).catch(() => {});
    return nextItems;
  };

  const getFreshWishlistProduct = async (product) => {
    try {
      const liveProduct = await productApi.getProductById(
        product.productId || product.id,
      );
      const selectedVariantId = product.variantId || product.selectedSize?.id;
      const selectedSize = selectedVariantId
        ? liveProduct.optionVariants?.find(
            (variant) => String(variant.id) === String(selectedVariantId),
          ) || product.selectedSize
        : product.selectedSize;

      return {
        ...product,
        ...liveProduct,
        selectedSize,
        selectedColor:
          product.selectedColor || liveProduct.selectedColor || null,
        optionLabel: product.optionLabel || liveProduct.optionLabel || "",
      };
    } catch {
      return product;
    }
  };

  const addWishlistProductToCart = async (product) => {
    const freshProduct = await getFreshWishlistProduct(product);
    const result = addToCart(freshProduct);

    if (result?.outOfStock) {
      setWishlistItems(getWishlistItems());
      showToast(`${product.name} is out of stock`, "error");
      return;
    }

    removeMovedWishlistItems([product]);
    showToast(`${product.name} added to cart`);
  };

  const addAllToCart = () => {
    if (!wishlistItems.length) {
      showToast("Your wishlist is empty", "warning");
      return;
    }
    const result = addManyToCart(wishlistItems);
    if (result?.addedCount <= 0) {
      setWishlistItems(getWishlistItems());
      showToast("Wishlist products are out of stock", "error");
      return;
    }

    removeMovedWishlistItems(result.addedProducts || wishlistItems);
    showToast(
      result?.skippedCount > 0
        ? `${result.addedCount} items added to cart. ${result.skippedCount} out of stock.`
        : `${result.addedCount} items added to cart`,
      result?.skippedCount > 0 ? "warning" : "success",
    );
  };

  useEffect(() => {
    const syncWishlist = () => setWishlistItems(getWishlistItems());
    const syncWishlistFromServer = () =>
      syncWishlistFromApi().then(setWishlistItems);
    syncWishlistFromServer();
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
    window.addEventListener("storage", syncWishlist);
    window.addEventListener("petcare-auth-change", syncWishlistFromServer);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
      window.removeEventListener("storage", syncWishlist);
      window.removeEventListener("petcare-auth-change", syncWishlistFromServer);
    };
  }, []);

  const shareWishlist = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Wishlist link copied");
    } catch {
      showToast("Copy the URL from your browser address bar");
    }
  };

  return (
    <AccountLayout
      title={`My Wishlist (${wishlistItems.length})`}
      description="Your favorite pet products all in one place. Review them anytime and add to cart."
      actions={
        <>
          {/* <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#17345f1a] bg-white px-5 text-sm font-extrabold text-[#17345f] shadow-sm transition-all hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d]" onClick={shareWishlist}>
            <ShareIcon className="h-4 w-4" />
            Share Wishlist
          </button> */}
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#17345f] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(18,42,80,0.22)] transition-all hover:bg-[#d9aa3d]"
            onClick={addAllToCart}
          >
            <CartIcon className="h-4 w-4" />
            Add All to Cart
          </button>
        </>
      }
    >
      {wishlistItems.length ? (
        <div className="grid grid-cols-1 gap-4 pb-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {wishlistItems.map((product) => (
            <WishlistCard
              key={product.id}
              product={product}
              onRemove={requestRemoveItem}
              onAddToCart={addWishlistProductToCart}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#17345f1a] bg-white p-10 text-center shadow-sm">
          <HeartIcon className="mx-auto h-12 w-12 text-[#EF4444]" />
          <h2 className="mt-4 text-2xl font-extrabold text-[#122a50]">
            Your wishlist is empty
          </h2>
          <p className="mt-2 text-sm font-semibold text-[#122a50b2]">
            Browse products and save your favorites here.
          </p>
          <Link
            to="/products"
            className="mt-5 inline-flex rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d]"
          >
            Shop Products
          </Link>
        </div>
      )}
      <ConfirmModal
        open={Boolean(removeTarget)}
        title="Remove item?"
        message={`Do you want to remove ${removeTarget?.name || "this item"} from your wishlist?`}
        confirmLabel="OK"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={confirmRemoveItem}
      />
    </AccountLayout>
  );
};

export default Wishlist;
