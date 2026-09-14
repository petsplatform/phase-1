import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { productApi } from "../../api/productApi";

const layoutClasses = [
  "lg:col-span-7 h-[320px]",
  "lg:col-span-5 h-[320px]",
  "lg:col-span-4 h-[260px]",
  "lg:col-span-8 h-[260px]",
];

const apiOrigin = (() => {
  try {
    return import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : "";
  } catch {
    return "";
  }
})();

const resolveImageUrl = (image) => {
  if (!image) return "";
  if (/^(https?:)?\/\//i.test(image) || image.startsWith("data:")) return image;
  if (!apiOrigin) return image;
  return `${apiOrigin}${image.startsWith("/") ? "" : "/"}${image}`;
};

function CategoryCard({ category, index }) {
  const productCount = Number(category?._count?.products || category?.productCount || 0);
  const title = category.name || category.title || "Pet Supplies";
  const description =
    category.description ||
    `${productCount} ${productCount === 1 ? "product" : "products"} available in this category.`;
  const image = resolveImageUrl(category.image || category.thumbnail);
  const className = layoutClasses[index % layoutClasses.length];
  const categoryKey = category.id || title;

  return (
    <Link
      to={`/shop?category=${encodeURIComponent(categoryKey)}`}
      className={`group relative min-h-[360px] overflow-hidden rounded-[24px] shadow-[0_18px_45px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.2)] ${className}`}
      aria-label={`Shop ${title}`}
    >
      <img
        src={image}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

      <div className="absolute bottom-7 left-7 right-7 z-10 text-white">
        <h3 className="max-w-md text-3xl leading-tight md:text-4xl">
          {title}
        </h3>

        <p className="mt-3 max-w-md text-sm font-medium leading-6 text-white/90">
          {description}
        </p>

        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black shadow-lg transition group-hover:-translate-y-0.5 group-hover:gap-3">
          Shop Now
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

function CategorySection() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    productApi
      .getCategories()
      .then((items) => {
        if (!isMounted) return;
        setCategories(Array.isArray(items) ? items : []);
      })
      .catch((error) => {
        console.error("Failed to load home categories:", error);
        if (isMounted) setCategories([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category?.name && category?.image).slice(0, 4),
    [categories],
  );

  if (!isLoading && visibleCategories.length === 0) return null;

  return (
    <section className="py-16" id="shop-by-category">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-8">
        <div className="mb-10 text-center">
          <span className="rounded-full px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary">
            Shop by Category
          </span>
          <h2 className="mt-5 text-3xl text-[#171717] md:text-5xl">
            Everything Your Pet Needs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[#6B6B6B] md:text-base">
            Explore food, wellness, pharmacy and essentials curated for happy,
            healthy pets.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className={`min-h-[260px] animate-pulse rounded-[24px] border border-outline bg-surface-soft ${layoutClasses[index]}`}
                />
              ))
            : visibleCategories.map((category, index) => (
                <CategoryCard
                  key={category.id || category.name}
                  category={category}
                  index={index}
                />
              ))}
        </div>
      </div>
    </section>
  );
}

export default CategorySection;
