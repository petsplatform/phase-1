import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-brand-border/50 pb-4 mb-4 last:mb-0 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center justify-between w-full text-left mb-2 group"
      >
        <span className="font-heading font-bold text-sm text-brand-text group-hover:text-brand-teal transition-colors">
          {title}
        </span>
        {open ? (
          <ChevronUp size={15} className="text-brand-muted" />
        ) : (
          <ChevronDown size={15} className="text-brand-muted" />
        )}
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}

function CheckRow({ label, checked, onChange, count }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
      <span
        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
          checked ? 'bg-brand-teal border-brand-teal' : 'border-brand-border group-hover:border-brand-teal'
        }`}
      >
        {checked && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="font-sans text-xs text-brand-text group-hover:text-brand-teal transition-colors flex-1">
        {label}
      </span>
      {count !== undefined && (
        <span className="font-sans text-[10px] text-brand-muted bg-brand-border/60 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </label>
  );
}

export default function FilterSidebar({ filters, onFilterChange, onClearAll, productCounts }) {
  const categories = Object.keys(productCounts?.categories || {});
  const activeCount =
    (filters.categories?.length || 0) +
    (filters.minPrice > 0 || filters.maxPrice < 200 ? 1 : 0);

  const toggleCategory = (category) => {
    const current = filters.categories || [];
    const updated = current.includes(category)
      ? current.filter((value) => value !== category)
      : [...current, category];
    onFilterChange('categories', updated);
  };

  return (
    <aside className="w-full bg-brand-surface rounded-2xl border border-brand-border/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading font-black text-base text-brand-text">Filters</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs font-sans font-semibold text-brand-coral hover:text-brand-coral-dark transition-colors"
          >
            <X size={12} />
            Clear All ({activeCount})
          </button>
        )}
      </div>

      {/* Category filter section commented out as requested */}
      {/*
      <FilterSection title="Category">
        {categories.map((category) => (
          <CheckRow
            key={category}
            label={category}
            checked={(filters.categories || []).includes(category)}
            onChange={() => toggleCategory(category)}
            count={productCounts?.categories?.[category]}
          />
        ))}
      </FilterSection>
      */}

      {/* Price Range filter section commented out as requested */}
      {/*
      <FilterSection title="Price Range">
        <div className="px-1">
          <div className="flex justify-between text-xs font-sans text-brand-muted mb-2">
            <span>${filters.minPrice ?? 0}</span>
            <span>${filters.maxPrice ?? 200}</span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            step={5}
            value={filters.maxPrice ?? 200}
            onChange={(event) => onFilterChange('maxPrice', Number(event.target.value))}
            className="w-full accent-brand-teal cursor-pointer"
          />
        </div>
      </FilterSection>
      */}
    </aside>
  );
}
