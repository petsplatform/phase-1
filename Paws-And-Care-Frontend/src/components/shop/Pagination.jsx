import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Build page number list with ellipsis
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (
      (i === currentPage - 2 && i > 1) ||
      (i === currentPage + 2 && i < totalPages)
    ) {
      pages.push('…');
    }
  }

  // Deduplicate consecutive ellipses
  const dedupedPages = pages.filter((p, idx) => !(p === '…' && pages[idx - 1] === '…'));

  return (
    <nav aria-label="Product pagination" className="flex items-center justify-center gap-1.5 mt-8">
      {/* Previous */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-brand-border/60 bg-brand-surface text-brand-muted hover:border-brand-teal hover:text-brand-teal disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
      >
        <ChevronLeft size={15} />
      </button>

      {/* Page numbers */}
      {dedupedPages.map((p, idx) =>
        p === '…' ? (
          <span key={`ellipsis-${idx}`} className="w-9 text-center font-sans text-sm text-brand-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border font-heading font-black text-sm transition-all duration-200 ${
              p === currentPage
                ? 'bg-brand-teal border-brand-teal text-white shadow-sm'
                : 'border-brand-border/60 bg-brand-surface text-brand-muted hover:border-brand-teal hover:text-brand-teal'
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-brand-border/60 bg-brand-surface text-brand-muted hover:border-brand-teal hover:text-brand-teal disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}
