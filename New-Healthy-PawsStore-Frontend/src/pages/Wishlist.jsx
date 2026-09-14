import { useEffect, useMemo, useState } from "react";
import { cartApi } from "../api/cartApi";
import ConfirmModal from "../components/common/ConfirmModal";
import TrustFeatures from "../components/common/TrustFeatures";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import WishlistEmptyState from "../components/wishlist/WishlistEmptyState";
import WishlistGrid from "../components/wishlist/WishlistGrid";
import WishlistHero from "../components/wishlist/WishlistHero";
import WishlistRecommendations from "../components/wishlist/WishlistRecommendations";
import WishlistSummary from "../components/wishlist/WishlistSummary";
import WishlistToolbar from "../components/wishlist/WishlistToolbar";
import { useToast } from "../context/ToastContext";
import {
  getStoredWishlist,
  refreshWishlistFromApi,
  removeWishlistItem,
  saveStoredWishlist,
  WISHLIST_UPDATED_EVENT,
} from "../services/wishlistService";
import Newsletter from "../components/home/Newsletter";
import {
  buildVariantCartItem,
  getFirstAvailableVariant,
  getTotalVariantStock,
} from "../utils/productVariants";

function sortProducts(products, sort) {
  const sorted = [...products];

  if (sort === "Price: Low to High") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sort === "Price: High to Low") {
    sorted.sort((a, b) => b.price - a.price);
  } else if (sort === "Product Name") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "Highest Rated") {
    sorted.sort((a, b) => b.rating - a.rating);
  }

  return sorted;
}

function getWishlistCartItem(product) {
  const firstAvailableVariant = getFirstAvailableVariant(product);
  const stock = getTotalVariantStock(product);

  if (!firstAvailableVariant?.isAvailable || stock <= 0) return null;
  return buildVariantCartItem(product, firstAvailableVariant, 1);
}

export default function Wishlist() {
  const { showToast } = useToast();
  const [items, setItems] = useState(() => getStoredWishlist());
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("Recently Added");
  const [visibleCount, setVisibleCount] = useState(4);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const syncItems = () => setItems(getStoredWishlist());

    syncItems();
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncItems);
    window.addEventListener("storage", syncItems);

    refreshWishlistFromApi().catch((error) => {
      showToast(
        error.message || "Could not load wishlist from backend.",
        "error",
      );
    });

    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncItems);
      window.removeEventListener("storage", syncItems);
    };
  }, [showToast]);

  const sortedProducts = useMemo(
    () => sortProducts(items, sort),
    [items, sort],
  );
  const visibleProducts = sortedProducts.slice(0, visibleCount);
  const canLoadMore = visibleCount < sortedProducts.length;

  const summary = useMemo(
    () =>
      items.reduce(
        (totals, product) => ({
          count: totals.count + 1,
          total: totals.total + product.price,
          savings: totals.savings + product.oldPrice - product.price,
        }),
        { count: 0, total: 0, savings: 0 },
      ),
    [items],
  );

  const removeItem = async (id, options = {}) => {
    const previousItems = getStoredWishlist();
    saveStoredWishlist(previousItems.filter((product) => product.id !== id));

    try {
      await removeWishlistItem(id);
      if (!options.silent)
        showToast("Product removed from wishlist.", "success");
    } catch (error) {
      saveStoredWishlist(previousItems);
      showToast(
        error.message || "Could not remove product from wishlist.",
        "error",
      );
      error.wishlistNotified = true;
      throw error;
    }
  };

  const requestRemoveItem = (id) => {
    const product = getStoredWishlist().find((item) => item.id === id);
    setConfirmAction({
      type: "wishlist-item",
      id,
      title: "Remove from wishlist?",
      message: product
        ? `${product.title} will be removed from your wishlist.`
        : "This product will be removed from your wishlist.",
      confirmText: "Remove Item",
    });
  };

  const moveToCart = async (id) => {
    const product = getStoredWishlist().find((item) => item.id === id);
    if (!product) return;

    const cartItem = getWishlistCartItem(product);
    if (!cartItem) {
      showToast(`${product.title} is out of stock.`, "error");
      return;
    }

    try {
      await cartApi.addItem(cartItem);
      await removeItem(id, { silent: true });
      showToast(`${product.title} moved to cart.`, "success");
    } catch (error) {
      if (!error.wishlistNotified) {
        showToast(error.message || "Could not move product to cart.", "error");
      }
    }
  };

  const moveAllToCart = async () => {
    const currentItems = getStoredWishlist();
    if (!currentItems.length) return;

    const availableItems = currentItems
      .map((product) => ({ product, cartItem: getWishlistCartItem(product) }))
      .filter(({ cartItem }) => cartItem);
    const unavailableCount = currentItems.length - availableItems.length;

    if (!availableItems.length) {
      showToast("Wishlist products are out of stock.", "error");
      return;
    }

    try {
      await Promise.all(
        availableItems.map(({ cartItem }) => cartApi.addItem(cartItem)),
      );
      await Promise.all(
        availableItems.map(({ product }) => removeWishlistItem(product.id)),
      );
      saveStoredWishlist(
        getStoredWishlist().filter((product) => !getWishlistCartItem(product)),
      );
      showToast(
        unavailableCount
          ? `Available wishlist products moved to cart. ${unavailableCount} out of stock item${unavailableCount === 1 ? "" : "s"} skipped.`
          : "Wishlist products moved to cart.",
        "success",
      );
    } catch (error) {
      saveStoredWishlist(currentItems);
      showToast(
        error.message || "Could not move wishlist products to cart.",
        "error",
      );
    }
  };

  const requestMoveAllToCart = () => {
    setConfirmAction({
      type: "wishlist-move-all",
      title: "Move all items to cart?",
      message: "Available wishlist products will be added to your cart and removed from your wishlist.",
      confirmText: "Move All",
      tone: "primary",
    });
  };

  const handleConfirmAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);

    if (action?.type === "wishlist-item") {
      await removeItem(action.id);
    }
    if (action?.type === "wishlist-move-all") {
      await moveAllToCart();
    }
  };

  return (
    <div className="min-h-screen bg-background text-textMain">
      <Header />
      <main className="pb-24 sm:pb-8">
        <WishlistHero count={summary.count} />

        <section className="bg-background px-4 pb-4 pt-3 sm:px-5 lg:px-6">
          <div className="mx-auto grid max-w-[1360px] gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 rounded-[18px] border border-borderSoft bg-white p-2 shadow-[0_10px_28px_var(--color-shadow)]">
              {items.length ? (
                <>
                  <WishlistToolbar
                    view={view}
                    onViewChange={setView}
                    sort={sort}
                    onSort={setSort}
                  />
                  <WishlistGrid
                    products={visibleProducts}
                    view={view}
                    onRemove={requestRemoveItem}
                    onMoveToCart={moveToCart}
                    onLoadMore={() =>
                      setVisibleCount((current) =>
                        Math.min(current + 4, sortedProducts.length),
                      )
                    }
                    canLoadMore={canLoadMore}
                  />
                </>
              ) : (
                <WishlistEmptyState />
              )}
            </div>

            <div className="grid h-fit gap-5">
              <WishlistSummary summary={summary} onMoveAll={requestMoveAllToCart} />
              {items.length > 0 && <WishlistRecommendations />}
            </div>
          </div>
        </section>

        <TrustFeatures />
        <Newsletter assetVariant="wishlist" />
      </main>
      <Footer />
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText={confirmAction?.confirmText}
        tone={confirmAction?.tone || "danger"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
