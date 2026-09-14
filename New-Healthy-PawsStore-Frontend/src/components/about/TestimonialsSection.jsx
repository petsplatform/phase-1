import { Star, UserRound } from "lucide-react";

const reviews = [
  {
    name: "Sarah D.",
    text: "HealthyPawsStore has the best quality products and fast delivery. My dog absolutely loves their food and treats!",
  },
  {
    name: "Michael R.",
    text: "I trust their vet-approved products. Great customer support and very reliable.",
  },
  {
    name: "Priya S.",
    text: "Amazing experience from start to finish. Highly recommended for all pet parents!",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="bg-white px-6 py-9 lg:px-[76px]">
      <div className="mx-auto max-w-[1320px]">
        <h2 className="mb-7 text-center text-[20px] font-extrabold text-textMain">What Pet Parents Say</h2>
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 sm:-mx-0 sm:px-0 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {reviews.map((review) => (
            <article key={review.name} className="w-[86vw] max-w-[330px] shrink-0 snap-center rounded-[10px] border border-borderSoft bg-white p-6 shadow-card sm:w-[330px] md:w-auto md:max-w-none md:p-7">
              <div className="flex gap-1 text-orange">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={17} fill="currentColor" />
                ))}
              </div>
              <p className="mt-5 text-[13px] font-semibold leading-[1.75] text-textMain">&quot;{review.text}&quot;</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-sage/20 text-secondaryDark">
                  <UserRound size={22} />
                </span>
                <strong className="text-[13px] font-extrabold text-secondaryDark">{review.name}</strong>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-5 flex justify-center gap-2 md:hidden">
          <span className="size-2 rounded-full bg-borderSoft" />
          <span className="size-2 rounded-full bg-borderSoft" />
          <span className="size-2 rounded-full bg-secondary" />
        </div>
      </div>
    </section>
  );
}
