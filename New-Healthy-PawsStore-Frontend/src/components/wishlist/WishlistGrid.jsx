import { AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import WishlistProductCard from "./WishlistProductCard";

export default function WishlistGrid({
  products,
  view,
  onRemove,
  onMoveToCart,
  onLoadMore,
  canLoadMore,
}) {
  return (
    <>
      <div
        className={
          view === "list"
            ? "grid gap-3 sm:gap-4"
            : "grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4"
        }
      >
        <AnimatePresence mode="popLayout">
          {products.map((product, index) => (
            <WishlistProductCard
              key={product.id}
              product={product}
              index={index}
              view={view}
              onRemove={onRemove}
              onMoveToCart={onMoveToCart}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-[-6px] flex justify-center">
        <button
          type="button"
          onClick={onLoadMore}
          disabled={!canLoadMore}
          className="inline-flex h-10 min-w-[210px] items-center justify-center gap-2 rounded-full border border-borderSoft bg-white px-8 text-[13px] font-bold text-textMain transition hover:bg-sageLight disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          Load More
          <ChevronDown size={16} />
        </button>
      </div>
    </>
  );
}
