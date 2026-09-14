import { ArrowRight, PawPrint } from "lucide-react";
import { wishlistRecommendations } from "../../data/wishlistRecommendations";
import RecommendationItem from "./RecommendationItem";

export default function WishlistRecommendations() {
  return (
    <aside
      className="rounded-[18px] border border-borderSoft bg-white p-6 shadow-[0_10px_28px_var(--color-shadow)]"
      aria-labelledby="wishlist-recommendations-title"
    >
      <h2
        id="wishlist-recommendations-title"
        className="flex items-center gap-3 font-display text-[22px] font-extrabold text-textMain"
      >
        <PawPrint size={19} className="text-secondary" fill="currentColor" />
        You May Also Like
      </h2>

      <div className="mt-4">
        {wishlistRecommendations.map((product) => (
          <RecommendationItem key={product.id} product={product} />
        ))}
      </div>

      <a
        href="/products"
        className="mt-4 inline-flex w-full items-center justify-center gap-3 text-[14px] font-extrabold text-secondaryDark transition hover:text-primaryDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        View More Recommendations
        <ArrowRight size={16} />
      </a>
    </aside>
  );
}
