import { motion, useReducedMotion } from "framer-motion";
import { PawPrint, ShoppingCart } from "lucide-react";

export default function WishlistSummary({ summary, onMoveAll }) {
  const reduceMotion = useReducedMotion();
  const empty = summary.count === 0;

  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="rounded-[18px] border border-borderSoft bg-white p-6 shadow-[0_10px_28px_var(--color-shadow)]"
      aria-labelledby="wishlist-summary-title"
    >
      <h2
        id="wishlist-summary-title"
        className="flex items-center gap-3 font-display text-[22px] font-extrabold text-textMain"
      >
        <PawPrint size={19} className="text-secondary" fill="currentColor" />
        Wishlist Summary
      </h2>

      <dl className="mt-6 grid gap-4 text-[14px] font-semibold text-textMain">
        <div className="flex items-center justify-between gap-4">
          <dt>Total Items</dt>
          <dd className="font-extrabold">{summary.count}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>Total Price</dt>
          <dd className="font-extrabold">${summary.total.toFixed(2)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>Potential Savings</dt>
          <dd className="font-extrabold text-secondaryDark">
            ${summary.savings.toFixed(2)}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onMoveAll}
        disabled={empty}
        className="mt-7 inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-secondaryDark px-5 text-[15px] font-extrabold text-white transition hover:scale-[1.02] hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        <ShoppingCart size={19} />
        Move All to Cart
      </button>
    </motion.aside>
  );
}
