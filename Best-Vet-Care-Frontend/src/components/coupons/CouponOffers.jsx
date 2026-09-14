import { useEffect, useState } from "react";
import { Copy, ShoppingCart, TicketPercent } from "lucide-react";
import { Link } from "react-router-dom";
import { couponApi } from "../../api/couponApi";
import { useToast } from "../../context/ToastContext";
import { useCart } from "../../context/CartContext";

const toMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

function formatCoupon(coupon) {
  if (coupon.type === "percentage") return `${Number(coupon.value || 0)}% OFF`;
  return `$${Number(coupon.value || 0).toFixed(2)} OFF`;
}

function calculateCouponSavings(coupon, subtotal, discount = 0) {
  const baseAmount = Math.max(0, Number(subtotal || 0) - Number(discount || 0));
  if (!coupon || baseAmount <= 0) return 0;
  if (coupon.minOrder && baseAmount < Number(coupon.minOrder)) return 0;
  if (coupon.type === "percentage") {
    return toMoney(Math.min((baseAmount * Number(coupon.value || 0)) / 100, baseAmount));
  }
  if (coupon.type === "flat") {
    return toMoney(Math.min(Number(coupon.value || 0), baseAmount));
  }
  return toMoney(Math.min(Number(coupon.discountAmount || 0), baseAmount));
}

function formatExpiry(expiry) {
  if (!expiry) return "No expiry";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(expiry));
}

export default function CouponOffers({ title = "Available Coupons", subtitle = "Copy a code now and apply it during checkout.", showCheckoutLink = true }) {
  const { showToast } = useToast();
  const { cartItems, subtotal, discount, setAppliedCoupon } = useCart();
  const [coupons, setCoupons] = useState([]);
  const cartHasItems = cartItems.length > 0;

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
      showToast(`Coupon ${code} copied`);
    } catch {
      showToast(`Use coupon code ${code}`);
    }
  };

  const useCoupon = async (coupon) => {
    setAppliedCoupon?.(coupon);
    await copyCode(coupon.code);
  };

  if (!coupons.length) return null;

  return (
    <section className="w-full px-4 sm:px-5 lg:px-5 mt-12 sm:mt-14 md:mt-16 lg:mt-[60px]">
      <div className="w-full max-w-[1320px] mx-auto">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TicketPercent className="h-5 w-5 text-[#d9aa3d]" />
              <h2 className="text-xl font-bold text-[#122a50]">{title}</h2>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#122a50]/60">{subtitle}</p>
          </div>
          {showCheckoutLink && cartHasItems && (
            <Link
              to="/checkout"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#17345f] px-4 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d]"
            >
              <ShoppingCart className="h-4 w-4" />
              Checkout
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {coupons.map((coupon) => {
            const savings = calculateCouponSavings(coupon, subtotal, discount);
            const minOrder = Number(coupon.minOrder || 0);
            const needsMore = cartHasItems && savings <= 0 && minOrder > subtotal;
            return (
              <button
                key={coupon.id || coupon.code}
                type="button"
                onClick={() => useCoupon(coupon)}
                className="relative min-h-[180px] overflow-hidden rounded-2xl bg-[#17345f] px-7 py-7 text-left text-white transition hover:-translate-y-0.5 hover:bg-[#122a50]"
              >
                <TicketPercent className="absolute right-7 top-7 h-16 w-16 text-white/15" />
                <p className="text-sm font-bold uppercase tracking-wide text-white/70">
                  {coupon.code}
                </p>
                <h3 className="mt-2 text-[32px] font-semibold leading-tight">
                  {formatCoupon(coupon)}
                </h3>
                <p className="mt-2 text-sm font-medium text-white/75">
                  Min ${minOrder.toFixed(2)} - Expires {formatExpiry(coupon.expiry)}
                </p>
                <p className="mt-4 text-sm font-extrabold text-[#f8f1df]">
                  {cartHasItems
                    ? savings > 0
                      ? `You save $${savings.toFixed(2)} on your cart`
                      : needsMore
                        ? `Add $${toMoney(minOrder - subtotal).toFixed(2)} more to use this coupon`
                        : "This coupon is not eligible for your current cart"
                    : "Add items to cart to see exact savings"}
                </p>
                <span className="mt-5 inline-flex h-[42px] items-center gap-2 rounded-full bg-[#d9aa3d] px-5 text-sm font-bold text-[#122a50]">
                  Copy Code <Copy className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
