import { motion } from "framer-motion";
import { Headphones, PawPrint } from "lucide-react";
import deliveryTruck from "../../assets/images/delivery-truck.png";

export default function OfferBanners() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto grid max-w-[1100px] gap-6 px-4 pb-0 pt-8 sm:px-6 md:grid-cols-2 lg:px-0"
    >
      <article className="relative min-h-[190px] overflow-hidden rounded-[14px] bg-card p-6 shadow-card sm:p-8">
        <h2 className="relative z-10 text-[28px] font-extrabold leading-none text-secondaryDark sm:text-[32px]">Free Shipping</h2>
        <p className="relative z-10 mt-2 max-w-[190px] text-[17px] font-bold leading-tight text-textMain sm:text-[20px]">on orders over $49</p>
        <a href="/products" className="relative z-10 mt-7 inline-flex h-[38px] items-center justify-center gap-2 rounded-[10px] bg-white px-5 text-[13px] font-extrabold text-secondaryDark shadow-card transition-transform hover:scale-105" aria-label="Shop Now">
          <PawPrint size={14} fill="currentColor" aria-hidden="true" />
          Shop Now
        </a>
        <img src={deliveryTruck} alt="HealthyPawsStore delivery truck" className="absolute bottom-6 right-3 w-[178px] sm:right-10 sm:w-[245px]" />
      </article>
      <article className="relative min-h-[190px] overflow-hidden rounded-[14px] bg-card p-6 shadow-card sm:p-8">
        <div className="relative z-10 max-w-[240px]">
          <h2 className="text-[28px] font-extrabold leading-none text-secondaryDark sm:text-[32px]">Have Questions?</h2>
          <p className="mt-3 text-[17px] font-bold leading-tight text-textMain sm:text-[20px]">We're here to help!</p>
          <a href="/contact" className="mt-7 inline-flex h-[38px] items-center justify-center gap-2 rounded-[10px] bg-white px-5 text-[13px] font-extrabold text-secondaryDark shadow-card transition-transform hover:scale-105" aria-label="Contact Us">
            <PawPrint size={14} fill="currentColor" aria-hidden="true" />
            Contact Us
          </a>
        </div>
        <Headphones className="absolute right-10 top-1/2 hidden -translate-y-1/2 text-secondary/70 md:block" size={96} strokeWidth={1.8} aria-hidden="true" />
      </article>
    </motion.section>
  );
}
