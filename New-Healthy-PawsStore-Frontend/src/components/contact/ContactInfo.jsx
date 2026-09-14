import { motion, useReducedMotion } from "framer-motion";
import { PawPrint } from "lucide-react";
import ContactFeatures from "./ContactFeatures";
import StoreMap from "./StoreMap";

export default function ContactInfo() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="h-full rounded-[20px] border border-borderSoft bg-white p-5 shadow-contact sm:p-7"
      aria-labelledby="contact-info-title"
    >
      <h2
        id="contact-info-title"
        className="flex items-center gap-3 font-display text-[24px] font-extrabold text-textMain"
      >
        <PawPrint size={20} className="text-secondary" fill="currentColor" />
        Get in Touch
      </h2>
      <div className="mt-6 grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
        <ContactFeatures />
        {/* <StoreMap /> */}
      </div>
    </motion.section>
  );
}
