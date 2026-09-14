import { Lock, ShoppingCart } from "lucide-react";
import CouponBox from "./CouponBox";
import CheckoutProductItem from "./CheckoutProductItem";
import { summaryBenefits } from "./CheckoutBenefits";

export default function OrderSummary({
  items,
  subtotal,
  shipping,
  tax,
  taxRate,
  discount,
  total,
  onPlaceOrder,
  submitting,
  disabled,
  error,
  showCheckoutButton = true,
  coupon,
  setCoupon,
  onApplyCoupon,
  onSelectCoupon,
  onRemoveCoupon,
  couponLoading,
  couponMessage,
  couponMessageTone,
  activeCoupon,
}) {
  const taxableAmount = Math.max(subtotal - discount, 0);

  return (
    <aside className="order-2 lg:order-2 rounded-[22px] border border-borderSoft bg-white p-5 shadow-contact lg:sticky lg:top-6">
      <h2 className="flex items-center gap-3 font-display text-[24px] font-extrabold text-textMain">
        <ShoppingCart className="text-secondaryDark" size={24} />
        Order Summary
      </h2>
      <p className="mt-1 text-[14px] font-semibold text-muted">
        {items.length} Items
      </p>

      <div className="mt-4 divide-y divide-borderSoft">
        {items.map((item) => (
          <CheckoutProductItem key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-5">
        <CouponBox
          coupon={coupon}
          onChange={setCoupon}
          onApply={onApplyCoupon}
          onSelectCoupon={onSelectCoupon}
          onRemove={onRemoveCoupon}
          loading={couponLoading}
          message={couponMessage}
          messageTone={couponMessageTone}
          activeCoupon={activeCoupon}
        />
      </div>

      <dl className="mt-4 grid gap-3 border-t border-dashed border-borderSoft pt-4 text-[14px] font-semibold">
        <Row label="Items Subtotal" value={formatCurrency(subtotal)} />
        <Row
          label="Shipping"
          value={shipping === 0 ? "FREE" : formatCurrency(shipping)}
          success={shipping === 0}
        />
        {discount > 0 && (
          <Row
            label="Discount"
            value={`-${formatCurrency(discount)}`}
            success
          />
        )}
        {discount > 0 && (
          <Row label="Taxable Amount" value={formatCurrency(taxableAmount)} />
        )}
        {taxRate > 0 && (
          <Row
            label={`Sales Tax (${formatRate(taxRate)}%)`}
            value={formatCurrency(tax)}
          />
        )}
      </dl>

      <div className="mt-4 flex items-end justify-between border-t border-dashed border-borderSoft pt-4">
        <strong className="text-[22px] font-extrabold text-textMain">
          Final Total
        </strong>
        <span className="text-right">
          <strong className="block text-[28px] font-extrabold text-textMain">
            {formatCurrency(total)}
          </strong>
        </span>
      </div>
      {discount > 0 && (
        <p className="mt-2 text-right text-[12px] font-extrabold text-secondaryDark">
          Coupon applied to product subtotal.
        </p>
      )}

      <div className="mt-5 grid gap-4">
        {summaryBenefits.map(({ icon: Icon, title, text }) => (
          <article key={title} className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sageLight text-secondaryDark">
              <Icon size={18} />
            </span>
            <span>
              <strong className="block text-[13px] font-extrabold text-textMain">
                {title}
              </strong>
              <span className="text-[12px] font-semibold text-muted">
                {text}
              </span>
            </span>
          </article>
        ))}
      </div>

      {showCheckoutButton && error && (
        <p className="mt-4 rounded-lg bg-sageLight px-4 py-3 text-[13px] font-extrabold text-error">
          {error}
        </p>
      )}

      {showCheckoutButton && (
        <>
          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={disabled || submitting}
            className="mt-6 inline-flex h-13 w-full items-center justify-center gap-3 rounded-xl bg-secondaryDark px-5 py-4 text-[17px] font-extrabold text-white transition hover:scale-[1.01] hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Lock size={18} fill="currentColor" />
            {submitting ? "Processing..." : "Place Order"}
          </button>
          <p className="mt-4 text-center text-[12px] font-semibold leading-relaxed text-muted">
            By placing your order, you agree to our
            <br />
            <a href="#" className="text-secondaryDark">
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a href="#" className="text-secondaryDark">
              Privacy Policy
            </a>
          </p>
        </>
      )}
    </aside>
  );
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatRate(value) {
  return Number(value || 0)
    .toFixed(2);
}

function Row({ label, value, success }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-textMain">{label}</dt>
      <dd
        className={`font-extrabold ${success ? "text-secondaryDark" : "text-textMain"}`}
      >
        {value}
      </dd>
    </div>
  );
}
