import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import ShopProductCard from "../Components/Shop/ShopProductCard";
import ShopPagination from "../Components/Shop/ShopPagination";
import { useNotification } from "../utils/NotificationContext";
import { deduplicateWishlistItems } from "../utils/wishlistFunctionality";
import { ProductCardSkeleton } from "../Components/common/ProductCardSkeleton";

export default function WishlistPage({
  wishlistItems = [],
  toggleWishlist,
  onAddToCart,
  onClearWishlist,
  isLoading = false,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [addedAll, setAddedAll] = useState(false);
  const uniqueItems = deduplicateWishlistItems(wishlistItems);
  const isEmpty = uniqueItems.length === 0;
  const { showNotification } = useNotification();

  function handleAddAllToCart() {
    if (uniqueItems.length === 0) return;
    uniqueItems.forEach((item) => {
      onAddToCart(item, 1, true);
    });
    setAddedAll(true);
    setTimeout(() => setAddedAll(false), 2000);

    showNotification(
      `Added all ${uniqueItems.length} items from wishlist to cart!`,
      "cart-bulk",
      null,
      { to: "/cart", label: "View Cart" },
    );
  }

  function handleClearWishlist() {
    if (onClearWishlist) {
      onClearWishlist();
      showNotification(
        "Cleared all items from your wishlist!",
        "wishlist-remove",
        null,
        null,
      );
    }
  }

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(uniqueItems.length / ITEMS_PER_PAGE);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const paginatedItems = uniqueItems.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE,
  );

  return (
    <main className="bg-background min-h-screen pb-16">
      {/* Breadcrumbs */}
      <div className="page-shell px-4 pt-8 pb-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#8a8f88]">
          <Link to="/" className="transition hover:text-secondary">
            Home
          </Link>
          <span>/</span>
          <span className="text-secondary font-bold">Wishlist</span>
        </nav>
      </div>

      <section className="page-shell px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-on-background">
              My Wishlist{" "}
              <span className="text-secondary">
                {isLoading ? "..." : `(${uniqueItems.length})`}
              </span>
            </h1>
            <p className="text-sm text-charcoal-text mt-1">
              Your favorite items curated in one place. Add them to your cart
              anytime!
            </p>
          </div>

          {!isLoading && !isEmpty && (
            <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
              <button
                type="button"
                onClick={handleAddAllToCart}
                className={`rounded-full px-5 py-2.5 text-xs font-bold text-white transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
                  addedAll ? "bg-secondary/90" : "bg-secondary"
                }`}
              >
                {addedAll ? "Added All to Cart!" : "Add All to Cart"}
              </button>

              {onClearWishlist && (
                <button
                  type="button"
                  onClick={handleClearWishlist}
                  className="rounded-full border border-outline-strong bg-white px-5 py-2.5 text-xs font-bold text-charcoal-text transition hover:border-rose-300 hover:text-rose-500 cursor-pointer shadow-sm"
                >
                  Clear Wishlist
                </button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="mx-auto max-w-2xl rounded-[32px] border border-outline bg-white px-6 py-16 text-center shadow-[0_30px_60px_rgba(28,40,33,0.06)] sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft text-secondary mb-6 animate-pulse">
              <Heart size={28} className="fill-secondary/20" />
            </div>

            <h2 className="text-2xl font-bold text-on-background">
              Your wishlist is feeling a bit light!
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-charcoal-text">
              Save your favorite nutrition, comfort items, and toys here while
              you shop to keep track of what your pet needs.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-primary-link rounded-full bg-secondary px-6 py-3.5 text-sm font-bold transition hover:opacity-95 shadow cursor-pointer"
              >
                <ShoppingBag size={15} />
                Explore Shop
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {paginatedItems.map((item) => (
                <ShopProductCard
                  key={item.id}
                  product={item}
                  onAddToCart={onAddToCart}
                  isWished={true}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>

            <ShopPagination
              currentPage={activePage}
              totalPages={totalPages}
              totalItems={uniqueItems.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
      </section>
    </main>
  );
}
