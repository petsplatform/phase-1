import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../../api/productApi";

const fallbackCategories = [
  { name: "Dog Care", image: "/images/img__7.png" },
  { name: "Cat Care", image: "/images/img__8.png" },
  { name: "Pet Travel", image: "/images/img__9.png" },
  { name: "Wellness", image: "/images/img__10.png" },
];

function normalizeCategory(category = {}, index = 0) {
  const fallback = fallbackCategories[index % fallbackCategories.length];
  return {
    id: category.id || category.name || fallback.name,
    name: category.name || fallback.name,
    image: category.image || category.imageUrl || fallback.image,
  };
}

function CategoryCard({ category, wide = false }) {
  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.name)}`}
      className={`group relative overflow-hidden rounded-[24px] bg-[#f7f1e8] shadow-[0_18px_42px_rgba(18,42,80,0.08)] ${
        wide
          ? "min-h-[300px] sm:min-h-[350px] md:min-h-[280px] lg:col-span-3 lg:min-h-[250px]"
          : "min-h-[300px] sm:min-h-[350px] md:min-h-[280px] lg:min-h-[464px]"
      }`}
      aria-label={`Shop ${category.name}`}
    >
      <img
        src={category.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-black/10" />
      <div className="relative z-10 flex h-full min-h-[inherit] items-start justify-between p-6 sm:p-7 lg:p-[30px]">
        <h3
          className="max-w-[70%] text-lg font-medium text-white sm:text-xl"
          style={{
            fontFamily: "Plus Jakarta Sans",
            lineHeight: "26px",
          }}
        >
          {category.name}
        </h3>
        <span className="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#111111] shadow-[0_12px_26px_rgba(18,42,80,0.16)] transition group-hover:-translate-y-0.5 group-hover:bg-[#17345f] group-hover:text-white">
          <img
            src="/images/img_send.svg"
            alt=""
            className="size-[22px] transition group-hover:invert"
            width={22}
            height={22}
          />
        </span>
      </div>
    </Link>
  );
}

function Categories() {
  const [categories, setCategories] = useState(fallbackCategories);

  useEffect(() => {
    let active = true;

    productApi
      .getCategories()
      .then((result) => {
        if (!active) return;
        const nextCategories = Array.isArray(result)
          ? result.slice(0, 4).map(normalizeCategory)
          : [];
        setCategories(nextCategories.length ? nextCategories : fallbackCategories);
      })
      .catch(() => {
        if (active) setCategories(fallbackCategories);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleCategories = useMemo(
    () => categories.slice(0, 4).map(normalizeCategory),
    [categories],
  );

  return (
    <section className="w-full px-4 sm:px-5 lg:px-5 mt-20 sm:mt-24 md:mt-28 lg:mt-[160px]">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-12 sm:gap-14 md:gap-16">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-col gap-4">
            <h2
              className="text-[28px] font-semibold leading-tight sm:text-[36px] md:text-[40px] lg:text-[45px]"
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontWeight: "600",
                lineHeight: "1.27",
                color: "#122a50",
              }}
            >
              Curated Categories for Every Space
            </h2>
            <p
              className="max-w-2xl text-sm sm:text-base"
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontSize: "16px",
                fontWeight: "400",
                lineHeight: "26px",
                color: "#122a50b2",
              }}
            >
              Discover pet collections thoughtfully designed for every care
              routine. From cozy beds to feeding sets, grooming kits, and travel
              essentials.
            </p>
          </div>

          <Link
            to="/products"
            className="flex items-center justify-center gap-2 rounded-[24px] bg-button-bg-primary px-6 py-3 text-button-text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 sm:px-8 lg:px-[50px]"
            style={{
              fontFamily: "Plus Jakarta Sans",
              fontSize: "16px",
              fontWeight: "600",
              lineHeight: "21px",
            }}
          >
            <span>View All Categories</span>
            <img
              src="/images/img_arrowright_white_a700.svg"
              alt=""
              className="size-5"
              width={20}
              height={20}
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleCategories.map((category, index) => (
            <CategoryCard
              key={category.id || category.name}
              category={category}
              wide={index === 3}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Categories;
