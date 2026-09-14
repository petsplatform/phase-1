import { BadgeCheck, Headphones, Leaf, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import trustPets from "../../assets/images/trust-pets.png";

const features = [
  {
    icon: Truck,
    title: "Fast & Free Shipping",
    text: "On orders over $49",
  },
  { icon: RotateCcw, title: "Easy Returns", text: "30-day return policy" },
  { icon: ShieldCheck, title: "Secure Payments", text: "100% secure checkout" },
  { icon: Headphones, title: "24/7 Support", text: "We're here to help" },
  { icon: Leaf, title: "100% Natural", text: "Safe products" },
  { icon: BadgeCheck, title: "Vet Approved", text: "Trusted care" },
];

export default function TrustFeatures() {
  return (
    <section className="mx-auto max-w-[1360px] px-4 py-5 sm:px-5 lg:px-6">
      <div className="relative overflow-hidden rounded-[16px] bg-sageLight">
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 py-5 md:grid-cols-2 md:px-0 md:py-0 lg:grid-cols-6 lg:gap-0">
          {features.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="flex min-h-[74px] items-center gap-3 border-borderSoft px-1 py-1 md:px-6 md:py-4 lg:border-r lg:last:border-r-0"
            >
              <Icon
                className="shrink-0 text-secondaryDark"
                size={28}
                strokeWidth={1.7}
              />
              <span className="min-w-0">
                <strong className="block text-[12px] font-extrabold leading-tight text-textMain sm:text-[14px]">
                  {title}
                </strong>
                <span className="mt-1 block text-[12px] font-semibold leading-tight text-textMain sm:text-[13px]">
                  {text}
                </span>
              </span>
            </article>
          ))}
        </div>
        <img
          src={trustPets}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-8 hidden h-[92px] object-contain xl:block"
          loading="lazy"
        />
      </div>
    </section>
  );
}
