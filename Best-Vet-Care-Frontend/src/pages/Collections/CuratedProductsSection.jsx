
const collections = [
  {
    image: "/images/img_category_image.png",
    title: "Cozy Rest Collection",
    description:
      "Beds, blankets, calming toys, and soft textures for pets who love a peaceful nap corner.",
    stats: ["2 Beds", "3 Toys", "4 Comforts"],
  },
  {
    image: "/images/img_product_item_image.png",
    title: "Daily Walk Collection",
    description:
      "Leashes, collars, cleanup bags, treat pouches, and simple walking essentials for every outing.",
    stats: ["3 Leads", "2 Bowls", "3 Bags"],
  },
  {
    image: "/images/img__1.png",
    title: "Feeding Collection",
    description:
      "Durable bowls, raised stands, placemats, and easy-clean feeding pieces for fresh meals.",
    stats: ["3 Bowls", "2 Mats", "3 Stands"],
  },
  {
    image: "/images/img_product_item_image_258x430.png",
    title: "Playtime Collection",
    description:
      "Chew toys, ropes, enrichment pieces, and soft play favorites for active pets.",
    stats: ["4 Toys", "2 Ropes", "3 Treats"],
  },
  {
    image: "/images/img_product_item_image_1.png",
    title: "Grooming Collection",
    description:
      "Gentle brushes, towels, shampoos, and tidy tools for clean, calm care days.",
    stats: ["3 Tools", "2 Towels", "3 Washes"],
  },
  {
    image: "/images/img_product_item_image.png",
    title: "Travel Collection",
    description:
      "Carriers, foldable bowls, seat covers, and comfort pieces for easy trips.",
    stats: ["2 Bags", "2 Bowls", "3 Covers"],
  },
];

const CuratedProductsSection = () => {
  return (
    <section
      id="curated-collections"
      className="mt-12 w-full bg-[#f8f1df] py-12 sm:mt-16 sm:py-16 md:mt-20 md:py-20"
    >
      <div className="mx-4 sm:mx-5 lg:mx-8 xl:mx-14">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-8 sm:gap-12 lg:gap-14 xl:gap-[62px]">
          {/* Section Header */}
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center md:gap-[18px]">
            <h2 className="text-[30px] font-semibold leading-tight text-[#122a50] sm:text-[38px] lg:text-[40px] xl:text-[45px]">
              Curated Pet Care Collections
            </h2>
            <p className="text-sm font-normal leading-tight text-[#122a50b2] sm:text-base">
              Explore themed pet sets carefully selected to match your routine
              and make every day easier for you and your pet.
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-6 xl:gap-[30px]">
            {collections.map((item) => (
              <article key={item.title} className="flex flex-col gap-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-[280px] w-full rounded-[16px] object-cover sm:h-[320px] md:h-[340px] lg:h-[320px] xl:h-[400px]"
                />

                <div className="flex flex-col gap-4 px-2 sm:px-[14px]">
                  {/* Price + Actions */}
                  <div className="flex items-center justify-between gap-4">
                    <strong className="text-xl font-semibold leading-relaxed text-[#122a50] sm:text-2xl">
                      $50.00
                    </strong>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#17345f1a] bg-white text-[#122a50b2] transition-colors hover:bg-[#fffdf7] sm:h-9 sm:w-9"
                        aria-label="Save collection"
                      >
                        &#9825;
                      </button>
                      <button
                        type="button"
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#17345f1a] bg-white transition-colors hover:bg-[#fffdf7] sm:h-9 sm:w-9"
                        aria-label="Open collection"
                      >
                        <img src="/images/img_send.svg" alt="" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title + Description */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-medium leading-normal text-[#122a50] sm:text-xl lg:text-lg xl:text-xl">
                      {item.title}
                    </h3>
                    <p className="text-sm font-normal leading-normal text-[#122a50b2] sm:text-base lg:text-sm xl:text-base">
                      {item.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-[#122a50] sm:gap-4 sm:text-base lg:text-sm xl:text-base">
                    {item.stats.map((stat) => (
                      <span key={stat}>{stat}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-colors ${
                  page === 1
                    ? "border-[#17345f] bg-[#17345f] text-white"
                    : "border-[#17345f1a] bg-white text-[#122a5066] hover:border-[#17345f66]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="flex h-9 items-center justify-center gap-2 rounded-full bg-[#17345f] px-5 text-sm font-medium text-white transition-colors hover:bg-[#d9aa3d]"
            >
              <span>Next Page</span>
              <span aria-hidden="true">-&gt;</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CuratedProductsSection;
