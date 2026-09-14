import { ArrowRight, HeartPulse, Leaf, PawPrint } from "lucide-react";
import nutritionItem from "../../assets/images/Item.png";

const cards = [
  {
    icon: HeartPulse,
    title: "Steady Energy",
    text: "Balanced nutrition to support playtime, walks and everyday routines.",
    className: "md:col-span-1",
  },
  {
    icon: PawPrint,
    title: "Healthy Digestion",
    text: "Gentle recipes made with nourishing ingredients pets can enjoy daily.",
    className: "md:col-span-1",
  },
  {
    icon: Leaf,
    title: "Refuel Naturally",
    text: "Wholesome, complete meals designed for happy, healthy pets.",
    className: "md:col-span-2",
  },
];

export default function NutritionSection() {
  return (
    <section className="bg-primary px-4 py-16 text-cream sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-[580px] text-center">
          <h2 className="text-[34px] font-extrabold leading-[1.18] sm:text-[42px]">
            Tail-Wagging Nutrition,
            <br />
            Naturally Made
          </h2>
          <p className="mt-3 text-[15px] font-semibold text-cream/80">
            Simple ingredients. Happy pets.
          </p>
          <a href="/products" className="mt-5 inline-flex items-center gap-2 text-[15px] font-semibold text-cream/90">
            Learn More
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <article className="relative min-h-[430px] overflow-hidden rounded-[16px] shadow-card">
            <img
              src={nutritionItem}
              alt="EverTails natural dog food with wholesome ingredients"
              className="h-full min-h-[430px] w-full object-cover"
              loading="lazy"
            />
          </article>

          <div className="grid gap-5 md:grid-cols-2">
            {cards.map(({ icon: Icon, title, text, className }) => (
              <article key={title} className={`rounded-[16px] bg-sage/35 p-8 text-cream ${className}`}>
                <Icon size={31} strokeWidth={1.65} />
                <h3 className="mt-8 text-[24px] font-extrabold leading-none">{title}</h3>
                <p className="mt-3 max-w-[360px] text-[14px] font-semibold leading-[1.7] text-cream/85">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
