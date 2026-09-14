import { ArrowRight, CloudSun, Leaf, PawPrint } from "lucide-react";
import itemImage from "../../assets/images/Item.png";
import itemOne from "../../assets/images/item1.png";
import itemTwo from "../../assets/images/item2.png";

const foods = [
  {
    name: "Sprout & Stride",
    description: "Duck, quinoa & cranberry recipe.",
    button: "Sprout & Pride",
    image: itemOne,
    icon: CloudSun,
    color: "bg-brandRed",
  },
  {
    name: "PawHarvest",
    description: "Chicken, rice & wholesome grains.",
    button: "PawHarvest",
    image: itemTwo,
    icon: PawPrint,
    color: "bg-secondaryDark",
  },
  {
    name: "EverTails",
    description: "Turkey & sweet potato recipe.",
    button: "EverTails",
    image: itemImage,
    icon: Leaf,
    color: "bg-[#d65f12]",
  },
];

export default function NaturalFoodSection() {
  return (
    <section className="bg-softCream px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-[650px] text-center">
          <h2 className="text-[34px] font-extrabold leading-[1.18] text-textMain sm:text-[44px] lg:text-[52px]">
            Naturally Nourishing
            <br />
            Pet Food
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[14px] font-semibold leading-[1.7] text-textMain/80 sm:text-[15px]">
            Wholesome recipes made with carefully selected, quality ingredients to support
            your pet&apos;s everyday health, happiness and wellbeing.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {foods.map((food) => (
            <FoodCard key={food.name} food={food} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FoodCard({ food }) {
  const Icon = food.icon;

  return (
    <article className="overflow-hidden rounded-[16px] bg-white shadow-card">
      <div className="relative h-[245px] overflow-hidden sm:h-[300px] lg:h-[320px]">
        <img src={food.image} alt={food.name} loading="lazy" className="h-full w-full object-cover" />
      </div>

      <div className={`${food.color} px-6 py-7 text-center text-white sm:px-8 sm:py-8`}>
        <Icon className="mx-auto" size={28} strokeWidth={1.65} />
        <h3 className="mt-4 text-[24px] font-extrabold leading-none">{food.name}</h3>
        <p className="mt-4 text-[13px] font-semibold">{food.description}</p>
        <a href="/products" className="mt-6 inline-flex h-[42px] min-w-[142px] items-center justify-center gap-3 rounded-full bg-white px-8 text-[12px] font-extrabold !text-textMain shadow-card">
          <span className="whitespace-nowrap text-textMain">{food.button}</span>
          <ArrowRight size={14} className="text-textMain" />
        </a>
      </div>
    </article>
  );
}
