function ShopPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) {
  if (totalPages <= 1) {
    return null
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div
      className="mt-10 flex flex-col gap-4 rounded-3xl bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
      style={{ border: '1.5px solid #e7ddd0', boxShadow: '0 4px 20px rgba(28,40,33,0.06)' }}
    >
      <p className="text-sm font-semibold" style={{ color: '#6d776f' }}>
        Showing {startItem}-{endItem} of {totalItems} products
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-full px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45"
          style={{
            border: '1.5px solid #e7ddd0',
            background: '#f8f6f2',
            color: '#1d2823',
          }}
        >
          Previous
        </button>

        {pages.map((page) => {
          const isActive = page === currentPage

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={isActive ? 'page' : undefined}
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold transition"
              style={
                isActive
                  ? {
                    background: '#8a72c7',
                    color: '#fff',
                    boxShadow: '0 8px 20px rgba(138,114,199,0.28)',
                  }
                  : {
                    background: '#fff',
                    color: '#1d2823',
                    border: '1.5px solid #e7ddd0',
                  }
              }
            >
              {page}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-full px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45"
          style={{
            border: '1.5px solid #e7ddd0',
            background: '#f8f6f2',
            color: '#1d2823',
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default ShopPagination
