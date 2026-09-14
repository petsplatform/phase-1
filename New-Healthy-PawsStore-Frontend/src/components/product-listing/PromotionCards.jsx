import { useEffect, useState } from "react";
import { Copy, PawPrint, TicketPercent } from "lucide-react";
import { couponApi } from "../../api/couponApi";
import { useToast } from "../../context/ToastContext";

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

export default function PromotionCards() {
  const { showToast } = useToast();
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
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Coupon ${code} copied.`, "success");
    } catch {
      showToast(`Use coupon code ${code}.`, "success");
    }
  };

  if (!coupons.length) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-extrabold uppercase text-secondaryDark">
        <PawPrint size={13} fill="currentColor" />
        Available Coupons
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {coupons.map((coupon) => (
          <button
            key={coupon.id || coupon.code}
            type="button"
            onClick={() => copyCode(coupon.code)}
            className="group relative min-h-[158px] overflow-hidden rounded-[12px] bg-secondaryDark px-5 py-6 text-left text-white shadow-card transition hover:-translate-y-0.5"
          >
            <TicketPercent className="absolute right-5 top-5 text-white/30" size={54} />
            <p className="relative z-10 text-[15px] font-extrabold uppercase tracking-wide text-white/70">
              {coupon.code}
            </p>
            <h3 className="relative z-10 mt-2 text-[30px] font-extrabold leading-none">
              {formatCoupon(coupon)}
            </h3>
            <p className="relative z-10 mt-2 text-[13px] font-semibold text-white/80">
              Min ${Number(coupon.minOrder || 0).toFixed(2)} - Expires {formatExpiry(coupon.expiry)}
            </p>
            <span className="relative z-10 mt-5 inline-flex h-9 items-center gap-2 rounded-[8px] bg-white/15 px-4 text-[12px] font-extrabold">
              Copy Code <Copy size={14} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
