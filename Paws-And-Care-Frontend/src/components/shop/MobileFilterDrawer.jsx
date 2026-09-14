import React, { useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import FilterSidebar from './FilterSidebar';

export default function MobileFilterDrawer({ isOpen, onClose, filters, onFilterChange, onClearAll, productCounts }) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 bg-brand-text/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter Products"
        className={`fixed top-0 left-0 h-full w-80 max-w-[90vw] bg-brand-bg z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border/60 bg-brand-peach shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-brand-teal" />
            <span className="font-heading font-black text-base text-brand-text">Filters</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-brand-border/60 transition-colors"
            aria-label="Close filter drawer"
          >
            <X size={18} className="text-brand-text" />
          </button>
        </div>

        {/* Scrollable filter content */}
        <div className="flex-1 overflow-y-auto p-4">
          <FilterSidebar
            filters={filters}
            onFilterChange={onFilterChange}
            onClearAll={onClearAll}
            productCounts={productCounts}
          />
        </div>

        {/* Footer CTA */}
        <div className="px-4 py-4 border-t border-brand-border/60 bg-brand-surface shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-brand-teal text-white font-heading font-black text-sm rounded-xl shadow-sm hover:bg-brand-deep-teal active:scale-95 transition-all duration-200"
          >
            View Results
          </button>
        </div>
      </div>
    </>
  );
}
