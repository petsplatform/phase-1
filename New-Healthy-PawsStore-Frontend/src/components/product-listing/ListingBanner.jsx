import { motion } from "framer-motion";
import {
  BadgeCheck,
  Leaf,
  PawPrint,
  ShieldCheck,
  WheatOff,
} from "lucide-react";
import heroDog from "../../assets/images/dog.png";

const features = [
  { icon: Leaf, label: "Natural\nIngredients" },
  { icon: ShieldCheck, label: "Vet\nApproved" },
  { icon: BadgeCheck, label: "Complete\nNutrition" },
  // { icon: WheatOff, label: "No Artificial\nAdditives" },
];

export default function ListingBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden border-b border-borderSoft bg-[#fcfbfa]"
    >
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-[78px]">
        <div className="relative z-20 flex h-full max-w-[560px] flex-col justify-center pb-8 pt-9 sm:pb-10 sm:pt-10">
          <h1 className="font-display text-[32px] font-extrabold leading-[1.08] text-primary sm:text-[38px] lg:text-[44px]">
            Nutritious Food for
            <br />
            <span className="text-secondary">Happy, Healthy Dogs</span>
            <PawPrint
              className="ml-4 inline-block align-[-1px] text-secondary"
              size={32}
              fill="currentColor"
            />
          </h1>
          <p className="mt-5 text-[15px] font-semibold leading-[1.65] text-textMain sm:mt-6 sm:text-[18px]">
            High quality dog food made with love and
            <br className="hidden sm:block" />
            care for your best friend.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-5 sm:mt-9 sm:flex sm:flex-wrap sm:gap-x-12">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon
                  className="shrink-0 text-secondary"
                  size={33}
                  strokeWidth={1.75}
                />
                <span className="whitespace-pre-line text-[13px] font-extrabold leading-tight text-textMain">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] md:block">
          <img
            src={heroDog}
            alt="Golden retriever with dog food"
            loading="lazy"
            className="absolute bottom-0 right-0 h-full w-auto max-w-none object-contain object-right-bottom"
          />
        </div>
      </div>
    </motion.section>
  );
}
