import { ChevronLeft, ChevronRight } from "lucide-react";

function buildPages(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("start-dots");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push("end-dots");
  pages.push(totalPages);

  return pages;
}

export default function Pagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  const pages = buildPages(page, totalPages);

  return (
    <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="grid size-10 place-items-center rounded-[8px] border border-borderSoft bg-white text-muted transition hover:border-secondary hover:text-secondaryDark disabled:cursor-not-allowed disabled:opacity-45"
      >
        <ChevronLeft size={17} />
      </button>

      {pages.map((pageNumber, index) =>
        typeof pageNumber === "string" ? (
          <span key={`dots-${index}`} className="grid size-10 place-items-center text-[14px] font-bold text-muted">
            ...
          </span>
        ) : (
          <button
            key={pageNumber}
            type="button"
            aria-label={`Page ${pageNumber}`}
            aria-current={pageNumber === page ? "page" : undefined}
            onClick={() => onPageChange(pageNumber)}
            className={`grid size-10 place-items-center rounded-[8px] text-[14px] font-extrabold transition ${
              pageNumber === page
                ? "bg-secondaryDark text-white"
                : "border border-borderSoft bg-white text-textMain hover:border-secondary hover:text-secondaryDark"
            }`}
          >
            {pageNumber}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="grid size-10 place-items-center rounded-[8px] border border-borderSoft bg-white text-muted transition hover:border-secondary hover:text-secondaryDark disabled:cursor-not-allowed disabled:opacity-45"
      >
        <ChevronRight size={17} />
      </button>

      <div className="mt-4 flex items-center gap-3 text-[13px] font-semibold text-textMain md:absolute md:right-0 md:mt-0">
        <span>Show:</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-10 rounded-[8px] border border-borderSoft bg-white px-4 font-extrabold outline-none focus:border-secondary"
          aria-label="Products per page"
        >
          {[8, 12, 16, 24].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>per page</span>
      </div>
    </div>
  );
}
