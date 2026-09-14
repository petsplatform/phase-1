import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { couponApi } from "../../api/couponApi";

function formatCoupon(coupon) {
  if (coupon.type === "percentage") return `${Number(coupon.value || 0)}% OFF`;
  return `$${Number(coupon.value || 0).toFixed(2)} OFF`;
}

export default function CouponBox({
  coupon,
  onChange,
  onApply,
  onSelectCoupon,
  onRemove,
  loading,
  message,
  messageTone = "success",
  activeCoupon,
}) {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    let active = true;

    couponApi
      .list()
      .then((items) => {
        if (active) setCoupons(Array.isArray(items) ? items : []);
      })
      .catch((error) => {
        console.error("Failed to load coupons:", error);
        if (active) setCoupons([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="rounded-xl bg-sageLight p-4">
      <h3 className="flex items-center gap-3 text-[15px] font-extrabold text-textMain">
        <Ticket size={18} className="text-secondaryDark" />
        Have a Coupon?
      </h3>
      <p className="mt-1 text-[12px] font-semibold text-muted">
        Enter code to get discount
      </p>
      <div className="mt-4 grid overflow-hidden rounded-lg bg-white sm:grid-cols-[1fr_92px]">
        <input
          value={coupon}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter coupon code"
          className="h-12 min-w-0 px-4 text-[13px] font-semibold outline-none placeholder:text-muted"
          disabled={Boolean(activeCoupon)}
        />
        <button
          type="button"
          onClick={() => {
            if (activeCoupon) onRemove();
            else onApply();
          }}
          disabled={loading}
          className="bg-secondaryDark px-5 text-[14px] font-extrabold text-white transition hover:bg-primaryDark disabled:opacity-60"
        >
          {loading ? "..." : activeCoupon ? "Remove" : "Apply"}
        </button>
      </div>
      {message && (
        <p
          className={`mt-2 text-[12px] font-extrabold ${
            messageTone === "error" ? "text-error" : "text-secondaryDark"
          }`}
          aria-live="polite"
        >
          {message}
        </p>
      )}
      <div className="mt-4 border-t border-white/70 pt-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
          Available Coupons
        </p>
        {coupons.length ? (
          <div className="mt-2 grid gap-2">
            {coupons.map((item) => (
              <button
                key={item.id || item.code}
                type="button"
                onClick={() => {
                  onChange(item.code);
                  onSelectCoupon?.(item.code);
                }}
                disabled={Boolean(activeCoupon) || loading}
                className="flex items-center cursor-pointer justify-between rounded-lg bg-white px-3 py-2 text-left text-[12px] font-extrabold text-textMain disabled:opacity-60"
              >
                <span>{item.code}</span>
                <span className="text-secondaryDark">{formatCoupon(item)}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[12px] font-semibold text-muted">
            No active coupons for this store. Add one from Admin &gt; Coupons.
          </p>
        )}
      </div>
    </section>
  );
}
