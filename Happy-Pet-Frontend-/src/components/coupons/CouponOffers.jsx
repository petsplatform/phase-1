import { useEffect, useState } from "react";
import { Copy, TicketPercent } from "lucide-react";
import toast from "react-hot-toast";
import { couponApi } from "../../api/couponApi";
import { copyToClipboard } from "../../utils/clipboardUtils";

function formatCoupon(coupon) {
  if (coupon.type === "percentage") return `${Number(coupon.value || 0)}% OFF`;
  return `$${Number(coupon.value || 0).toFixed(2)} OFF`;
}

function formatExpiry(expiry) {
  if (!expiry) return "No expiry";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(expiry));
}

export default function CouponOffers() {
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

  const copyCode = async (code) => {
    await copyToClipboard(code);
    toast.success(`Coupon ${code} copied.`);
  };

  if (coupons.length === 0) return null;

  return (
    <section className="mb-10 text-left">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-3.5 bg-brand-purple rounded-full block" />
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-brand-purple">
          Available Coupons
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {coupons.map((coupon) => (
          <button
            key={coupon.id || coupon.code}
            type="button"
            onClick={() => copyCode(coupon.code)}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-brand-purple/10 bg-white p-4 text-left shadow-sm transition hover:border-brand-purple/25 hover:shadow-md"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-purple/5 text-brand-purple flex items-center justify-center shrink-0">
                <TicketPercent className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-brand-purple">
                  {formatCoupon(coupon)}
                </p>
                <p className="text-[11px] font-bold text-brand-brown/60">
                  Min ${Number(coupon.minOrder || 0).toFixed(2)} - Expires {formatExpiry(coupon.expiry)}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-purple px-3 py-2 text-[11px] font-extrabold text-white">
              {coupon.code}
              <Copy className="w-3.5 h-3.5" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
