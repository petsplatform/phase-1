import React, { useState, useRef, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { categories as staticCategories } from "../../data/category";
import { getCategoriesApi } from "../../helper/axiosInstance";

export default function CategorySection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    let active = true;
    getCategoriesApi()
      .then((res) => {
        if (active) {
          // The API response structure is { success: true, data: [...] }
          const fetchedCategories = res.data || [];
          if (fetchedCategories.length > 0) {
            // Map backend category format to match the view's properties: id, label, image
            const mapped = fetchedCategories.map((cat, idx) => {
              // Map static images to first few categories if needed, or use the database image
              // Since the database provides a real image URL, we use that first, fallback to static mapping.
              const fallbackImage =
                staticCategories[idx % staticCategories.length]?.image;
              return {
                id: cat.id,
                label: cat.name,
                image: cat.image || fallbackImage,
              };
            });
            setCategories(mapped);
          } else {
            setCategories(staticCategories);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        if (active) {
          setCategories(staticCategories);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      if (clientWidth > 0) {
        const index = Math.round(scrollLeft / clientWidth);
        setActiveIndex(index);
      }
    }
  };

  // Limit categories on Home page section to top 6 items
  const displayCategories = categories.slice(0, 6);

  // Group categories into pages of 2 items for mobile carousel
  const categoryPages = [];
  for (let i = 0; i < displayCategories.length; i += 2) {
    categoryPages.push(displayCategories.slice(i, i + 2));
  }

  return (
    <section id="categories" className="relative py-16 lg:py-24 bg-white">
      {/* Subtle decorations */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-soft-mint/20 to-transparent -z-10" />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-green/20 bg-emerald-50/80 px-3.5 py-1.5 shadow-xs backdrop-blur-md">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-dark-green">
                Vet-Recommended Remedies
              </span>
            </div>

            <a
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-deep-navy/10 text-xs sm:text-sm font-extrabold text-deep-navy bg-white hover:bg-deep-navy hover:text-white transition-all duration-300 group"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
          </div>

          <h2 className="font-display text-[2.2rem] font-extrabold leading-[1.1] tracking-tight text-deep-navy sm:text-[3rem] lg:text-[3.2rem]">
            Shop by Health Category
          </h2>

          <p className="mt-4 text-base font-medium leading-relaxed text-deep-navy/70 max-w-2xl">
            Select a specific health category below to explore certified
            prescription medications, therapeutic diets, and daily wellness
            supplements.
          </p>
        </div>

        {loading ? (
          /* Categories Skeleton Loading */
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 justify-items-center animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="flex flex-col items-center max-w-[160px] w-full"
              >
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] bg-slate-100 border border-slate-100" />
                <div className="h-4 bg-slate-100 rounded w-2/3 mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Categories Layout (Desktop & Tablet: visible on md and up) */}
            <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 justify-items-center">
              {displayCategories.map(({ id, label, image }) => (
                <a
                  key={id}
                  href={`/products?category=${id}`}
                  className="group flex flex-col items-center cursor-pointer max-w-[160px]"
                >
                  {/* Squircle Image Card */}
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] border border-deep-navy/8 bg-white shadow-soft transition-all duration-500 overflow-hidden relative group-hover:border-primary-green group-hover:shadow-[0_16px_32px_rgba(15,45,82,0.12)] group-hover:-translate-y-1.5 flex items-center justify-center">
                    <img
                      src={image}
                      alt={label}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>

                  {/* Centered Name Label */}
                  <span className="mt-4 text-center font-extrabold text-deep-navy group-hover:text-primary-green transition-colors duration-300 text-sm sm:text-base tracking-tight leading-tight">
                    {label}
                  </span>
                </a>
              ))}
            </div>

            {/* Categories Carousel (Mobile only: hidden on md and up) */}
            <div className="md:hidden flex flex-col items-center">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none gap-6 pb-6"
              >
                {categoryPages.map((page, pageIdx) => (
                  <div
                    key={pageIdx}
                    className="w-full shrink-0 snap-start flex justify-center gap-6"
                  >
                    {page.map(({ id, label, image }) => (
                      <a
                        key={id}
                        href={`/products?category=${id}`}
                        className="group flex flex-col items-center cursor-pointer w-[42%] max-w-[140px]"
                      >
                        {/* Squircle Image Card */}
                        <div className="w-24 h-24 rounded-[1.8rem] border border-deep-navy/8 bg-white shadow-soft overflow-hidden relative flex items-center justify-center">
                          <img
                            src={image}
                            alt={label}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        </div>

                        {/* Centered Name Label */}
                        <span className="mt-3 text-center font-extrabold text-deep-navy text-xs tracking-tight leading-tight line-clamp-2">
                          {label}
                        </span>
                      </a>
                    ))}
                  </div>
                ))}
              </div>

              {/* Dots Navigation */}
              <div className="flex gap-2.5 mt-2">
                {categoryPages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (scrollRef.current) {
                        const clientWidth = scrollRef.current.clientWidth;
                        scrollRef.current.scrollTo({
                          left: index * clientWidth,
                          behavior: "smooth",
                        });
                        setActiveIndex(index);
                      }
                    }}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                      activeIndex === index
                        ? "bg-primary-green scale-110"
                        : "bg-primary-green/20"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
