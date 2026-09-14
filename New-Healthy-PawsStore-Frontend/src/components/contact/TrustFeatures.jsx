import { motion, useReducedMotion } from "framer-motion";
import { trustBenefits } from "../../data/contactData";
import { iconMap } from "./iconMap";

export default function TrustFeatures() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="mx-auto max-w-[1240px] px-4 py-6 sm:px-5 lg:px-6"
      aria-label="Store trust features"
    >
      <div className="grid overflow-hidden rounded-[14px] border border-borderSoft bg-white shadow-card sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {trustBenefits.map(({ icon, title, text }) => {
          const Icon = iconMap[icon];

          return (
            <article
              key={title}
              className="flex min-h-[74px] items-center gap-3 border-borderSoft px-5 py-4 lg:border-r lg:last:border-r-0"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-iconBg text-secondaryDark">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <span className="text-[13px] font-extrabold leading-snug text-textMain">
                {title} 
                <span className="block">{text}</span>
              </span>
            </article>
          );
        })}
      </div>
    </motion.section>
  );
}
