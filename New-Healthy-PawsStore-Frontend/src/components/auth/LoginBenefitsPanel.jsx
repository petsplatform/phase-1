import { motion, useReducedMotion } from "framer-motion";
import {
  Headphones,
  Heart,
  Leaf,
  PawPrint,
  ShieldCheck,
  Truck,
} from "lucide-react";
import loginDog from "../../assets/images/auth/login dog.png";

const benefits = [
  {
    icon: Leaf,
    title: "100% Natural Products",
    text: "Premium quality, safe for your pets",
  },
  {
    icon: ShieldCheck,
    title: "Vet Approved",
    text: "All products are vet recommended",
  },
  {
    icon: Truck,
    title: "Fast & Free Shipping",
    text: "On orders over $49",
  },
  {
    icon: Headphones,
    title: "24/7 Customer Support",
    text: "We're here to help you anytime",
  },
];

export default function LoginBenefitsPanel() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, x: 24 }}
      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
      transition={{ duration: 0.42 }}
      className="relative overflow-hidden bg-gradient-to-br from-cream to-sageLight px-6 py-8 sm:px-10 lg:px-[64px] lg:py-[58px]"
      aria-labelledby="login-benefits-title"
    >
      <PawPrint
        className="absolute right-16 top-24 text-secondaryLight/50"
        size={36}
        fill="currentColor"
      />
      <Heart
        className="absolute right-[48%] top-24 text-secondaryDark"
        size={42}
        strokeWidth={1.7}
      />
      <Heart
        className="absolute bottom-56 right-9 text-sage"
        size={28}
        strokeWidth={1.7}
      />

      <div className="relative z-10 max-w-[430px]">
        <h2
          id="login-benefits-title"
          className="font-display text-[42px] font-extrabold leading-[1.15] text-textMain sm:text-[48px]"
        >
          Happy Pets,
          <br />
          <span className="text-secondaryDark">Healthy Lives</span>
        </h2>
        <p className="mt-5 text-[16px] font-semibold leading-[1.7] text-textMain">
          Join thousands of pet parents who trust HealthyPawsStore for their
          pets&apos; needs.
        </p>
      </div>

      <div className="relative z-20 mt-8 grid max-w-[380px] gap-5">
        {benefits.map(({ icon: Icon, title, text }, index) => (
          <motion.article
            key={title}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.07 }}
            className="flex items-center gap-5"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-secondaryDark shadow-card">
              <Icon size={28} strokeWidth={1.8} />
            </span>
            <span>
              <strong className="block text-[15px] font-extrabold text-textMain">
                {title}
              </strong>
              <span className="mt-1 block text-[14px] font-semibold text-muted">
                {text}
              </span>
            </span>
          </motion.article>
        ))}
      </div>

      <motion.img
        src={loginDog}
        alt="Happy golden retriever beside a green food bowl"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.14 }}
        className="relative z-10 ml-auto mt-8 h-[330px] w-full object-contain object-right-bottom lg:absolute lg:bottom-0 lg:right-0 lg:h-[455px] lg:w-[58%]"
        loading="eager"
      />
    </motion.section>
  );
}
