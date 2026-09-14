import { StarIcon } from "./common/HeaderIcons";

const rows = [
  { stars: 5, percent: "85%", widthClass: "w-[85%]" },
  { stars: 4, percent: "10%", widthClass: "w-[10%]" },
  { stars: 3, percent: "3%", widthClass: "w-[3%]" },
  { stars: 2, percent: "1%", widthClass: "w-[1%]" },
  { stars: 1, percent: "1%", widthClass: "w-[1%]" },
];

const Stars = () => (
  <span className="flex items-center gap-0.5 text-[#d9aa3d]">
    {Array.from({ length: 5 }).map((_, index) => (
      <StarIcon key={index} className="h-4 w-4 fill-[#d9aa3d]" />
    ))}
  </span>
);

const ReviewSummary = ({ rating, reviews }) => {
  return (
    <section className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-[#122a50]">
        Reviews ({reviews})
      </h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-[150px_minmax(0,1fr)]">
        <div>
          <p className="text-5xl font-extrabold leading-none text-[#122a50]">
            {rating}
          </p>
          <div className="mt-3">
            <Stars />
          </div>
          <p className="mt-2 text-xs font-semibold text-[#122a50b2]">
            Based on {reviews} reviews
          </p>
        </div>

        <div className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.stars} className="grid grid-cols-[44px_minmax(0,1fr)_38px] items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-[#122a50]">
                {row.stars}
                <StarIcon className="h-3 w-3 fill-[#d9aa3d] text-[#d9aa3d]" />
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-[#17345f1a]">
                <span
                  className={`block h-full rounded-full bg-[#17345f] ${row.widthClass}`}
                />
              </span>
              <span className="text-right text-xs font-bold text-[#122a50b2]">
                {row.percent}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="mt-5 text-sm font-extrabold text-[#d9aa3d] transition-colors hover:text-[#17345f]"
      >
        See all reviews
      </button>
    </section>
  );
};

export default ReviewSummary;
