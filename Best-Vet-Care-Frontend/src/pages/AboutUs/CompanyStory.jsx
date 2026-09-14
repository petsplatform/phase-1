import { Link } from "react-router-dom";

const stats = [
  { label: "Pet Essentials", value: "50K+" },
  { label: "Happy Customers", value: "20K+" },
  { label: "Care Categories", value: "50+" },
];

const storyCards = [
  {
    title: "Daily Care Expertise",
    text: "Our collections are shaped around real pet routines: meals, walks, grooming, play, rest, and travel.",
  },
  {
    title: "Comfort First",
    text: "We choose soft textures, practical materials, and simple products that make pets feel safe at home.",
  },
];

const CompanyStory = () => {
  return (
    <section className="mt-16 w-full sm:mt-20 md:mt-24 lg:mt-[120px]">
      <div className="mx-4 sm:mx-5 lg:mx-5">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-16 sm:gap-20 lg:gap-[120px]">
          <div className="flex w-full flex-col items-center justify-between gap-8 lg:flex-row">
            <img
              src="/images/img_category_image.png"
              alt="Dog resting in a cozy bed"
              className="aspect-[1.1] w-full rounded-[24px] object-cover lg:w-[48%]"
            />

            <div className="flex w-full flex-col items-start gap-8 md:gap-12 lg:w-[48%]">
              <div className="flex w-full flex-col items-start gap-6 md:gap-8">
                <h2 className="w-full text-left text-[30px] font-semibold leading-tight text-[#122a50] sm:text-[38px] lg:text-[45px]">
                  Built for Pet Parents, Trusted by Everyday Care Routines
                </h2>
                <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
                  {storyCards.map((card) => (
                    <article key={card.title} className="flex flex-col gap-1">
                      <h3 className="text-lg font-medium text-[#122a50]">
                        {card.title}
                      </h3>
                      <p className="text-base leading-normal text-[#122a50b2]">
                        {card.text}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[18px] border border-[#17345f19] bg-[#f8f1df] p-5"
                  >
                    <p className="text-base text-[#122a50b2]">{item.label}</p>
                    <p className="mt-2 text-[32px] font-semibold leading-tight text-[#122a50]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-8">
            <div className="flex w-full flex-col items-start justify-between gap-6 lg:flex-row">
              <h2 className="w-full text-left text-[30px] font-semibold leading-tight text-[#122a50] sm:text-[38px] lg:w-[32%] lg:text-[45px]">
                Get to Know Our Story
              </h2>
              <div className="flex w-full flex-col items-start gap-6 lg:w-[50%]">
                <p className="text-base leading-normal text-[#122a50b2]">
                  Best-Vet-Care began with a simple idea: pet shopping should
                  feel calm, useful, and trustworthy. We focus on products that
                  support healthier routines, cleaner homes, easier travel, and
                  more comfortable pets.
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-[#17345f] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#d9aa3d]"
                >
                  <span>Explore Collections</span>
                  <img
                    src="/images/img_arrowright_white_a700.svg"
                    alt=""
                    className="h-5 w-5"
                  />
                </Link>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
              <img
                src="/images/img_product_item_image.png"
                alt="Pet starter products"
                className="h-[260px] w-full rounded-[24px] object-cover md:h-[420px]"
              />
              <img
                src="/images/img__0x0.png"
                alt="Cat comfort products"
                className="h-[260px] w-full rounded-[24px] object-cover md:h-[420px]"
              />
              <img
                src="/images/img__1.png"
                alt="Pet feeding set"
                className="h-[260px] w-full rounded-[24px] object-cover md:h-[420px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyStory;
