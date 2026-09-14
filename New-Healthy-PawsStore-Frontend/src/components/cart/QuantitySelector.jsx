import { Minus, Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export default function QuantitySelector({ value, onChange, label, max }) {
  const reduceMotion = useReducedMotion();
  const maxQuantity = Number(max) || 0;
  const hasMax = maxQuantity > 0;

  return (
    <div className="inline-grid h-10 grid-cols-3 overflow-hidden rounded-lg border border-borderSoft bg-white">
      <motion.button
        type="button"
        aria-label={`Decrease quantity for ${label}`}
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        className="grid w-10 place-items-center text-textMain transition hover:bg-sageLight disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-secondary"
      >
        <Minus size={15} />
      </motion.button>
      <span className="grid w-12 place-items-center border-x border-borderSoft text-[14px] font-extrabold text-textMain">
        {value}
      </span>
      <motion.button
        type="button"
        aria-label={`Increase quantity for ${label}`}
        onClick={() => onChange(hasMax ? Math.min(value + 1, maxQuantity) : value + 1)}
        disabled={hasMax && value >= maxQuantity}
        whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        className="grid w-10 place-items-center text-textMain transition hover:bg-sageLight disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-secondary"
      >
        <Plus size={15} />
      </motion.button>
    </div>
  );
}
