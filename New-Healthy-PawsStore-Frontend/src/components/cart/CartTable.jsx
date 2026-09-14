import { AnimatePresence } from "framer-motion";
import CartActions from "./CartActions";
import CartItem from "./CartItem";

export default function CartTable({
  items,
  selectedIds,
  onSelect,
  onSelectAll,
  onQuantityChange,
  onDelete,
  onRemoveSelected,
}) {
  const allSelected = items.length > 0 && selectedIds.length === items.length;

  return (
    <section
      className="overflow-hidden rounded-[18px] border border-borderSoft bg-white shadow-[0_10px_28px_var(--color-shadow)]"
      aria-label="Shopping cart items"
    >
      <div className="hidden min-h-[48px] grid-cols-[44px_minmax(250px,1fr)_120px_158px_120px_48px] items-center px-5 text-[14px] font-extrabold text-textMain md:grid">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(event) => onSelectAll(event.target.checked)}
          className="size-5 rounded border-borderSoft accent-secondaryDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          aria-label="Select all cart products"
        />
        <span>Product</span>
        <span>Price</span>
        <span>Quantity</span>
        <span>Total</span>
        <span className="sr-only">Delete</span>
      </div>

      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            selected={selectedIds.includes(item.id)}
            onSelect={onSelect}
            onQuantityChange={onQuantityChange}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>

      <CartActions
        count={items.length}
        selectedCount={selectedIds.length}
        allSelected={allSelected}
        onSelectAll={onSelectAll}
        onRemoveSelected={onRemoveSelected}
      />
    </section>
  );
}
