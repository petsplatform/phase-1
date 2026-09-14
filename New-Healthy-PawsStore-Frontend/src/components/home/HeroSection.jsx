import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Heart,
  HeartHandshake,
  PawPrint,
  ShieldCheck,
  Smile,
  Wallet,
} from "lucide-react";
import heroPets from "../../assets/images/hero-pets-cutout.png";

const MotionLink = motion.create(Link);

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_22%_18%,var(--color-white)_0%,var(--color-soft-cream)_56%,var(--color-cream)_100%)]">
      <div className="mx-auto grid max-w-[1350px] grid-cols-1 items-center px-4 sm:px-6 md:min-h-[520px] md:grid-cols-[45%_55%] md:gap-10 lg:px-8">
        <div className="relative z-10 pb-4 pt-8 text-center sm:pt-12 md:pb-0 md:pl-[36px] md:pt-0 md:text-left lg:pl-9">
          <motion.p
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 hidden text-base font-medium text-secondary md:block"
          >
            Premium Care for Your Pets
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-[36px] font-extrabold leading-[1.05] text-primary sm:text-[56px] md:leading-[0.95] lg:text-[72px]"
          >
            Happy Pets,
            <br />
            <span className="text-secondary">Healthy Life</span>
            <PawPrint
              className="ml-3 inline-block align-[0.04em] text-secondary sm:ml-4"
              size={36}
              fill="currentColor"
            />
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="mx-auto mt-4 max-w-[430px] text-[15px] font-semibold leading-[1.6] text-muted sm:mt-5 sm:text-[18px] sm:leading-[1.7] md:mx-0 lg:text-[20px]"
          >
            Premium food, trusted medicine & care products for your furry
            family.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-8 md:justify-start"
          >
            <Feature icon={ShieldCheck} top="100%" bottom="Natural" />
            <Feature icon={HeartHandshake} top="Vet" bottom="Approved" />
            <Feature icon={Wallet} top="Secure" bottom="Payment" />
          </motion.div>
          <MotionLink
            to="/products"
            aria-label="Shop Now"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="mt-7 inline-flex h-[52px] w-full max-w-[200px] items-center justify-center gap-2 rounded-2xl bg-orange text-[18px] font-extrabold text-white shadow-card transition-colors duration-300 hover:bg-secondary sm:h-[58px] sm:text-[20px] md:mt-11"
          >
            Shop Now
            <PawPrint size={20} fill="currentColor" aria-hidden="true" />
          </MotionLink>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative mt-6 flex justify-center self-stretch pb-2 md:mt-0 md:block md:min-h-[512px] md:pb-0"
        >
          <div className="absolute inset-x-6 bottom-0 top-4 rounded-t-full bg-sage/20 md:hidden" />
          <motion.div
            animate={{ y: [0, -10, 0], x: [0, 6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[-6px] top-0 hidden h-[500px] w-[580px] rounded-[48%_52%_35%_65%/43%_33%_67%_57%] bg-sage opacity-25 md:block"
          />
          <PawPrint
            className="absolute left-[8%] top-[30%] hidden text-secondary opacity-40 md:block"
            size={38}
            fill="currentColor"
            aria-hidden="true"
          />
          <Smile
            className="absolute left-[18%] top-[34%] hidden rotate-[-18deg] text-secondary opacity-40 md:block"
            size={46}
            aria-hidden="true"
          />
          <Heart
            className="absolute right-[16%] top-[24%] hidden text-secondary opacity-40 md:block"
            size={40}
            aria-hidden="true"
          />
          <Heart
            className="absolute right-[10%] top-[44%] hidden text-secondary opacity-40 md:block"
            size={29}
            aria-hidden="true"
          />
          <img
            src={heroPets}
            alt="Happy Golden Retriever with Cat"
            className="relative z-10 mx-auto w-full max-w-[440px] object-contain object-bottom sm:max-w-[500px] md:absolute md:bottom-0 md:left-auto md:right-[-42px] md:w-[min(720px,60vw)] md:max-w-none md:translate-x-0 lg:right-[-34px]"
          />
        </motion.div>
      </div>
    </section>
  );
}

function Feature({ icon: Icon, top, bottom }) {
  return (
    <span className="flex items-center gap-2 text-left text-[13px] font-extrabold leading-tight text-primary sm:text-[14px]">
      <span className="grid size-10 shrink-0 place-items-center rounded-[14px] border-2 border-secondary text-secondary sm:size-12">
        <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span>
        {top}
        <br />
        {bottom}
      </span>
    </span>
  );
}
