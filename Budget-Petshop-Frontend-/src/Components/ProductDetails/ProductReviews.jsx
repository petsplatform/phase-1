import { useState, useEffect } from "react";
import {
  MessageSquare,
  BadgeCheck,
  Star,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { reviewApi } from "../../api/reviewApi";

function RatingStars({ rating, size = 16 }) {
  const full = Math.round(Number(rating));

  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < full ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[#d6cec0]"
          }
        />
      ))}
    </span>
  );
}

function getRatingBreakdown(reviews) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const s = Math.round(Number(r.rating));
    if (s >= 1 && s <= 5) counts[s] += 1;
  });
  const total = reviews.length;
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars],
    pct: total ? (counts[stars] / total) * 100 : 0,
  }));
}

function ReviewSummaryCard({
  avgRating,
  totalReviews,
  breakdown,
  onWriteReviewClick,
}) {
  return (
    <div className="h-fit rounded-[24px] bg-[#fcfaf7] p-8 ring-1 ring-[#eee4d6] shadow-sm border border-[#f4efe6]">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f6f2eb] text-[#8a72c7]">
          <Sparkles size={14} />
        </span>
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8a72c7]">
          Reviews Overview
        </p>
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-6xl font-black text-on-background tracking-tight">
          {avgRating}
        </span>
        <span className="text-lg font-bold text-charcoal-text">/ 5.0</span>
      </div>

      <div className="mt-4">
        <RatingStars rating={avgRating} size={20} />
        <p className="mt-2.5 text-sm font-semibold text-charcoal-text">
          Based on {totalReviews} verified customer reviews
        </p>
      </div>

      <div className="mt-8 space-y-3.5">
        {breakdown.map((item) => (
          <div
            key={item.stars}
            className="grid grid-cols-[55px_1fr_40px] items-center gap-3"
          >
            <span className="text-xs font-extrabold text-on-background flex items-center gap-1">
              {item.stars}{" "}
              <Star
                size={11}
                className="fill-[#f59e0b] text-[#f59e0b] -mt-0.5"
              />
            </span>
            <div className="h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-[#eee4d6]">
              <div
                className="h-full rounded-full bg-[#8a72c7]"
                style={{ width: `${item.pct}%` }}
              />
            </div>
            <span className="text-right text-xs font-bold text-charcoal-text">
              {item.count}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onWriteReviewClick}
        className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#8a72c7] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#7a61b8] cursor-pointer shadow-md shadow-[#8a72c7]/15"
      >
        <MessageSquare size={16} />
        Write a Review
      </button>
    </div>
  );
}

export default function ProductReviews({ product, onWriteReviewClick }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setCurrentPage(1);
    if (!product?.id) return;
    let active = true;
    reviewApi
      .getProductReviews(product.id)
      .then((data) => {
        if (active) setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setReviews([]);
      });
    return () => {
      active = false;
    };
  }, [product?.id]);

  const totalReviews = reviews.length;
  const avgRating = totalReviews
    ? (
        reviews.reduce((sum, r) => sum + Number(r.rating), 0) / totalReviews
      ).toFixed(1)
    : "0.0";
  const breakdown = getRatingBreakdown(reviews);

  const reviewsPerPage = 4;
  const totalPages = Math.ceil(totalReviews / reviewsPerPage);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));

  const displayedReviews = reviews.slice(
    (activePage - 1) * reviewsPerPage,
    activePage * reviewsPerPage,
  );

  const startItem =
    totalReviews === 0 ? 0 : (activePage - 1) * reviewsPerPage + 1;
  const endItem = Math.min(activePage * reviewsPerPage, totalReviews);

  return (
    <section className="mt-12 border-t border-[#eee4d6] pt-12">
      <div className="mb-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8a72c7]">
          What Pet Parents Say
        </p>
        <h2 className="mt-2 text-3xl font-extrabold">Customer Reviews</h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Left Side: Summary Card */}
        <ReviewSummaryCard
          avgRating={avgRating}
          totalReviews={totalReviews}
          breakdown={breakdown}
          onWriteReviewClick={onWriteReviewClick}
        />

        {/* Right Side: Reviews List */}
        <div className="flex flex-col gap-6">
          {reviews.length ? (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {displayedReviews.map((rev, index) => (
                  <article
                    key={index}
                    className="rounded-[20px] bg-white p-6 ring-1 ring-[#eee4d6] transition hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(138,114,199,0.06)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#8a72c7] text-base font-extrabold text-white">
                            {rev.author.charAt(0)}
                          </div>

                          <div>
                            <p className="text-[15px] font-bold text-on-background leading-tight">
                              {rev.author}
                            </p>
                            <p className="text-[12px] text-charcoal-text mt-1">
                              {rev.date}
                            </p>
                          </div>
                        </div>

                        {rev.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#edfaf3] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary shrink-0">
                            <BadgeCheck size={13} />
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex items-center gap-2">
                        <RatingStars rating={rev.rating} size={14} />
                        <span className="text-sm font-bold text-on-background">
                          {rev.title}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-charcoal-text">
                        {rev.comment}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-[#f4efe6] pt-4 text-xs font-bold text-charcoal-text">
                      <span>Was this helpful?</span>
                      <button className="flex items-center gap-1.5 transition hover:text-[#8a72c7] hover:scale-105 cursor-pointer">
                        <ThumbsUp size={13} />
                        Helpful ({rev.helpfulCount})
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-4 rounded-[24px] bg-white p-4 border border-[#e7ddd0] shadow-[0_4px_20px_rgba(28,40,33,0.04)] sm:flex-row sm:items-center sm:justify-between mt-4">
                  <p className="text-sm font-semibold text-charcoal-text">
                    Showing {startItem}-{endItem} of {totalReviews} reviews
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(activePage - 1)}
                      disabled={activePage === 1}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7ddd0] bg-[#f8f6f2] text-on-background transition hover:bg-[#e7ddd0] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }).map((_, index) => {
                      const page = index + 1;
                      const isActive = page === activePage;

                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          aria-current={isActive ? "page" : undefined}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold transition cursor-pointer"
                          style={
                            isActive
                              ? {
                                  background: "#8a72c7",
                                  color: "#fff",
                                  boxShadow:
                                    "0 4px 12px rgba(138,114,199,0.25)",
                                }
                              : {
                                  background: "#fff",
                                  color: "#1d2823",
                                  border: "1.5px solid #e7ddd0",
                                }
                          }
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setCurrentPage(activePage + 1)}
                      disabled={activePage === totalPages}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7ddd0] bg-[#f8f6f2] text-on-background transition hover:bg-[#e7ddd0] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[24px] bg-[#fcfaf7] py-16 text-center ring-1 ring-[#eee4d6] border border-[#f4efe6]">
              <MessageSquare
                className="mx-auto text-[#d6cec0] mb-3"
                size={40}
              />
              <p className="text-base font-extrabold text-on-background">
                No customer reviews yet
              </p>
              <p className="text-sm text-charcoal-text mt-1 max-w-xs mx-auto">
                Be the first to share your thoughts about this product!
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
