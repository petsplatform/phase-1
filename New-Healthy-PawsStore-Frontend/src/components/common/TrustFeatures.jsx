import {
  BadgeCheck,
  CreditCard,
  Droplets,
  Headphones,
  RotateCcw,
  Truck,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const features = [
  { icon: Droplets, title: "100% Natural", text: "Ingredients" },
  { icon: BadgeCheck, title: "Vet Approved", text: "Products" },
  { icon: Truck, title: "Fast & Free", text: "Shipping" },
  { icon: RotateCcw, title: "Easy Returns", text: "& Refunds" },
  { icon: CreditCard, title: "Secure", text: "Payments" },
  { icon: Headphones, title: "24/7 Customer", text: "Support" },
];

export default function TrustFeatures() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="mx-auto max-w-[1360px] px-4 py-6 sm:px-5 lg:px-6"
      aria-label="Store trust features"
    >
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 bg-white sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-0">
        {features.map(({ icon: Icon, title, text }) => (
          <article
            key={title}
            className="flex min-h-[64px] items-center justify-start gap-3 border-borderSoft px-2 py-2 sm:justify-center sm:px-4 sm:py-3 lg:border-r lg:last:border-r-0"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sageLight text-secondaryDark sm:size-10">
              <Icon size={20} strokeWidth={1.8} className="sm:size-[22px]" />
            </span>
            <span className="min-w-0 text-[12px] font-extrabold leading-snug text-textMain sm:text-[13px]">
              {title}
              <span className="block">{text}</span>
            </span>
          </article>
        ))}
      </div>
    </motion.section>
  );
}
