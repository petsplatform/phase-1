import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

import { filterByCategory } from "../../utils/shopFilters";

function getCategoryCounts(categories = [], products = []) {
  const counts = {};
  categories.forEach((cat) => {
    counts[cat.id] =
      cat.id === "all"
        ? products.length
        : filterByCategory(products, cat.id).length;
  });
  return counts;
}

const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Fish"];
const FOOD_TYPES = ["Dry Food", "Wet Food", "Treats", "Medicine"];

function FilterSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-3 flex w-full items-center justify-between group"
      >
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-secondary">
          {title}
        </h3>
        {open ? (
          <ChevronUp size={16} className="text-secondary" />
        ) : (
          <ChevronDown size={16} className="text-secondary" />
        )}
      </button>
      {open && children}
    </section>
  );
}

function CheckRow({ id, label, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 py-2 group"
      style={{ color: "#1d2823" }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 cursor-pointer rounded"
        style={{ accentColor: "#1d2823" }}
      />
      <span className="text-sm font-medium transition-all group-hover:font-semibold">
        {label}
      </span>
    </label>
  );
}

function ShopFilterDrawer({
  isOpen,
  onClose,
  onReset,
  category,
  onCategoryChange,
  maxPrice,
  onMaxPriceChange,
  priceMax,
  onApply,
  inStock,
  outOfStock,
  onInStockChange,
  onOutOfStockChange,
  petTypes,
  onPetTypeChange,
  foodTypes,
  onFoodTypeChange,
  products = [],
  categories = [],
  isLoadingCategories = false,
}) {
  const categoryCounts = getCategoryCounts(categories, products);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden";
      return;
    }

    document.body.style.overflow = "";
  }, [isOpen]);

  useEffect(() => () => {
    document.body.style.overflow = "";
  }, []);

  if (!shouldRender) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="shop-filter-drawer"
        aria-label="Product filters"
        aria-hidden={!isOpen}
        onTransitionEnd={() => {
          if (!isOpen) setShouldRender(false);
        }}
        className={`fixed inset-y-0 right-0 z-50 flex h-dvh max-w-full flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-out ${
          isOpen
            ? "translate-x-0 visible pointer-events-auto"
            : "translate-x-full invisible pointer-events-none"
        }`}
        style={{
          width: "min(100vw, 360px)",
          background: "#fff",
          borderLeft: "1.5px solid #e7ddd0",
        }}
      >
        <div
          className="flex flex-shrink-0 items-center justify-between px-6 py-5"
          style={{ borderBottom: "1.5px solid #f0ebe3" }}
        >
          <h2 className="text-lg font-extrabold" style={{ color: "#1d2823" }}>
            Filters
          </h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              id="filter-reset-btn"
              onClick={onReset}
              className="text-sm font-bold transition hover:opacity-70"
              style={{ color: "#8a72c7" }}
            >
              Reset
            </button>
            <button
              type="button"
              id="filter-close-btn"
              onClick={onClose}
              aria-label="Close filters"
              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#f4efe6]"
              style={{ color: "#1d2823" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          <FilterSection title="Categories">
            <ul className="flex flex-col gap-0.5">
              {isLoadingCategories
                ? Array.from({ length: 5 }).map((_, index) => (
                    <li key={index}>
                      <div className="h-10 animate-pulse rounded-xl bg-[#f4efe6]" />
                    </li>
                  ))
                : categories.map((cat) => {
                    const isActive = category === cat.id;
                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          id={`drawer-cat-${cat.id}`}
                          onClick={() => onCategoryChange(cat.id)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[.98]"
                          style={
                            isActive
                              ? { background: "#f4efe6", color: "#1d2823" }
                              : { background: "transparent", color: "#4a5649" }
                          }
                        >
                          <span className="flex-1 text-left">{cat.label}</span>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                            style={
                              isActive
                                ? { background: "#1d2823", color: "#fff" }
                                : { background: "#f0ebe3", color: "#6d776f" }
                            }
                          >
                            {categoryCounts[cat.id] ?? 0}
                          </span>
                        </button>
                      </li>
                    );
                  })}
            </ul>
          </FilterSection>

          <div style={{ borderTop: "1.5px solid #f0ebe3" }} />

          <FilterSection title="Availability">
            <CheckRow
              id="avail-in-stock"
              label="In Stock"
              checked={inStock}
              onChange={(e) => onInStockChange(e.target.checked)}
            />
            <CheckRow
              id="avail-out-of-stock"
              label="Out of Stock"
              checked={outOfStock}
              onChange={(e) => onOutOfStockChange(e.target.checked)}
            />
          </FilterSection>

          <div style={{ borderTop: "1.5px solid #f0ebe3" }} />

          <FilterSection title="Pet Type">
            {PET_TYPES.map((pet) => (
              <CheckRow
                key={pet}
                id={`pet-type-${pet.toLowerCase()}`}
                label={pet}
                checked={petTypes.includes(pet)}
                onChange={() => onPetTypeChange(pet)}
              />
            ))}
          </FilterSection>

          <div style={{ borderTop: "1.5px solid #f0ebe3" }} />

          <FilterSection title="Price" defaultOpen={false}>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max={priceMax || 0}
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(Number(e.target.value))}
                className="w-full cursor-pointer"
                style={{ accentColor: "#8a72c7" }}
              />
              <div className="flex items-center justify-between text-sm font-semibold text-[#6d776f]">
                <span>$0</span>
                <span>${Number(maxPrice || 0).toFixed(0)}</span>
              </div>
            </div>
          </FilterSection>
        </div>

        <div
          className="flex-shrink-0 bg-white px-6 py-5"
          style={{ borderTop: "1.5px solid #f0ebe3" }}
        >
          <button
            type="button"
            onClick={onApply}
            className="w-full rounded-full px-5 py-3 text-sm font-extrabold text-white transition active:scale-95"
            style={{
              background: "#8a72c7",
              boxShadow: "0 4px 16px rgba(138,114,199,0.3)",
            }}
          >
            Apply Filters
          </button>
        </div>
      </aside>
    </>
  );
}

export default ShopFilterDrawer;
