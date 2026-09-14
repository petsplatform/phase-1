import { motion, useReducedMotion } from "framer-motion";
import { Heart, Home, PawPrint, Send } from "lucide-react";
import heroPets from "../../assets/images/wishlist/wishlist-dog-cat.png";

export default function WishlistHero({ count }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="bg-background px-4 pt-6 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1360px]">
        <nav
          className="mb-7 flex items-center gap-2 text-[13px] font-semibold text-muted"
          aria-label="Breadcrumb"
        >
          <Home size={14} className="text-secondaryDark" />
          <a href="/" className="transition-colors hover:text-secondaryDark">
            Home
          </a>
          <span aria-hidden="true">›</span>
          <span className="font-extrabold text-secondaryDark">Wishlist</span>
        </nav>

        <div className="grid items-center gap-4 lg:grid-cols-[48fr_52fr]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -22 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.42 }}
          >
            <h1 className="flex items-center gap-2.5 font-display text-[30px] font-extrabold leading-tight text-textMain sm:gap-4 sm:text-[50px]">
              My Wishlist
              <Heart
                size={30}
                className="text-secondaryDark sm:size-[42px]"
                strokeWidth={1.7}
              />
            </h1>
            <p className="mt-2 text-[15px] font-bold text-textMain sm:mt-6 sm:text-[19px]">
              {count} {count === 1 ? "item" : "items"} saved for your pets
            </p>
            <p className="mt-1 text-[13px] font-semibold text-muted sm:mt-3 sm:text-[15px]">
              Add items you love to your cart and make your pets happy.
            </p>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="relative min-h-[178px] overflow-hidden lg:min-h-[198px]"
          >
            <Heart
              className="absolute left-[10%] top-16 text-sage"
              size={22}
              strokeWidth={1.7}
            />
            <Heart
              className="absolute right-[20%] top-5 text-sage"
              size={21}
              strokeWidth={1.7}
            />
            <PawPrint
              className="absolute left-[24%] top-10 text-sage"
              size={25}
              fill="currentColor"
            />
            <div className="absolute right-[7%] top-8 hidden items-center gap-2 text-secondaryLight md:flex">
              <Send size={44} strokeWidth={1.35} />
              <span className="h-20 w-16 rounded-full border-r border-t border-dashed border-secondaryLight" />
            </div>
            <img
              src={heroPets}
              alt="Happy golden retriever and tabby cat for wishlist page"
              className="relative z-10 ml-auto h-[190px] w-full object-contain object-right-bottom lg:h-[218px]"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
