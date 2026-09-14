import React from 'react';
import { Search, SlidersHorizontal, LayoutGrid, List, X } from 'lucide-react';
import SortDropdown from './SortDropdown';

export default function ShopToolbar({
  totalCount,
  search,
  onSearchChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenMobileFilter,
  activeFilterCount,
  loading = false,
}) {
  return (
    <div className="bg-brand-surface border border-brand-border/50 rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3 justify-between flex-wrap sm:flex-nowrap">

        {/* Left: Mobile filter button + Count */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile filter button */}
          <button
            type="button"
            onClick={onOpenMobileFilter}
            className="lg:hidden flex items-center gap-1.5 h-9 px-3.5 bg-brand-teal text-white font-heading font-bold text-xs rounded-xl hover:bg-brand-deep-teal active:scale-95 transition-all duration-200 shrink-0 relative"
            aria-label="Open filters"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-coral text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Count */}
          <p className="font-sans text-xs text-brand-muted shrink-0">
            {loading ? (
              <span className="font-heading font-bold text-brand-teal text-xs animate-pulse">Loading products...</span>
            ) : (
              <>
                <span className="font-heading font-black text-brand-text text-sm">{totalCount}</span>
                {' '}product{totalCount !== 1 ? 's' : ''} found
              </>
            )}
          </p>
        </div>

        {/* Middle: Search input — grows to fill remaining space */}
        <div className="relative flex-1 min-w-[160px] sm:min-w-[200px] w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full h-9 pl-8 pr-8 bg-brand-bg border border-brand-border/60 rounded-xl text-xs font-sans text-brand-text placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-teal transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-coral transition-colors"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Right End: Sort Dropdown + View Mode Toggle */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          <SortDropdown value={sort} onChange={onSortChange} />

          {/* View mode toggle */}
          <div className="flex items-center border border-brand-border/60 rounded-xl overflow-hidden bg-brand-bg shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`h-9 w-9 flex items-center justify-center transition-colors ${
                viewMode === 'grid'
                  ? 'bg-brand-teal text-white'
                  : 'text-brand-muted hover:text-brand-teal hover:bg-brand-peach'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={`h-9 w-9 flex items-center justify-center transition-colors ${
                viewMode === 'list'
                  ? 'bg-brand-teal text-white'
                  : 'text-brand-muted hover:text-brand-teal hover:bg-brand-peach'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
