import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDownIcon,
  PackageIcon,
  PawIcon,
  PillIcon,
  XIcon,
} from "./common/HeaderIcons";

const sectionDefaults = {
  Categories: true,
  "Pet Type": true,
  "Price Range": true,
  Availability: true,
};

const categoryIcons = [PawIcon, PawIcon, PillIcon, PackageIcon, PawIcon, PackageIcon];

const FilterSection = ({ title, children }) => {
  const [open, setOpen] = useState(sectionDefaults[title] ?? true);

  return (
    <section className="border-b border-[#17345f1a] last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-extrabold text-[#122a50]"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
};

const ProductFilters = ({
  categories = [],
  drawer = false,
  onClose,
  showCategories = true,
  activeCategory = "",
  petTypes = [],
  filters = { minPrice: "", maxPrice: "", inStock: "", petType: "" },
  onApplyFilters,
  onResetFilters,
}) => {
  const [minPrice, setMinPrice] = useState(filters.minPrice);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);
  const [inStock, setInStock] = useState(filters.inStock);
  const [petType, setPetType] = useState(filters.petType || "");

  const categoryItems = [
    {
      name: "Shop All",
      count: categories.reduce((total, category) => total + category.count, 0),
      to: "/products",
    },
    ...categories.map((category) => ({
      ...category,
      to: `/products?category=${encodeURIComponent(category.name)}`,
    })),
  ];

  const handleReset = () => {
    setMinPrice("");
    setMaxPrice("");
    setInStock("");
    setPetType("");
    onResetFilters?.();
  };

  const handleApply = () => {
    onApplyFilters?.({ minPrice, maxPrice, inStock, petType });
  };

  return (
    <aside
      className={`${drawer ? "flex h-full flex-col" : "sticky top-5"} w-full`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#17345f1a] bg-white shadow-[0_8px_24px_rgba(18,42,80,0.06)]">
        {drawer && (
          <div className="flex items-center justify-between border-b border-[#17345f1a] px-5 py-4">
            <h2 className="text-lg font-extrabold text-[#122a50]">Filters</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-extrabold text-[#d9aa3d] transition-colors hover:bg-[#f8f1df]"
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#17345f1a] text-[#122a50] transition-colors hover:border-[#d9aa3d] hover:text-[#d9aa3d]"
                onClick={onClose}
                aria-label="Close filters"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {showCategories && (
            <FilterSection title="Categories">
              <div className="space-y-1">
                {categoryItems.map((category, index) => {
                  const Icon =
                    category.name === "Shop All"
                      ? PackageIcon
                      : categoryIcons[index - 1] || PackageIcon;
                  const isActive =
                    category.name === "Shop All"
                      ? !activeCategory
                      : activeCategory === category.name;
                  return (
                    <Link
                      key={category.name}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-[#f8f1df] text-[#17345f]"
                          : "text-[#122a50] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
                      }`}
                      to={category.to}
                      onClick={onClose}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{category.name}</span>
                      </span>
                      <span className="text-[11px] font-extrabold text-[#122a50b2]">
                        {category.count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </FilterSection>
          )}

          {petTypes.length > 0 && (
            <FilterSection title="Pet Type">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-xs font-extrabold transition-colors ${
                    !petType
                      ? "border-[#d9aa3d] bg-[#f8f1df] text-[#17345f]"
                      : "border-[#17345f1a] text-[#122a50] hover:border-[#d9aa3d] hover:bg-[#f8f1df]"
                  }`}
                  onClick={() => setPetType("")}
                >
                  All Pets
                </button>
                {petTypes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-xs font-extrabold transition-colors ${
                      petType === item
                        ? "border-[#d9aa3d] bg-[#f8f1df] text-[#17345f]"
                        : "border-[#17345f1a] text-[#122a50] hover:border-[#d9aa3d] hover:bg-[#f8f1df]"
                    }`}
                    onClick={() => setPetType(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          <FilterSection title="Price Range">
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="block">
                <span className="block text-[10px] font-bold uppercase text-[#122a50b2]">
                  Min $
                </span>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-lg border border-[#17345f1a] px-3 py-2 text-sm font-extrabold text-[#122a50] outline-none focus:border-[#d9aa3d]"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] font-bold uppercase text-[#122a50b2]">
                  Max $
                </span>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="Any"
                  className="mt-1 w-full rounded-lg border border-[#17345f1a] px-3 py-2 text-sm font-extrabold text-[#122a50] outline-none focus:border-[#d9aa3d]"
                />
              </label>
            </div>
          </FilterSection>

        </div>

        {drawer && (
          <div className="border-t border-[#17345f1a] bg-white p-4">
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#17345f] text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(18,42,80,0.24)] transition-colors hover:bg-[#d9aa3d]"
              onClick={() => {
                handleApply();
                onClose?.();
              }}
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ProductFilters;
