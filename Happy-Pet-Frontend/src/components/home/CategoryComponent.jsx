import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { productApi } from "../../api/productApi.js";

const categoryStyles = [
  "bg-[#fff7ed] border-[#fed7aa]",
  "bg-[#f5f3ff] border-[#ddd6fe]",
  "bg-[#ecfdf5] border-[#bbf7d0]",
  "bg-[#fef2f2] border-[#fecaca]",
  "bg-[#eff6ff] border-[#bfdbfe]",
  "bg-[#fdf2f8] border-[#fbcfe8]",
];

const textStyles = [
  "text-orange-500",
  "text-violet-500",
  "text-emerald-500",
  "text-rose-500",
  "text-blue-500",
  "text-pink-500",
];

function normalizeCategory(category, index) {
  return {
    id: category.id,
    name: category.name,
    image: category.image || category.themeImage || category.thumbnail || "",
    count: `${category._count?.products || category.productCount || 0} Items`,
    bgColor: categoryStyles[index % categoryStyles.length],
    textColor: textStyles[index % textStyles.length],
  };
}

export default function CategoryComponent() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    let active = true;

    productApi
      .getCategories()
      .then((items) => {
        if (active) setCategories((items || []).map(normalizeCategory));
      })
      .catch((error) => {
        console.error("Failed to load home categories:", error);
        if (active) setCategories([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.id && category.name),
    [categories],
  );

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = containerRef.current;
    if (scrollWidth <= clientWidth) return;
    const maxScroll = scrollWidth - clientWidth;
    const index = Math.round((scrollLeft / maxScroll) * (visibleCategories.length - 1));
    setActiveIndex(Math.min(Math.max(index, 0), visibleCategories.length - 1));
  };

  if (visibleCategories.length === 0) return null;

  return (
    <section
      id="SHOPBYCATEGORY"
      className="py-12 sm:py-20 bg-white relative overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col mb-12">
          {/* Top Row: Badge + View All Button */}
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Small Badge */}
            <div className="inline-flex items-center bg-brand-purple/5 border border-brand-purple/10 px-3 py-1 rounded-full text-brand-purple text-xs font-semibold">
              Shop by Category
            </div>

            {/* View All Button */}
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-brand-purple font-bold text-xs sm:text-sm hover:text-brand-purple/80 transition-colors group border-b border-brand-purple/20 pb-0.5"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          <div className="text-left max-w-xl">
            {/* Title */}
            <h2 className="text-3xl md:text-4xl lg:text-[40px] font-display font-semibold tracking-tight text-brand-purple leading-tight">
              Browse Pet Essentials
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-brand-brown/70 font-medium mt-3 leading-relaxed">
              Explore active categories managed from your admin panel.
            </p>
          </div>
        </div>

        {/* Categories Grid / Carousel on Mobile */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-4 pb-4 scrollbar-none snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:gap-6 sm:pb-0"
        >
          {visibleCategories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className={`group relative overflow-hidden rounded-[2.2rem] border p-6 flex flex-col items-center justify-between text-center transition-all duration-300 shadow-[0_4px_12px_rgba(75,0,75,0.02)] hover:shadow-xl hover:-translate-y-1.5 flex-shrink-0 w-[46%] snap-start sm:w-auto sm:flex-shrink-1 ${category.bgColor}`}
            >
              <div className="flex flex-col items-center w-full">
                {/* Round Cropped Image Frame */}
                <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 flex items-center justify-center bg-white flex-shrink-0">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover scale-102 group-hover:scale-108 group-hover:rotate-2 transition-all duration-500"
                    />
                  ) : (
                    <span className="text-2xl font-display font-extrabold text-brand-purple">
                      {category.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Category Name */}
                <h3 className="text-brand-purple font-display font-semibold text-base sm:text-lg mb-1 leading-tight">
                  {category.name}
                </h3>

                {/* Item Count */}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider opacity-85 ${category.textColor}`}
                >
                  {category.count}
                </span>
              </div>

              {/* Slide-up Micro Interaction Button */}
              <div className="mt-4 w-7 h-7 rounded-full bg-brand-purple text-brand-cream flex items-center justify-center translate-y-3 opacity-100 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-md">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Scroll Indicator Dots (Mobile Only) */}
        <div className="flex justify-center gap-1.5 mt-5 sm:hidden">
          {visibleCategories.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === idx
                  ? "w-4 bg-brand-purple"
                  : "w-1.5 bg-brand-purple/20"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
