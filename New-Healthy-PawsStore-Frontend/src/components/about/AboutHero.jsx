import { motion } from "framer-motion";
import { ChevronRight, Home, PawPrint } from "lucide-react";
import aboutPet from "../../assets/images/about-pet.png";

export default function AboutHero() {
  return (
    <section className="border-b border-borderSoft bg-white">
      <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-8 sm:px-6 lg:px-[76px] lg:pt-10">
        <nav
          className="mb-7 flex flex-wrap items-center gap-3 text-[12px] font-semibold text-textMain sm:mb-8"
          aria-label="Breadcrumb"
        >
          <a
            href="/"
            className="flex items-center gap-2 hover:text-secondaryDark"
          >
            <Home size={14} />
            Home
          </a>
          <ChevronRight size={13} className="text-muted" />
          <span>About Us</span>
        </nav>

        <div className="grid items-center gap-8 md:min-h-[337px] md:grid-cols-[42%_58%]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="font-display text-[36px] font-extrabold leading-[1.06] text-textMain sm:text-[42px] lg:text-[51px]">
              About
              <br />
              <span className="text-secondary">HealthyPawsStore</span>
              <PawPrint
                className="ml-3 inline-block text-secondary"
                size={34}
                fill="currentColor"
              />
            </h1>
            <p className="mt-5 max-w-[330px] text-[16px] font-extrabold leading-[1.45] text-textMain sm:text-[18px]">
              Premium care for your pets, because they deserve the best.
            </p>
            <p className="mt-5 max-w-[455px] text-[14px] font-semibold leading-[1.7] text-textMain">
              At HealthyPawsStore, we believe pets are family. Our mission is to
              provide high-quality, natural, and vet-approved pet products that
              support happy, healthy lives.
            </p>
            <a
              href="#story"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-[8px] bg-secondaryDark px-6 text-[13px] font-extrabold text-white shadow-card"
            >
              <PawPrint size={14} fill="currentColor" />
              Our Story
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55 }}
            className="relative min-h-[260px] sm:min-h-[320px] md:min-h-[337px]"
          >
            <img
              src={aboutPet}
              alt="Happy dog and cat"
              className="absolute bottom-0 left-1/2 h-[260px] w-auto max-w-none -translate-x-1/2 object-contain object-bottom sm:h-[320px] md:left-auto md:right-0 md:h-[335px] md:translate-x-0"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
