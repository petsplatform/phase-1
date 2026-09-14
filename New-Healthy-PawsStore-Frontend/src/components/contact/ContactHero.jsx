import { motion, useReducedMotion } from "framer-motion";
import { Heart, PawPrint, Send } from "lucide-react";
import heroPets from "../../assets/images/contact/contact-hero-dog-cat.png";
import { heroFeatures } from "../../data/contactData";
import { iconMap } from "./iconMap";

export default function ContactHero() {
  const reduceMotion = useReducedMotion();
  const textMotion = reduceMotion
    ? {}
    : { initial: { opacity: 0, x: -24 }, animate: { opacity: 1, x: 0 } };
  const imageMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        transition: { delay: 0.12, duration: 0.5 },
      };

  return (
    <section className="bg-background px-4 pb-5 pt-8 sm:px-5 lg:px-6">
      <div className="mx-auto grid max-w-[1300px] items-center gap-9 lg:min-h-[342px] lg:grid-cols-[48fr_52fr]">
        <motion.div {...textMotion} transition={{ duration: 0.45 }}>
          <p className="mb-4 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-normal text-textMain">
            <PawPrint
              size={16}
              className="text-secondary"
              fill="currentColor"
            />
            Contact Us
          </p>
          <div className="relative inline-block">
            <h1 className="font-display text-[42px] font-extrabold leading-[1.03] text-textMain sm:text-[48px] lg:text-[50px]">
              We&apos;re Here
              <br />
              For <span className="text-primaryDark">You</span>{" "}
              <span className="text-secondaryDark">& Your Pets</span>
            </h1>
            <Heart
              size={54}
              className="absolute -right-14 top-12 hidden rotate-[-18deg] text-secondary md:block"
              strokeWidth={1.6}
            />
            <PawPrint
              size={32}
              className="absolute -right-20 top-20 hidden rotate-12 text-secondary md:block"
              fill="currentColor"
            />
          </div>
          <p className="mt-3 max-w-[390px] text-[15px] font-semibold leading-[1.55] text-textMain">
            Have questions, suggestions, or need help?
            <br />
            Our pet care experts are always happy to assist you.
          </p>

          <div className="mt-7 grid gap-5 sm:grid-cols-3">
            {heroFeatures.map(({ icon, title, text }, index) => {
              const Icon = iconMap[icon];

              return (
                <motion.article
                  key={title}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-iconBg text-secondaryDark">
                    <Icon size={25} strokeWidth={1.9} />
                  </span>
                  <span>
                    <strong className="block text-[14px] font-extrabold text-textMain">
                      {title}
                    </strong>
                    <span className="mt-1 block text-[13px] font-semibold leading-snug text-muted">
                      {text}
                    </span>
                  </span>
                </motion.article>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          {...imageMotion}
          className="relative min-h-[300px] overflow-hidden lg:min-h-[348px]"
        >
          <div className="absolute left-[11%] top-5 h-[250px] w-[76%] rounded-[48%_52%_42%_58%/54%_44%_56%_46%] bg-sage/50" />
          <PawPrint
            className="absolute left-[14%] top-24 text-sage"
            size={20}
            fill="currentColor"
          />
          <PawPrint
            className="absolute right-[13%] top-16 text-sage"
            size={24}
            fill="currentColor"
          />
          <PawPrint
            className="absolute right-[8%] top-44 text-sage"
            size={31}
            fill="currentColor"
          />
          <div className="absolute right-5 top-20 hidden items-center gap-2 text-secondaryLight md:flex">
            <span className="h-px w-28 border-t border-dashed border-secondaryLight" />
            <Send size={31} strokeWidth={1.4} />
          </div>
          <img
            src={heroPets}
            alt="Happy golden retriever and tabby cat sitting together"
            className="relative z-10 mx-auto h-[318px] w-full object-contain object-bottom lg:h-[364px]"
          />
          <div className="absolute bottom-[58px] left-[12%] z-20 max-w-[128px] rounded-[48%_52%_45%_55%] bg-secondaryDark px-4 py-3 text-center text-[13px] font-extrabold leading-tight text-white shadow-card">
            We love hearing from you!
            <Heart
              size={14}
              className="ml-1 inline text-sage"
              strokeWidth={2}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
