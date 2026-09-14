import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function CartActions({
  count,
  allSelected,
  selectedCount,
  onSelectAll,
  onRemoveSelected,
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-borderSoft px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-5">
      <label className="inline-flex items-center gap-3 text-[14px] font-semibold text-textMain">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(event) => onSelectAll(event.target.checked)}
          className="size-5 rounded border-borderSoft accent-secondaryDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        />
        Select All ({count})
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onRemoveSelected}
          disabled={selectedCount === 0}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-semibold text-textMain transition hover:bg-sageLight disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <Trash2 size={17} />
          Remove Selected
        </button>
        <Link
          to="/products"
          className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-lg border border-borderSoft bg-white px-5 text-[14px] font-extrabold text-textMain transition hover:bg-sageLight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
