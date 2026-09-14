import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { SORT_OPTIONS } from '../../data/shopSortOptions';

export default function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 px-3.5 bg-brand-surface border border-brand-border/70 rounded-xl text-xs font-sans font-semibold text-brand-text hover:border-brand-teal transition-all duration-200 whitespace-nowrap shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-brand-muted">Sort:</span>
        <span className="text-brand-text">{selected.label}</span>
        <ChevronDown
          size={13}
          className={`text-brand-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-48 bg-brand-surface border border-brand-border/60 rounded-xl shadow-xl z-30 overflow-hidden py-1"
        >
          {SORT_OPTIONS.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-xs font-sans transition-colors ${
                value === opt.value
                  ? 'bg-brand-teal/10 text-brand-teal font-semibold'
                  : 'text-brand-text hover:bg-brand-peach'
              }`}
            >
              {opt.label}
              {value === opt.value && <Check size={12} className="text-brand-teal" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
