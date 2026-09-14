
const QuantitySelector = ({ quantity, onChange, max }) => {
  const hasMax = Number.isFinite(max);
  const atMax = hasMax && quantity >= max;
  const decrease = () => onChange(Math.max(1, quantity - 1));
  const increase = () => {
    if (atMax) return;
    onChange(quantity + 1);
  };

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-[#17345f1a] bg-white">
      <button
        type="button"
        className="flex h-9 w-10 items-center justify-center text-lg font-bold text-[#122a50] transition-colors hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
        onClick={decrease}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className="flex h-9 min-w-10 items-center justify-center border-x border-[#17345f1a] px-3 text-sm font-extrabold text-[#122a50]">
        {quantity}
      </span>
      <button
        type="button"
        disabled={atMax}
        className="flex h-9 w-10 items-center justify-center text-lg font-bold text-[#122a50] transition-colors hover:bg-[#f8f1df] hover:text-[#d9aa3d] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#122a50]"
        onClick={increase}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;
