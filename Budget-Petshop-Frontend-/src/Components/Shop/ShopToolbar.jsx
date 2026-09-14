import { Search, SlidersHorizontal, X } from 'lucide-react'

function ShopToolbar({
  search,
  onSearchChange,
  resultCount,
  filtersOpen,
  onToggleFilters,
}) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: '#fff',
        border: '1.5px solid #e7ddd0',
        boxShadow: '0 2px 12px rgba(28,40,33,0.05)',
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1" style={{ minWidth: '180px' }}>
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: '#6d776f', pointerEvents: 'none' }}
          />
          <input
            id="shop-search"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-full bg-[#f8f6f2] py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-[#8a72c7]/30"
            style={{ color: '#1d2823', border: '1.5px solid #e7ddd0' }}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-[#f0f0f0] transition"
            >
              <X size={13} style={{ color: '#6d776f' }} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          type="button"
          id="toggle-filters-btn"
          onClick={onToggleFilters}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition active:scale-95"
          style={
            filtersOpen
              ? { background: '#8a72c7', color: '#fff', border: '1.5px solid #8a72c7', boxShadow: '0 4px 16px rgba(138,114,199,0.3)' }
              : { background: '#f8f6f2', color: '#1d2823', border: '1.5px solid #e7ddd0' }
          }
        >
          <SlidersHorizontal size={15} />
          Filters
        </button>

        {/* Result count */}
        <span
          className="ml-auto text-sm font-semibold hidden sm:block"
          style={{ color: '#6d776f' }}
        >
          {resultCount} {resultCount === 1 ? 'product' : 'products'}
        </span>
      </div>
    </div>
  )
}

export default ShopToolbar
