import React from 'react';
import { SearchX, RefreshCw } from 'lucide-react';

export default function EmptyState({
  onClearFilters,
  title = 'No Products Found',
  message = "We couldn't find any products matching your current filters. Try adjusting or clearing your search criteria.",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-brand-peach flex items-center justify-center mb-5 shadow-inner">
        <SearchX size={36} className="text-brand-muted" />
      </div>

      {/* Text */}
      <h3 className="font-heading font-black text-xl text-brand-text mb-2">
        {title}
      </h3>
      <p className="font-sans text-sm text-brand-muted max-w-xs leading-relaxed">
        {message}
      </p>

      {/* CTA */}
      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white font-heading font-black text-sm rounded-xl hover:bg-brand-deep-teal active:scale-95 transition-all duration-200 shadow-sm"
        >
          <RefreshCw size={14} />
          Clear All Filters
        </button>
      )}
    </div>
  );
}
