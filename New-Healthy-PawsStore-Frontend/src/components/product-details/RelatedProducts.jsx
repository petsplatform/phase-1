import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingCart, ChevronRight } from "lucide-react";
import { catalogApi } from "../../api/catalogApi";
import { getProductUrl } from "../../utils/productUtils";

export default function RelatedProducts({ currentId, category }) {
  const scrollRef = useRef(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let active = true;

    catalogApi
      .getProducts({ limit: 8, category })
      .then((result) => {
        const products = result.items.filter((p) => p.id !== currentId).slice(0, 6);
        if (active) setRelated(products);
      })
      .catch(() => {
        if (active) setRelated([]);
      });

    return () => {
      active = false;
    };
  }, [currentId, category]);

  if (!related.length) return null;

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 240, behavior: "smooth" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
    >
      <h2 className="mb-5 text-[18px] font-extrabold text-textMain">
        You May Also Like
      </h2>

      <div className="relative">
        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {related.map((product) => (
            <Link
              key={product.id}
              to={getProductUrl(product)}
              className="group flex w-[190px] shrink-0 flex-col overflow-hidden rounded-2xl border border-borderSoft bg-white transition-shadow duration-300 hover:shadow-soft"
            >
              {/* Image */}
              <div className="relative flex items-center justify-center bg-white px-4 pt-4 pb-2">
                <span className="absolute left-2.5 top-2.5 z-10 rounded-lg bg-secondary px-2 py-[2px] text-[10px] font-extrabold text-white">
                  {product.discount}
                </span>
                <img
                  src={product.image}
                  alt={product.title}
                  loading="lazy"
                  className="h-[100px] w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col px-3 pb-3 pt-1">
                <h3 className="line-clamp-2 text-[12px] font-bold leading-snug text-textMain">
                  {product.title}
                </h3>
                <div className="mt-auto flex items-end justify-between pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[14px] font-extrabold text-secondary">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-semibold text-muted line-through">
                      ${product.oldPrice.toFixed(2)}
                    </span>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-white">
                    <ShoppingCart size={13} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Scroll arrow */}
        <button
          type="button"
          onClick={scrollRight}
          aria-label="See more related products"
          className="absolute -right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-borderSoft bg-white text-muted shadow-sm transition-colors hover:text-textMain"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
