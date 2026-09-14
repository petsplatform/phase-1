import { motion, useReducedMotion } from "framer-motion";
import { Trash2 } from "lucide-react";
import QuantitySelector from "./QuantitySelector";

export default function CartItem({
  item,
  selected,
  onSelect,
  onQuantityChange,
  onDelete,
}) {
  const reduceMotion = useReducedMotion();
  const total = item.price * item.quantity;
  const maxQuantity = Number(item.maxQuantity || item.variantStock || item.stock || item.stockQuantity || 0);

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
      className="grid gap-4 border-t border-borderSoft px-4 py-4 md:grid-cols-[44px_minmax(250px,1fr)_120px_158px_120px_48px] md:items-center lg:px-5"
    >
      <label className="flex items-center gap-3 md:block">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onSelect(item.id, event.target.checked)}
          className="size-5 rounded border-borderSoft accent-secondaryDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          aria-label={`Select ${item.title}`}
        />
        <span className="text-[13px] font-bold text-muted md:hidden">
          Select item
        </span>
      </label>

      <div className="grid grid-cols-[90px_1fr] items-center gap-4">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="h-[92px] w-[90px] object-contain"
        />
        <div>
          <h2 className="max-w-[255px] text-[16px] font-extrabold leading-snug text-textMain">
            {item.title}
          </h2>
          <span className="mt-3 inline-flex rounded-md bg-sageLight px-3 py-1 text-[12px] font-bold text-secondaryDark">
            {item.category}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 md:block">
        <span className="text-[12px] font-bold uppercase text-muted md:hidden">
          Price
        </span>
        <span className="text-[16px] font-extrabold text-textMain">
          ${item.price.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 md:block">
        <span className="text-[12px] font-bold uppercase text-muted md:hidden">
          Quantity
        </span>
        <QuantitySelector
          value={item.quantity}
          label={item.title}
          max={maxQuantity}
          onChange={(quantity) => onQuantityChange(item.id, quantity)}
        />
        {/* {maxQuantity > 0 && (
          <span className="mt-1 block text-[11px] font-bold text-muted">
            Stock: {maxQuantity}
          </span>
        )} */}
      </div>

      <div className="flex items-center justify-between gap-4 md:block">
        <span className="text-[12px] font-bold uppercase text-muted md:hidden">
          Total
        </span>
        <span className="text-[16px] font-extrabold text-textMain">
          ${total.toFixed(2)}
        </span>
      </div>

      <button
        type="button"
        aria-label={`Delete ${item.title}`}
        onClick={() => onDelete(item.id)}
        className="grid size-10 place-items-center rounded-lg border border-borderSoft bg-white text-textMain transition hover:border-red hover:text-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        <Trash2 size={17} />
      </button>
    </motion.article>
  );
}
