import { motion } from "framer-motion";
import { Mail, PawPrint } from "lucide-react";
import dog from "../../assets/images/newsletter-dog.png";

export default function Newsletter() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto mt-10 max-w-[1100px] px-4 pb-8 pt-0 sm:px-6 lg:px-0"
    >
      <div className="relative grid min-h-[90px] gap-4 overflow-hidden rounded-[13px] bg-secondaryDark px-5 py-6 text-white shadow-card sm:px-8 md:flex md:items-center md:gap-6 md:py-0">
        <Mail size={42} strokeWidth={1.7} className="shrink-0" />
        <div className="min-w-0 md:min-w-[355px]">
          <h2 className="text-[23px] font-extrabold leading-tight sm:text-[27px] sm:leading-none">
            Join Our Paw-some Family!
          </h2>
          <p className="mt-2 text-[15px] font-semibold">
            Get exclusive offers, pet care tips & updates.
          </p>
        </div>
        {/* <form className="z-10 flex h-11 overflow-hidden rounded-[8px] bg-white md:mr-[180px] md:hidden lg:ml-auto lg:mr-[210px] lg:flex lg:h-10 lg:max-w-[440px] lg:flex-1">
          <input
            type="email"
            className="min-w-0 flex-1 px-5 text-[12px] text-textMain outline-none placeholder:text-muted"
            placeholder="Enter your email address"
          />
          <button
            type="button"
            className="inline-flex w-[96px] items-center justify-center gap-1 bg-orange text-[12px] font-extrabold text-white transition-colors hover:bg-secondary sm:w-[108px]"
            aria-label="Subscribe"
          >
            Subscribe
            <PawPrint size={13} fill="currentColor" aria-hidden="true" />
          </button>
        </form> */}
        <img
          src={dog}
          alt="Happy dog"
          className="absolute right-8 top-[-5px] hidden w-[176px] max-w-none md:block"
        />
      </div>
    </motion.section>
  );
}
