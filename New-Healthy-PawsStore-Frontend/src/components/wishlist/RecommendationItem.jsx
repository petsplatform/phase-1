import { ShoppingCart, Star } from "lucide-react";

export default function RecommendationItem({ product }) {
  return (
    <article className="grid grid-cols-[72px_1fr_44px] items-center gap-4 border-b border-borderSoft py-4 last:border-b-0">
      <img
        src={product.image}
        alt={product.title}
        loading="lazy"
        className="h-[88px] w-[72px] object-contain"
      />
      <div className="min-w-0">
        <h3 className="text-[14px] font-extrabold leading-snug text-textMain">
          {product.title}
        </h3>

        {product.rating && Number(product.rating) > 0 ? (
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-500">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{product.rating}</span>
            {product.reviews > 0 ? <span className="text-[10px] font-semibold text-muted">({product.reviews})</span> : null}
          </div>
        ) : null}

        <p className="mt-1.5 text-[16px] font-extrabold text-textMain">
          ${product.price.toFixed(2)}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Add ${product.title} to cart`}
        className="grid size-10 place-items-center rounded-lg border border-borderSoft bg-white text-secondaryDark transition hover:bg-sageLight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        <ShoppingCart size={18} />
      </button>
    </article>
  );
}
