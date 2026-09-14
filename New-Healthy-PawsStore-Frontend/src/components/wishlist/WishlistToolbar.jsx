import { Grid2X2, List } from "lucide-react";

const sortOptions = [
  "Recently Added",
  "Price: Low to High",
  "Price: High to Low",
  "Product Name",
  "Highest Rated",
];

export default function WishlistToolbar({ view, onViewChange, sort, onSort }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-t-[18px] bg-white px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="inline-flex rounded-lg border border-borderSoft bg-white p-1">
        <button
          type="button"
          aria-label="Show wishlist as grid"
          onClick={() => onViewChange("grid")}
          className={`grid size-9 place-items-center rounded-md transition sm:size-10 ${
            view === "grid"
              ? "bg-secondaryDark text-white"
              : "text-textMain hover:bg-sageLight"
          }`}
        >
          <Grid2X2 size={18} />
        </button>
        <button
          type="button"
          aria-label="Show wishlist as list"
          onClick={() => onViewChange("list")}
          className={`grid size-9 place-items-center rounded-md transition sm:size-10 ${
            view === "list"
              ? "bg-secondaryDark text-white"
              : "text-textMain hover:bg-sageLight"
          }`}
        >
          <List size={19} />
        </button>
      </div>

      <label className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-textMain sm:text-[14px]">
        <span className="shrink-0">Sort by:</span>
        <select
          value={sort}
          onChange={(event) => onSort(event.target.value)}
          className="h-9 min-w-0 rounded-xl border border-borderSoft bg-white px-3 text-[13px] font-extrabold text-textMain shadow-sm outline-none focus:border-secondary sm:h-10 sm:min-w-[170px]"
          aria-label="Sort wishlist products"
        >
          {sortOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
