import { PackageX } from 'lucide-react'

function ShopEmptyState({ onClearFilters }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
        style={{ background: '#f4efe6' }}
      >
        <PackageX size={40} style={{ color: '#6d776f' }} />
      </div>
      <h3 className="text-xl font-bold" style={{ color: '#1d2823' }}>
        No products found
      </h3>
      <p className="mt-2 max-w-xs text-sm" style={{ color: '#6d776f' }}>
        Try adjusting your filters or searching for something different.
      </p>
      <button
        type="button"
        id="clear-filters-btn"
        onClick={onClearFilters}
        className="mt-6 rounded-full px-6 py-3 text-sm font-bold text-white transition active:scale-95"
        style={{ background: '#8a72c7', boxShadow: '0 4px 16px rgba(138,114,199,0.3)' }}
      >
        Clear All Filters
      </button>
    </div>
  )
}

export default ShopEmptyState
