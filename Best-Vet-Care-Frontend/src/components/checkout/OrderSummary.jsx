import { useEffect, useState } from "react";
import { BadgeDollarSign, Gift, MousePointerClick, ShieldCheck, Tag } from "lucide-react";
import { couponApi } from "../../api/couponApi";
import ConfirmModal from "../common/ConfirmModal";
import { featureFlags } from "../../config/siteNavigation";

const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;
const toMoney = (value) => Math.round(Number(value || 0) * 100) / 100;
const getCouponSavings = (coupon, subtotal, discount = 0) => {
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
};

const OrderSummary = ({
  cartItems,
  subtotal,
  discount,
  shipping,
  tax,
  taxRate = 0,
  total,
  promoDiscount = 0,
  appliedCoupon,
  setAppliedCoupon,
  rewards,
  rewardPointsToRedeem = 0,
  setRewardPointsToRedeem,
  rewardDiscount = 0,
  rewardEarnPoints = 0,
  rewardMaxPoints = 0,
}) => {
  const [promo, setPromo] = useState(appliedCoupon?.code || "");
  const [promoMsg, setPromoMsg] = useState("");
  const [applying, setApplying] = useState(false);
  const [confirmRemovePromo, setConfirmRemovePromo] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const totalQuantity = cartItems.reduce(
    (sum, item) => sum + Math.max(0, Number(item.quantity) || 0),
    0,
  );
  const rewardSettings = rewards?.settings || {};
  const rewardsEnabled = featureFlags.rewardPoints && Boolean(rewardSettings.rewardsEnabled);
  const rewardBalance = Number(rewards?.balance || 0);
  const rewardMinPoints = Math.max(1, Number(rewardSettings.rewardMinRedeemPoints || 1));
  const canRedeemRewards = rewardsEnabled && rewardBalance >= rewardMinPoints && rewardMaxPoints >= rewardMinPoints;
  const enteredRewardPoints = Math.max(0, Number(rewardPointsToRedeem) || 0);

  useEffect(() => {
    queueMicrotask(() => {
      setPromo(appliedCoupon?.code || "");
    });
  }, [appliedCoupon?.code]);

  useEffect(() => {
    let active = true;
    couponApi
      .list()
      .then((items) => {
        if (active) setAvailableCoupons(Array.isArray(items) ? items : []);
      })
      .catch((error) => {
        console.error("Failed to load coupons:", error);
        if (active) setAvailableCoupons([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const applyPromo = async (couponCode = promo) => {
    const code = couponCode.trim();
    if (!code) {
      setPromoMsg("Please enter a coupon code.");
      return;
    }
    if (code.length < 2) {
      setPromoMsg("Coupon code must be at least 2 characters.");
      return;
    }
    setApplying(true);
    try {
      const data = await couponApi.validate(code, subtotal, discount);
      const saved = data?.discountAmount || data?.discount || 0;
      setAppliedCoupon?.(data);
      setPromo(data?.code || code.toUpperCase());
      setPromoMsg(`Promo applied! You saved $${Number(saved).toFixed(2)}.`);
    } catch (err) {
      setAppliedCoupon?.(null);
      setPromoMsg(err.response?.data?.message || "Invalid promo code.");
    } finally {
      setApplying(false);
    }
  };

  const removePromo = () => {
    setAppliedCoupon?.(null);
    setPromo("");
    setPromoMsg("");
    setConfirmRemovePromo(false);
  };

  const updateRewardPoints = (value) => {
    const nextPoints = Math.max(0, Math.min(rewardMaxPoints, Math.floor(Number(value) || 0)));
    setRewardPointsToRedeem?.(nextPoints);
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-5">
      <div className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm text-left">
        <h2 className="text-lg font-extrabold text-[#122a50]">Order Summary</h2>

        <div className="mt-4 space-y-4 border-b border-[#17345f1a] pb-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-[#17345f1a] bg-[#fffdf7] p-1">
                <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#17345f] text-[10px] font-extrabold text-white">
                  {Math.max(0, Number(item.quantity) || 0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#122a50]">{item.name}</p>
                {(item.selectedSize || item.variantId) && (
                  <p className="mt-0.5 truncate text-[11px] font-bold text-[#122a50]/60">
                    {item.optionLabel || "Variant"}: {item.selectedSize?.label || item.variantLabel || item.variantId}
                  </p>
                )}
              </div>
              <span className="text-sm font-extrabold text-[#122a50]">
                {fmt(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2 border-b border-[#17345f1a] pb-4">
          <input
            type="text"
            value={promo}
            maxLength={30}
            onChange={(e) => {
              setPromo(e.target.value.toUpperCase());
              setPromoMsg("");
            }}
            placeholder="Discount code or gift card"
            className="h-10 w-full rounded-lg border border-[#17345f1a] px-3 text-sm font-semibold text-[#122a50] outline-none placeholder:text-[#122a50]/40 focus:border-[#17345f]"
          />
          <button
            type="button"
            onClick={() => applyPromo()}
            disabled={applying || !promo.trim()}
            className="rounded-lg border border-[#17345f] px-4 text-sm font-extrabold text-[#17345f] hover:bg-[#f8f1df] hover:text-[#d9aa3d] hover:border-[#d9aa3d] transition-colors disabled:opacity-60 cursor-pointer"
            aria-disabled={applying || !promo.trim()}
          >
            {applying ? "..." : "Apply"}
          </button>
        </div>
        {promoMsg && (
          <p className={`mt-2 text-xs font-semibold ${promoDiscount > 0 ? "text-[#17345f]" : "text-red-500"}`}>
            {promoMsg}
          </p>
        )}
        {appliedCoupon && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#f8f1df] px-3 py-2 text-xs font-semibold text-[#17345f]">
            <span>{appliedCoupon.code} applied</span>
            <button type="button" onClick={() => setConfirmRemovePromo(true)} className="font-extrabold text-red-600 cursor-pointer">
              Remove
            </button>
          </div>
        )}

        {rewardsEnabled && (
          <div className="mt-3 border-b border-[#17345f1a] pb-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-extrabold text-[#122a50]">
                <Gift className="h-4 w-4 text-[#d9aa3d]" />
                Reward Points
              </span>
              <span className="text-xs font-extrabold text-[#17345f]">{rewardBalance} available</span>
            </div>

            {canRedeemRewards ? (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={rewardMaxPoints}
                    step={1}
                    value={enteredRewardPoints}
                    onChange={(event) => updateRewardPoints(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#17345f1a] px-3 text-sm font-semibold text-[#122a50] outline-none focus:border-[#17345f]"
                    aria-label="Reward points to redeem"
                  />
                  <button
                    type="button"
                    onClick={() => updateRewardPoints(rewardMaxPoints)}
                    className="rounded-lg border border-[#17345f] px-3 text-xs font-extrabold text-[#17345f] transition-colors hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
                  >
                    Max
                  </button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={rewardMaxPoints}
                  step={1}
                  value={enteredRewardPoints}
                  onChange={(event) => updateRewardPoints(event.target.value)}
                  className="w-full accent-[#d9aa3d]"
                  aria-label="Reward points slider"
                />
                <p className="text-xs font-semibold text-[#122a50]/60">
                  Redeem up to {rewardMaxPoints} points on this order.
                </p>
                {rewardDiscount > 0 && (
                  <p className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
                    <BadgeDollarSign className="h-3.5 w-3.5" />
                    Reward discount: {fmt(rewardDiscount)}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs font-semibold text-[#122a50]/60">
                Rewards can be redeemed when your eligible balance and order meet the store rules.
              </p>
            )}
          </div>
        )}

        <div className="mt-3 border-b border-[#17345f1a] pb-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#122a50]/60">
            Available Coupons
          </p>
          {availableCoupons.length ? (
            <div className="mt-2 grid gap-2">
              {availableCoupons.map((item) => {
                const savings = getCouponSavings(item, subtotal, discount);
                const minOrder = Number(item.minOrder || 0);
                const remaining = Math.max(0, minOrder - Math.max(0, subtotal - discount));
                return (
                  <button
                    key={item.id || item.code}
                    type="button"
                    onClick={() => applyPromo(item.code)}
                    disabled={applying || Boolean(appliedCoupon) || savings <= 0}
                    title={`Apply coupon ${item.code}`}
                    className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#17345f1a] bg-[#fffdf7] px-3 py-2 text-left text-xs font-extrabold text-[#122a50] transition hover:border-[#d9aa3d] hover:bg-[#f8f1df] focus:outline-none focus:ring-2 focus:ring-[#d9aa3d]/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-[#d9aa3d]" />
                      <span className="min-w-0">
                        <span className="block truncate underline decoration-[#d9aa3d]/70 underline-offset-4 group-hover:text-[#d9aa3d]">
                          {item.code}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-bold text-[#122a50]/55">
                          {savings > 0 ? `Save ${fmt(savings)} now` : remaining > 0 ? `Add ${fmt(remaining)} more` : "Not eligible"}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-[#d9aa3d]">
                      <span>
                        {item.type === "percentage"
                          ? `${Number(item.value || 0)}% OFF`
                          : `${fmt(item.value)} OFF`}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-[#17345f] shadow-sm group-hover:bg-[#17345f] group-hover:text-white">
                        Apply
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-xs font-semibold text-[#122a50]/60">
              No active coupons for this store. Add one from Admin &gt; Coupons.
            </p>
          )}
        </div>

        <div className="mt-4 space-y-3 border-b border-[#17345f1a] pb-4 text-sm text-[#122a50]">
          <div className="flex justify-between">
            <span className="font-semibold">
              Subtotal ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})
            </span>
            <span className="font-extrabold">{fmt(subtotal)}</span>
          </div>
          {(discount + promoDiscount) > 0 && (
          <div className="flex justify-between">
            <span className="font-semibold">Discount</span>
            <span className="font-extrabold text-[#d9aa3d]">-{fmt(discount + promoDiscount)}</span>
          </div>
          )}
          {rewardDiscount > 0 && (
            <div className="flex justify-between">
              <span className="font-semibold">Reward Points</span>
              <span className="font-extrabold text-emerald-700">-{fmt(rewardDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-semibold">Shipping</span>
            <span className="font-extrabold text-[#d9aa3d]">
              {shipping === 0 ? "Free" : fmt(shipping)}
            </span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between">
              <span className="font-semibold">Tax ({formatRate(taxRate)}%)</span>
              <span className="font-extrabold">{fmt(tax)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-base font-extrabold text-[#122a50]">Total</span>
          <span className="text-xl font-extrabold text-[#17345f]">{fmt(total)}</span>
        </div>

        {(discount + promoDiscount + rewardDiscount) > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#f8f1df] px-3 py-2 text-xs font-semibold text-[#17345f]">
            <Tag className="h-3.5 w-3.5 text-[#d9aa3d]" />
            You saved {fmt(discount + promoDiscount + rewardDiscount)} on this order!
          </div>
        )}
        {rewardsEnabled && rewardEarnPoints > 0 && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <Gift className="h-3.5 w-3.5" />
            You will earn {rewardEarnPoints} points after this purchase.
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-[#17345f1a] bg-white p-4 shadow-sm text-left">
        <ShieldCheck className="h-8 w-8 flex-shrink-0 text-[#17345f]" />
        <div>
          <p className="text-sm font-extrabold text-[#122a50]">Secure Checkout</p>
          <p className="mt-0.5 text-xs font-semibold text-[#122a50]/60">
            Your payment information is 100% secure and protected.
          </p>
        </div>
      </div>
      <ConfirmModal
        open={confirmRemovePromo}
        title="Remove promo?"
        message={`Do you want to remove ${appliedCoupon?.code || "this promo code"} from your order?`}
        confirmLabel="OK"
        onCancel={() => setConfirmRemovePromo(false)}
        onConfirm={removePromo}
      />
    </aside>
  );
};

const formatRate = (value) => Number(value || 0).toFixed(2).replace(/\.?0+$/, "");

export default OrderSummary;
