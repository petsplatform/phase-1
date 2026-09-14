const tabs = ["All Orders", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function OrdersToolbar({ filter, setFilter, sort, setSort }) {
  return (
    <div className="mt-5 flex flex-col gap-4 sm:mt-6 lg:flex-row lg:items-center lg:justify-between">
      {/* Status Filter Tabs */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1 [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`h-10 shrink-0 rounded-xl px-4 text-[13px] font-extrabold transition active:scale-[0.97] ${
              filter === tab
                ? "bg-secondaryDark text-white shadow-sm"
                : "border border-borderSoft bg-white text-textMain hover:border-secondaryDark/40"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2.5 self-start pt-1 sm:pt-0 lg:self-auto">
        <span className="shrink-0 text-[13px] font-semibold text-muted">Sort by:</span>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="h-10 rounded-xl border border-borderSoft bg-white px-3 text-[13px] font-extrabold text-textMain shadow-sm outline-none focus:border-secondary"
        >
          <option>Newest First</option>
          <option>Oldest First</option>
          <option>Price: High to Low</option>
          <option>Price: Low to High</option>
        </select>
      </div>
    </div>
  );
}
