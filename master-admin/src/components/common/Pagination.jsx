import { ChevronLeft, ChevronRight } from 'lucide-react'

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, currentPage])
  if (currentPage > 1) pages.add(currentPage - 1)
  if (currentPage < totalPages) pages.add(currentPage + 1)

  if (currentPage <= 4) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
    pages.add(5)
  }

  if (currentPage >= totalPages - 3) {
    pages.add(totalPages - 1)
    pages.add(totalPages - 2)
    pages.add(totalPages - 3)
    pages.add(totalPages - 4)
  }

  const sorted = [...pages]
    .filter(page => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  return sorted.reduce((items, page, index) => {
    const previous = sorted[index - 1]
    if (previous && page - previous > 1) items.push(`ellipsis-${previous}-${page}`)
    items.push(page)
    return items
  }, [])
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className = ''
}) {
  if (totalPages <= 1) return null

  const visiblePages = getVisiblePages(currentPage, totalPages)
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div
      className={`px-5 py-3 border-t flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
      style={{ borderColor: 'var(--border-color)' }}
    >
      <p className="text-xs text-[var(--text-muted)] whitespace-nowrap">
        Showing {startItem}-{endItem} of {totalItems}
      </p>

      <div className="flex flex-wrap items-center gap-1 sm:justify-end">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--accent-gold-soft)] disabled:opacity-40 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {visiblePages.map(item => (
          typeof item === 'number' ? (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${currentPage === item ? 'text-white' : 'text-[var(--text-muted)] hover:bg-[var(--accent-gold-soft)]'}`}
              style={currentPage === item ? { background: 'var(--primary)' } : {}}
              aria-current={currentPage === item ? 'page' : undefined}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="w-7 h-7 flex items-center justify-center text-xs font-bold text-[var(--text-soft)]">
              ...
            </span>
          )
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--accent-gold-soft)] disabled:opacity-40 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
