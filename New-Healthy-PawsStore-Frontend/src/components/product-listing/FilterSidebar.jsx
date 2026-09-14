import { motion } from "framer-motion";
import { Minus, RotateCcw } from "lucide-react";

function SectionHeader({ title }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-[15px] font-extrabold text-textMain">{title}</h3>
      <Minus size={16} className="text-textMain" />
    </div>
  );
}

function RadioRow({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-full px-3 py-2 text-left ${active ? "bg-sage/20" : ""}`}
    >
      <span
        className={`grid size-4 place-items-center rounded-full border ${active ? "border-secondary bg-secondary" : "border-muted/45"}`}
      >
        {active && <span className="size-1.5 rounded-full bg-white" />}
      </span>
      <span className="flex-1 text-[13px] font-semibold text-textMain">
        {label}
      </span>
      <span className="text-[12px] font-semibold text-muted">({count})</span>
    </button>
  );
}

export default function FilterSidebar({
  categories = [],
  filters,
  onCategoryChange,
  onMaxPriceChange,
  onClear,
}) {
  const categoryOptions = [
    {
      id: "all",
      name: "All Products",
      count: categories.reduce((sum, item) => sum + Number(item.count || 0), 0),
    },
    ...categories,
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="flex w-full shrink-0 flex-col lg:sticky lg:top-5 lg:w-[260px]"
    >
      <div className="overflow-hidden rounded-[14px] border border-borderSoft bg-white shadow-[0_10px_28px_rgba(20,61,60,0.06)]">
        {/* Categories Section - Commented out as requested */}
        {/*
        <div className="p-5">
          <SectionHeader title="Categories" />
          <div className="mt-3 space-y-1">
            {categoryOptions.map((cat) => (
              <RadioRow
                key={cat.id}
                label={cat.name}
                count={cat.count}
                active={filters.categoryId === cat.id}
                onClick={() => onCategoryChange(cat.id)}
              />
            ))}
          </div>
        </div>
        */}

        {/* Price Range Section - Commented out as requested */}
        {/*
        <div className="border-t border-borderSoft p-5">
          <SectionHeader title="Price Range" />
          <div className="mt-6">
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={filters.maxPrice}
              onChange={(event) => onMaxPriceChange(Number(event.target.value))}
              className="h-1.5 w-full accent-secondary"
              aria-label="Maximum price"
            />
            <div className="mt-4 flex items-center justify-between text-[13px] font-semibold text-textMain">
              <span>$0</span>
              <span>${filters.maxPrice}</span>
            </div>
          </div>
        </div>
        */}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="mt-7 flex h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-[10px] bg-sage/15 text-[15px] font-extrabold text-secondaryDark transition hover:bg-sage/25"
      >
        <RotateCcw size={16} />
        Clear All Filters
      </button>
    </motion.aside>
  );
}
