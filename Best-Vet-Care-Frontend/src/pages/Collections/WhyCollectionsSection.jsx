
const features = [
  {
    title: "Routine Ready",
    description:
      "Each collection groups products around a real care moment, so you can shop without searching one by one.",
  },
  {
    title: "Pet-Safe Picks",
    description:
      "We focus on comfort, durable materials, easy cleaning, and products that make everyday care feel simple.",
  },
  {
    title: "Made for Every Pet",
    description:
      "Browse thoughtful sets for dogs, cats, birds, fish, and small pets across home, travel, food, and play.",
  },
  {
    title: "Easy to Mix",
    description:
      "Start with a ready-made collection, then add treats, toys, bowls, or grooming tools that match your pet.",
  },
];

const WhyCollectionsSection = () => {
  return (
    <section className="mt-16 w-full sm:mt-24 lg:mt-28 xl:mt-[160px]">
      <div className="mx-4 sm:mx-5 lg:mx-8 xl:mx-14">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-8 lg:flex-row lg:gap-10 xl:gap-[112px]">
          <div className="w-full flex-shrink-0 lg:w-[45%] xl:w-[590px]">
            <img
              src="/images/img_category_image.png"
              alt="Dog resting in a soft pet bed"
              className="aspect-square w-full rounded-[24px] object-cover"
            />
          </div>

          <div className="flex w-full flex-col gap-6 md:gap-8 lg:w-[50%]">
            <div className="flex flex-col gap-1">
              <h2 className="text-left text-[30px] font-semibold leading-tight text-[#122a50] sm:text-[38px] lg:text-[40px] xl:text-[45px]">
                Why Our Pet Collections Matter?
              </h2>
              <p className="text-left text-sm font-normal leading-[22px] text-[#122a50b2] sm:text-base">
                Discover the comfort of shopping for pet essentials in a more
                organized and enjoyable way. Each collection is built around
                daily care, comfort, and happy routines.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="flex flex-col gap-[6px] rounded-[24px] bg-[#f8f1df] p-5 md:p-6"
                >
                  <div className="flex items-center gap-2 md:gap-[10px]">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#17345f66] text-[12px] text-[#17345f]">
                      Q
                    </span>
                    <h3 className="text-left text-base font-medium leading-normal text-[#122a50] sm:text-lg lg:text-base xl:text-xl">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-left text-sm font-normal leading-normal text-[#122a50b2] sm:text-base lg:text-sm xl:text-base">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyCollectionsSection;
