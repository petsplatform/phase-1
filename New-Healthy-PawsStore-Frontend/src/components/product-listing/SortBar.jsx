import { LayoutGrid, List } from "lucide-react";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Product Name" },
  { value: "rating_desc", label: "Highest Rated" },
];

export default function SortBar({ view, onViewChange, sort, onSortChange }) {
  return (
    <div className="flex w-full items-center justify-end gap-2">
      <span className="hidden sm:inline shrink-0 text-[13px] font-semibold text-textMain">Sort by:</span>
      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-borderSoft bg-white px-3 text-[13px] font-extrabold text-textMain shadow-sm outline-none focus:border-secondary sm:w-auto sm:min-w-[180px]"
        aria-label="Sort products"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
