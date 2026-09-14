
const collections = [
  {
    icon: "1",
    title: "Curated for Your Pet",
    description:
      "Each collection is carefully designed around a pet routine, so you do not have to search one product at a time.",
  },
  {
    icon: "2",
    title: "Save Time & Effort",
    description:
      "Discover complete pet-care inspiration instantly, from feeding sets to travel and grooming essentials.",
  },
  {
    icon: "3",
    title: "Routine-Based Inspiration",
    description:
      "From sleepy corners to walks, meals, baths, and play, every idea is organized around real pet care.",
  },
  {
    icon: "4",
    title: "Personalized & Flexible",
    description:
      "Mix and match collections to suit your pet's size, habits, taste, and everyday comfort needs.",
  },
];

const CollectionsForHomeSection = () => {
  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 xl:py-[96px]">
      <div className="mx-4 sm:mx-5 lg:mx-8 xl:mx-14">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center gap-8 sm:gap-12 lg:gap-14 xl:gap-[58px]">
          {/* Section Header */}
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <h2 className="text-[30px] font-semibold leading-tight text-[#122a50] sm:text-[38px] lg:text-[40px] xl:text-[45px]">
              Collections for Every Pet
            </h2>
            <p className="text-sm font-normal leading-tight text-[#122a50b2] sm:text-base">
              Find inspiration with curated care themes designed to make pet
              parenting easier, faster, and more enjoyable.
            </p>
          </div>

          {/* Grid */}
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
            {collections.map((collection) => (
              <article
                key={collection.title}
                className="flex min-h-[200px] flex-col justify-between gap-8 rounded-[16px] bg-[#f8f1df] p-6 sm:min-h-[214px] sm:p-7 lg:p-[30px]"
              >
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#17345f] text-lg font-semibold text-white sm:h-[62px] sm:w-[62px] sm:text-xl">
                  {collection.icon}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-medium leading-normal text-[#122a50] sm:text-xl lg:text-lg xl:text-xl">
                    {collection.title}
                  </h3>
                  <p className="text-sm font-normal leading-normal text-[#122a50b2] sm:text-base lg:text-sm xl:text-base">
                    {collection.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollectionsForHomeSection;
