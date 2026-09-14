import { motion, useReducedMotion } from "framer-motion";
import { Lock, Loader2, PawPrint, ShieldCheck, Star, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FreeShippingProgress from "./FreeShippingProgress";
import { CUSTOMER_BLOCKED_REASON_KEY, AUTH_CHANGE_EVENT } from "../../api/client";
import { getStoredAuthUser } from "../../services/authService";
import { isVetOnly } from "../../utils/productUtils";

export default function OrderSummary({
  items = [],
  itemCount,
  subtotal,
  shipping,
  discount,
  total,
  shippingGoal,
  loading = false,
}) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [blockedReason, setBlockedReason] = useState(() => {
    if (!getStoredAuthUser()) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      return "";
    }
    return localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY) || "";
  });
  const effectiveBlockedReason = getStoredAuthUser() ? blockedReason : "";
  const hasVetRestriction = items.some(
    (item) => isVetOnly(item.product || item) && !getStoredAuthUser()?.isVetVerified
  );
  const empty = loading || itemCount === 0 || Boolean(effectiveBlockedReason) || hasVetRestriction;

  useEffect(() => {
    const handleAuthChange = () => {
      if (!getStoredAuthUser()) {
        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
        setBlockedReason("");
        return;
      }
      const reason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
      setBlockedReason(reason || "");
    };
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="rounded-[22px] border border-borderSoft bg-white p-6 shadow-[0_10px_28px_var(--color-shadow)]"
      aria-labelledby="order-summary-title"
    >
      <h2
        id="order-summary-title"
        className="flex items-center gap-3 font-display text-[25px] font-extrabold text-textMain"
      >
        <PawPrint size={22} className="text-secondary" fill="currentColor" />
        Order Summary
      </h2>

      {effectiveBlockedReason && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-red-100 p-1.5 text-red-600 shrink-0 mt-0.5">
              <ShieldAlert size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-heading font-black text-sm text-red-900">Account Blocked</h4>
              <p className="text-xs font-sans font-bold text-red-700 mt-0.5">{effectiveBlockedReason}</p>
              <p className="text-[10px] font-sans text-red-600 mt-1">Please contact customer support to resolve this issue.</p>
            </div>
          </div>
        </div>
      )}

      <dl className="mt-6 grid gap-4 text-[15px] font-semibold text-textMain">
        <div className="flex items-center justify-between gap-4">
          <dt>Subtotal ({itemCount} items)</dt>
          <dd className="font-extrabold">${subtotal.toFixed(2)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>Shipping</dt>
          <dd className="font-extrabold text-secondaryDark">
            {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
          </dd>
        </div>
      </dl>

      {/* <div className="mt-4">
        <FreeShippingProgress subtotal={subtotal} goal={shippingGoal} />
      </div> */}

      <dl className="mt-4 border-b border-dashed border-borderSoft pb-5 text-[15px] font-semibold text-textMain">
        <div className="flex items-center justify-between gap-4">
          <dt>Discount</dt>
          <dd className="font-extrabold text-secondaryDark">
            -${discount.toFixed(2)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[22px] font-extrabold text-textMain">Total</p>
        </div>
        <div className="text-right">
          <p className="text-[27px] font-extrabold text-textMain">
            ${total.toFixed(2)}
          </p>
          <p className="text-[13px] font-semibold text-muted">(Tax calculated at checkout)</p>
        </div>
      </div>

      <div className="mt-7 flex items-center gap-3 rounded-xl bg-sageLight px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage text-secondaryDark">
          <Star size={18} />
        </span>
        <p className="text-[13px] font-semibold leading-snug text-textMain">
          You will earn <strong>100 Paws Points</strong>
          <br />
          on this order
        </p>
      </div>

      {hasVetRestriction && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs flex flex-col gap-2 text-left">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-800">
            <ShieldCheck size={16} className="text-amber-600" />
            <span>Verified Veterinarian Required</span>
          </div>
          <p className="font-semibold text-amber-700">
            Your cart contains product(s) exclusive to verified veterinarians. Order placement is restricted until vet verification is approved.
          </p>
          <button
            onClick={() => navigate(getStoredAuthUser() ? "/account/vet-verification" : "/login")}
            className="self-start mt-1 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
          >
            Apply for Verification
          </button>
        </div>
      )}

      <a
        href={empty ? "#" : "/checkout"}
        aria-disabled={empty}
        className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-secondaryDark px-5 text-[16px] font-extrabold !text-white transition hover:scale-[1.02] hover:bg-primaryDark hover:!text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${empty ? "pointer-events-none opacity-60" : ""}`}
      >
        {loading ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            Loading Cart...
          </>
        ) : effectiveBlockedReason ? (
          <>
            <ShieldAlert size={17} />
            Account Blocked
          </>
        ) : hasVetRestriction ? (
          <>
            <ShieldCheck size={17} className="text-amber-300" />
            Vet Verification Required
          </>
        ) : (
          <>
            <Lock size={17} fill="currentColor" />
            Proceed to Checkout
          </>
        )}
      </a>

      {/* <button
        type="button"
        disabled={empty}
        className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange px-5 text-[16px] font-extrabold text-textMain transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        Buy Now
      </button> */}

      <p className="mt-4 flex items-center justify-center gap-2 text-[13px] font-semibold text-muted">
        <ShieldCheck size={16} />
        Safe and secure checkout
      </p>
    </motion.aside>
  );
}
