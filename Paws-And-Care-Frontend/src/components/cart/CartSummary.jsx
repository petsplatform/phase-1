import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Percent, ShieldCheck } from "lucide-react";
import { taxApi } from "../../api/taxApi";
import { shipmentChargeApi } from "../../api/shipmentChargeApi";
import { useAuth } from "../../context/AuthContext";
import { isVetOnly } from "../../utils/productUtils";

export default function CartSummary({ items = [], onCheckout }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [taxRate, setTaxRate] = useState(0);
  const [taxName, setTaxName] = useState("Estimated Tax");
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLabel, setShippingLabel] = useState("");

  const hasVetRestriction = items.some(
    (item) => isVetOnly(item.product || item) && !user?.isVetVerified,
  );

  useEffect(() => {
    taxApi
      .getActive()
      .then((activeTax) => {
        setTaxRate(Number(activeTax?.rate || 0));
        setTaxName(activeTax?.name || "Estimated Tax");
      })
      .catch(() => {
        setTaxRate(0);
        setTaxName("Estimated Tax");
      });
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce(
      (acc, curr) => acc + curr.product.price * curr.quantity,
      0,
    );
  }, [items]);

  useEffect(() => {
    let active = true;
    if (!subtotal || subtotal <= 0) {
      setShippingCost(0);
      setShippingLabel("");
      return;
    }

    shipmentChargeApi
      .resolveChargeInfo(subtotal)
      .then(({ charge, matched }) => {
        if (active) {
          setShippingCost(Number(charge || 0));
          setShippingLabel(matched?.label || matched?.name || "");
        }
      })
      .catch(() => {
        if (active) {
          setShippingCost(0);
          setShippingLabel("");
        }
      });

    return () => {
      active = false;
    };
  }, [subtotal]);

  const totalItems = useMemo(() => {
    return items.reduce((acc, curr) => acc + Number(curr.quantity), 0);
  }, [items]);

  const discount = 0;
  const shipping = shippingCost;

  const taxableAmount = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const tax = useMemo(() => {
    return (taxableAmount * taxRate) / 100;
  }, [taxableAmount, taxRate]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount + shipping + tax);
  }, [subtotal, discount, shipping, tax]);

  return (
    <div className="bg-brand-surface border border-brand-peach/60 p-6 rounded-[2rem] shadow-sm space-y-5 text-left relative w-full text-brand-text">
      <h2 className="font-heading font-black text-xl border-b border-brand-border/40 pb-2.5">
        Order Summary
      </h2>

      <div className="pt-3 border-t border-brand-border/40 space-y-2 text-xs font-sans">
        <div className="flex justify-between">
          <span className="text-brand-muted">Item Count</span>
          <span className="font-semibold">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-brand-muted">Subtotal</span>
          <span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-brand-teal font-heading font-bold">
            <span className="flex items-center gap-1">
              <Percent size={11} />
              <span>Discount</span>
            </span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between">
            <span className="text-brand-muted">Taxable Amount</span>
            <span className="font-semibold">${taxableAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-brand-muted">
            {taxName} ({taxRate.toFixed(2)}%)
          </span>
          <span className="font-semibold">${tax.toFixed(2)}</span>
        </div>

        {(shippingCost > 0 || shippingLabel) && (
          <div className="flex justify-between">
            <span className="text-brand-muted">{shippingLabel || ""}</span>
            <span className="font-semibold">${shippingCost.toFixed(2)}</span>
          </div>
        )}
      </div>

      <hr className="border-brand-border/40" />

      <div className="flex justify-between items-center py-1">
        <span className="font-heading font-black text-sm uppercase">Total</span>
        <span className="text-brand-coral text-xl sm:text-2xl font-heading font-black tracking-tight">
          ${total.toFixed(2)}
        </span>
      </div>

      {hasVetRestriction && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs flex flex-col gap-2 text-left">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-800">
            <ShieldCheck size={16} className="text-amber-600" />
            <span>Verified Veterinarian Required</span>
          </div>
          <p className="font-semibold text-amber-700">
            Your cart contains product(s) exclusive to verified veterinarians.
            Order placement is restricted until vet verification is approved.
          </p>
          <button
            onClick={() =>
              navigate(user ? "/profile?tab=vet-verification" : "/login")
            }
            className="self-start mt-1 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
          >
            Apply for Verification
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row lg:flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0 || hasVetRestriction}
          className="flex-grow w-full inline-flex items-center justify-center gap-2 h-11 sm:h-12 bg-brand-coral hover:bg-brand-coral-dark text-white rounded-xl font-heading font-black text-xs sm:text-sm transition-all shadow-xs hover:shadow active:scale-95 disabled:bg-brand-border disabled:text-brand-muted disabled:cursor-not-allowed group cursor-pointer"
        >
          <span>
            {hasVetRestriction
              ? "Vet Verification Required"
              : "Secure Checkout"}
          </span>
          <ArrowRight
            size={14}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </button>

        <Link
          to="/shop"
          className="flex-grow w-full inline-flex items-center justify-center h-11 sm:h-12 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal/5 rounded-xl font-heading font-black text-xs sm:text-sm transition-all text-center leading-none"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="pt-2 flex items-start gap-2 text-[10px] text-brand-muted border-t border-brand-border/40">
        <ShieldCheck size={16} className="text-brand-teal shrink-0 mt-0.5" />
        <p className="font-sans leading-relaxed text-[9px] text-left">
          Secure payment checkout ensures fully encrypted personal data
          transfer. Standard returns apply.
        </p>
      </div>
    </div>
  );
}
