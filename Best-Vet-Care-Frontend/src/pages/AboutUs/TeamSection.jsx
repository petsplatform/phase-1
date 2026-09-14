
const teamMembers = [
  {
    name: "Comfort Care Team",
    role: "Beds, blankets, calming toys",
    image: "/images/img_category_image.png",
  },
  {
    name: "Daily Routine Team",
    role: "Feeding, walking, cleanup",
    image: "/images/img_product_item_image.png",
  },
  {
    name: "Play & Wellness Team",
    role: "Toys, grooming, travel care",
    image: "/images/img_product_item_image_1.png",
  },
];

const TeamSection = () => {
  return (
    <section className="mt-12 w-full bg-[#f8f1df] py-12 sm:mt-16 sm:py-16 md:mt-20 md:py-20">
      <div className="mx-4 sm:mx-5 lg:mx-5">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center gap-10 sm:gap-12 md:gap-16">
          <div className="flex w-full max-w-[770px] flex-col items-center gap-2 text-center">
            <h2 className="text-[30px] font-semibold leading-tight text-[#122a50] sm:text-[38px] lg:text-[45px]">
              The Care Behind Every Collection
            </h2>
            <p className="w-full text-base leading-normal text-[#122a50b2]">
              Our product groups are organized by pet needs, not guesswork, so
              you can find practical essentials for daily comfort faster.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            {teamMembers.map((member) => (
              <article key={member.name} className="flex flex-col items-center gap-4">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-[300px] w-full rounded-[18px] object-cover sm:h-[360px] lg:h-[430px]"
                />
                <div className="flex flex-col items-center gap-1 pb-2 text-center">
                  <h3 className="text-lg font-medium text-[#122a50]">
                    {member.name}
                  </h3>
                  <p className="text-base text-[#122a50b2]">{member.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
