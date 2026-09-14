import { motion, useReducedMotion } from "framer-motion";
import { Truck } from "lucide-react";

export default function FreeShippingProgress({ subtotal, goal }) {
  const reduceMotion = useReducedMotion();
  const remaining = Math.max(goal - subtotal, 0);
  const progress = Math.min((subtotal / goal) * 100, 100);

  return (
    <div className="rounded-xl bg-sageLight px-4 py-3">
      <p className="flex items-center gap-2 text-[13px] font-extrabold text-secondaryDark">
        <Truck size={16} />
        {remaining > 0
          ? `You are $${remaining.toFixed(2)} away from FREE shipping!`
          : "You unlocked FREE shipping!"}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-sage">
          <motion.div
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.55 }}
            className="h-full rounded-full bg-secondaryDark"
          />
        </div>
        <span className="whitespace-nowrap text-[12px] font-semibold text-textMain">
          ${subtotal.toFixed(2)} / ${goal.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
