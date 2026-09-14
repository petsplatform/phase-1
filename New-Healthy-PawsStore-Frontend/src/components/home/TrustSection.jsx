import { motion } from "framer-motion";
import {
  Headphones,
  Leaf,
  PackageCheck,
  PawPrint,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import trustPets from "../../assets/images/trust-pets.png";

const items = [
  ["Vet Approved", "Products", Stethoscope],
  ["100% Natural", "& Safe", Leaf],
  ["Fast & Free", "Shipping", PackageCheck],
  ["Easy Returns", "& Refunds", RefreshCw],
  ["24/7 Customer", "Support", Headphones],
];

export default function TrustSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-10 border-y border-borderSoft bg-white"
    >
      <div className="relative mx-auto max-w-[1200px] overflow-hidden px-4 pb-7 pt-6 sm:px-6 lg:px-0 lg:pb-0">
        <h2 className="mb-6 flex flex-wrap items-center justify-center gap-3 text-center text-[20px] font-extrabold leading-tight text-textMain sm:gap-4 sm:text-[21px]">
          <PawPrint
            className="text-secondary"
            size={15}
            fill="currentColor"
            aria-hidden="true"
          />
          Why Pet Parents Trust Us
          <PawPrint
            className="text-secondary"
            size={15}
            fill="currentColor"
            aria-hidden="true"
          />
        </h2>
        <div className="mx-auto grid max-w-[830px] grid-cols-2 gap-x-0 gap-y-6 sm:grid-cols-3 lg:mx-0 lg:grid-cols-5 lg:gap-y-0 lg:pb-7">
          {items.map(([lineOne, lineTwo, Icon]) => (
            <article
              key={lineOne}
              className="min-h-[92px] border-borderSoft px-3 text-center odd:border-r sm:odd:border-r-0 sm:[&:not(:nth-child(3n))]:border-r lg:min-h-[86px] lg:border-r lg:last:border-r-0"
            >
              <Icon
                className="mx-auto text-secondary"
                size={33}
                strokeWidth={1.75}
              />
              <h3 className="mt-3 text-[12px] font-extrabold leading-tight text-textMain">
                {lineOne}
                <br />
                {lineTwo}
              </h3>
            </article>
          ))}
        </div>
        <PawPrint
          className="absolute right-[155px] top-7 hidden text-secondary/35 lg:block"
          size={17}
          fill="currentColor"
          aria-hidden="true"
        />
        <PawPrint
          className="absolute bottom-8 right-[315px] hidden text-secondary/20 lg:block"
          size={23}
          fill="currentColor"
          aria-hidden="true"
        />
        <div className="absolute bottom-0 right-0 hidden h-[138px] w-[300px] rounded-[48%_52%_0_0/62%_62%_0_0] bg-sage/35 lg:block" />
        <img
          src={trustPets}
          alt="Dog and cat"
          className="absolute bottom-0 right-4 hidden w-[230px] lg:block"
        />
      </div>
    </motion.section>
  );
}
