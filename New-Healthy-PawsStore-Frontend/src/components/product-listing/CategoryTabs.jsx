import { useEffect, useMemo, useRef } from "react";
import { PawPrint } from "lucide-react";

function getCategoryImage(category = {}) {
  return (
    category.image ||
    category.imageUrl ||
    category.thumbnail ||
    category.iconImage ||
    ""
  );
}

export default function CategoryTabs({
  categories = [],
  activeCategoryId,
  onCategoryChange,
}) {
  const activeTabRef = useRef(null);
  const firstCategoryImage = getCategoryImage(categories[0]);
  const tabs = useMemo(() => {
    const visibleCategories = categories.slice(0, 5);
    const activeCategory = categories.find(
      (category) => category.id === activeCategoryId,
    );
    const shouldAppendActiveCategory =
      activeCategory &&
      activeCategoryId !== "all" &&
      !visibleCategories.some((category) => category.id === activeCategoryId);
    const tabCategories = shouldAppendActiveCategory
      ? [...visibleCategories, activeCategory]
      : visibleCategories;

    return [
      { id: "all", name: "All", sub: "Products", image: firstCategoryImage },
      ...tabCategories.map((category) => ({
        id: category.id,
        name: category.name,
        sub: `${category.count || 0} items`,
        image: getCategoryImage(category),
      })),
    ];
  }, [activeCategoryId, categories, firstCategoryImage]);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategoryId, tabs]);

  return (
    <div className="mb-5 flex gap-2.5 overflow-x-auto pb-2 [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={activeCategoryId === tab.id ? activeTabRef : null}
          type="button"
          onClick={() => onCategoryChange(tab.id)}
          aria-pressed={activeCategoryId === tab.id}
          className={`relative flex h-[62px] min-w-[136px] shrink-0 items-center justify-between gap-2 rounded-xl border px-3 text-left shadow-[0_4px_16px_rgba(20,61,60,0.05)] transition active:scale-[0.98] sm:h-[68px] sm:min-w-[165px] sm:px-3.5 ${
            activeCategoryId === tab.id
              ? "border-secondary bg-secondary text-white"
              : "border-borderSoft bg-white text-textMain hover:border-secondary/50"
          }`}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-extrabold leading-snug sm:text-[13px]">
              {tab.name}
            </span>
            <span className="mt-0.5 block truncate text-[10px] font-semibold opacity-85 sm:text-[11px]">
              {tab.sub}
            </span>
          </span>
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sageLight/60 sm:size-11">
            {tab.image ? (
              <img
                src={tab.image}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <PawPrint size={18} className="text-secondaryDark" fill="currentColor" />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
