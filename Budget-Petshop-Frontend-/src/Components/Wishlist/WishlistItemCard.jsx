import { ShoppingCart, Heart, Eye } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProductCategory } from "../../utils/shopFilters";
import { getProductUrl, hasVariants } from "../../utils/productUtils";

const CATEGORY_BADGE_COLORS = {
  food: { bg: "#fff5ec", text: "#c2612e" },
  grooming: { bg: "#f0ebff", text: "#6c48c4" },
  accessories: { bg: "#edfaf3", text: "#176b59" },
  beds: { bg: "#fdf3ec", text: "#b85c1e" },
  toys: { bg: "#fff8e6", text: "#9a6e10" },
  travel: { bg: "#eff7ff", text: "#1e5da8" },
};

export default function WishlistItemCard({
  product,
  onAddToCart,
  onRemoveFromWishlist,
}) {
  const navigate = useNavigate();
  const { id, title, originalPrice, salePrice, image } = product;
  const [added, setAdded] = useState(false);
  const productUrl = getProductUrl(product);
  const productHasVariants = hasVariants(product);

  const catId = getProductCategory(product);
  const catBadge =
    CATEGORY_BADGE_COLORS[catId] || CATEGORY_BADGE_COLORS.accessories;

  function handleAddToCart() {
    if (productHasVariants) {
      navigate(productUrl);
      return;
    }
    if (onAddToCart) {
      onAddToCart(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } else {
      navigate(productUrl);
    }
  }

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_64px_rgba(28,40,33,0.13)]"
      style={{
        border: "1.5px solid #e7ddd0",
        boxShadow: "0 4px 20px rgba(28,40,33,0.06)",
      }}
    >
      {/* Product Image Area */}
      <div className="relative overflow-hidden h-[260px] sm:h-[300px]">
        <Link
          to={productUrl}
          aria-label={`View details and variants for ${title}`}
          className="absolute inset-0 block"
        >
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="product-card-img h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.07] group-hover:blur-[2px]"
          />

          {/* Eye Icon Hover Overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 backdrop-blur-[1.5px]"
            style={{ background: "rgba(23,107,89,0.08)" }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-white transition group-hover:scale-110 shadow-md">
              <Eye size={18} />
            </span>
          </div>
        </Link>

        {/* Remove from Wishlist button (Top Right) */}
        <button
          type="button"
          aria-label="Remove from wishlist"
          onClick={() => onRemoveFromWishlist(id)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow transition duration-300 hover:scale-110 border border-outline cursor-pointer"
        >
          <Heart size={17} fill="#e8546a" stroke="#e8546a" />
        </button>
      </div>

      {/* Product Info Section */}
      <div className="flex flex-1 flex-col p-5">
        <h3
          className="line-clamp-2 min-h-[40px] text-sm font-bold text-on-background group-hover:text-primary transition-colors"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          <Link to={productUrl}>{title}</Link>
        </h3>

        {/* Pricing and Actions Row */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-outline">
          <div className="flex flex-col">
            {originalPrice && originalPrice !== salePrice && (
              <span className="text-[11px] text-charcoal-text line-through">
                {originalPrice}
              </span>
            )}
            <span className="text-base font-bold text-[#e58b5d]">
              {salePrice}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-white transition duration-300 shadow hover:opacity-95 cursor-pointer ${
              added ? "bg-primary" : "bg-secondary"
            }`}
          >
            {productHasVariants ? (
              <Eye size={13} />
            ) : (
              <ShoppingCart size={13} />
            )}
            {productHasVariants
              ? "View Variant"
              : added
                ? "Added!"
                : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
