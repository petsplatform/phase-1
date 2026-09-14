import { Heart, Leaf, PackageCheck, Store, UsersRound } from "lucide-react";

const steps = [
  { year: "2018", title: "The Beginning", text: "Started with a simple mission to provide better pet food.", icon: Leaf },
  { year: "2019", title: "First Store", text: "Launched our first online store with handpicked products.", icon: Store },
  { year: "2020", title: "Growing Family", text: "Reached 10K+ happy customers across the country.", icon: UsersRound },
  { year: "2022", title: "Expanding Range", text: "Added medicines, grooming & wellness products.", icon: PackageCheck },
  { year: "2024", title: "Looking Ahead", text: "Continuing our mission to make pets healthier & happier.", icon: Heart },
];

export default function JourneySection() {
  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-9 lg:px-[76px]">
      <div className="mx-auto grid max-w-[1320px] gap-6 lg:grid-cols-[220px_1fr] lg:gap-8">
        <div>
          <h2 className="text-center text-[24px] font-extrabold text-textMain lg:text-left">Our Journey</h2>
          <p className="mx-auto mt-3 max-w-[420px] text-center text-[14px] font-semibold leading-[1.7] text-textMain lg:mx-0 lg:mt-4 lg:text-left">
            From a small idea to a trusted pet care brand, our journey has been driven by love and compassion.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-5 sm:gap-7">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-borderSoft sm:block" />
          {steps.map(({ year, title, text, icon: Icon }) => (
            <article key={year} className="relative rounded-[12px] border border-borderSoft bg-white p-4 text-center shadow-card sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
              <span className="relative z-10 mx-auto grid size-12 place-items-center rounded-full bg-sage/20 text-secondaryDark sm:size-16">
                <Icon size={24} strokeWidth={1.7} className="sm:size-[31px]" />
              </span>
              <strong className="mt-3 block text-[14px] font-extrabold text-textMain sm:mt-5">{year}</strong>
              <span className="mt-1 block text-[12px] font-extrabold text-textMain sm:mt-2">{title}</span>
              <p className="mx-auto mt-2 max-w-[135px] text-[11px] font-semibold leading-[1.45] text-textMain sm:mt-3 sm:max-w-[130px] sm:leading-[1.55]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
