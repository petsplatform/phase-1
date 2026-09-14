import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Truck, Percent, Tag } from 'lucide-react';
import { taxApi } from '../../api/taxApi';
import { couponApi } from '../../api/couponApi';
import { shipmentChargeApi } from '../../api/shipmentChargeApi';

const APPLIED_COUPON_KEY = 'paws_care_applied_coupon';

export default function CheckoutSummary({ 
  items = [], 
  discount = 0,
  setDiscount,
  appliedCoupon,
  setAppliedCoupon,
  couponCode,
  setCouponCode,
  addToast
}) {
  const [taxRate, setTaxRate] = useState(0);
  const [taxName, setTaxName] = useState('Estimated Tax');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLabel, setShippingLabel] = useState('');

  useEffect(() => {
    taxApi
      .getActive()
      .then((activeTax) => {
        setTaxRate(Number(activeTax?.rate || 0));
        setTaxName(activeTax?.name || 'Estimated Tax');
      })
      .catch(() => {
        setTaxRate(0);
        setTaxName('Estimated Tax');
      });
  }, []);

  useEffect(() => {
    couponApi
      .list()
      .then((coupons) => setAvailableCoupons(Array.isArray(coupons) ? coupons : []))
      .catch(() => setAvailableCoupons([]));
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);
  }, [items]);

  useEffect(() => {
    let active = true;
    if (!subtotal || subtotal <= 0) {
      setShippingCost(0);
      setShippingLabel('');
      return;
    }

    shipmentChargeApi
      .resolveChargeInfo(subtotal)
      .then(({ charge, matched }) => {
        if (active) {
          setShippingCost(Number(charge || 0));
          setShippingLabel(matched?.label || matched?.name || '');
        }
      })
      .catch(() => {
        if (active) {
          setShippingCost(0);
          setShippingLabel('');
        }
      });

    return () => {
      active = false;
    };
  }, [subtotal]);

  const getCouponLabel = (coupon) => {
    if (coupon.type === 'percentage') return `${coupon.value}% off`;
    return `$${Number(coupon.value || coupon.discountAmount || 0).toFixed(2)} off`;
  };

  const applyCouponCode = async (code) => {
    setCouponError('');
    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const coupon = await couponApi.validate(cleanCode, subtotal, 0);
      const nextDiscount = Number(coupon.discountAmount || coupon.discount || 0);
      setAppliedCoupon(coupon.code);
      setDiscount(nextDiscount);
      localStorage.setItem(APPLIED_COUPON_KEY, JSON.stringify({ ...coupon, discountAmount: nextDiscount }));
      if (addToast) addToast(`${coupon.code} applied successfully.`, 'success', 'Coupon Applied');
    } catch (error) {
      setAppliedCoupon('');
      setDiscount(0);
      localStorage.removeItem(APPLIED_COUPON_KEY);
      setCouponError(error.message || 'Invalid coupon code.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    applyCouponCode(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setDiscount(0);
    setCouponCode('');
    setCouponError('');
    localStorage.removeItem(APPLIED_COUPON_KEY);
    if (addToast) addToast('Coupon removed.', 'info', 'Coupon Removed');
  };

  const shipping = shippingCost;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = (taxableAmount * taxRate) / 100;
  const total = subtotal - discount + shipping + tax;

  return (
    <div className="bg-brand-surface border border-brand-border/60 p-6 rounded-[2rem] shadow-sm space-y-4 text-left relative sticky top-24">
      <h3 className="font-heading font-black text-lg text-brand-text border-b border-brand-border/40 pb-2">
        Your Order Review
      </h3>

      {/* Cart item summary list */}
      <div className="max-h-60 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-3 text-xs">
            <img 
              src={item.product.image} 
              alt={item.product.name} 
              className="w-12 h-12 object-cover rounded-lg border border-brand-border/30 bg-brand-bg shrink-0" 
            />
            <div className="flex-grow min-w-0">
              <h4 className="font-heading font-black text-brand-text truncate flex items-center gap-1">
                <span className="truncate">{item.product.name}</span>
                {(item.prescriptionRequired || item.product?.prescriptionRequired || item.requiresPrescription) && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">Rx</span>
                )}
              </h4>
              <p className="font-sans text-[10px] text-brand-muted mt-0.5">
                Qty: {item.quantity} {item.option && `· ${item.option}`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-heading font-bold text-brand-text">${(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <hr className="border-brand-border/40" />

      {/* Coupon Application Form */}
      <div className="pt-1.5 pb-1">
        <span className="block text-[10px] font-heading font-bold text-brand-muted uppercase tracking-wider mb-2">
          Apply Coupon Code
        </span>
        {!appliedCoupon && availableCoupons.length > 0 && (
          <div className="mb-3 space-y-2">
            <span className="block text-[10px] font-heading font-bold text-brand-muted uppercase tracking-wider">
              Available Coupons
            </span>
            <div className="flex flex-wrap gap-2">
              {availableCoupons.slice(0, 4).map((coupon) => {
                const disabled = isApplyingCoupon || (coupon.minOrder && subtotal < Number(coupon.minOrder));
                return (
                  <button
                    key={coupon.id || coupon.code}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setCouponCode(coupon.code);
                      applyCouponCode(coupon.code);
                    }}
                    className={`rounded-xl border px-3 py-2 text-left transition-all ${
                      disabled
                        ? 'border-brand-border/60 bg-brand-bg/40 text-brand-muted cursor-not-allowed'
                        : 'border-brand-teal/25 bg-brand-teal/5 text-brand-teal hover:bg-brand-teal/10 cursor-pointer'
                    }`}
                  >
                    <span className="block font-heading text-[11px] font-black uppercase leading-none">{coupon.code}</span>
                    <span className="mt-1 block font-sans text-[10px] leading-none">
                      {getCouponLabel(coupon)}
                      {coupon.minOrder ? ` on $${Number(coupon.minOrder).toFixed(0)}+` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-brand-teal/10 text-brand-teal rounded-xl px-3 py-2 text-xs font-heading font-bold border border-brand-teal/20">
            <span className="truncate flex items-center gap-1.5">
              <Tag size={12} className="fill-current" />
              <span>Code: <strong>{appliedCoupon}</strong></span>
            </span>
            <button 
              type="button" 
              onClick={handleRemoveCoupon} 
              className="text-brand-coral hover:underline font-heading font-black text-[9px] uppercase ml-1.5 tracking-wider shrink-0"
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="space-y-1.5">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-grow min-w-0 px-3 py-2 rounded-xl border border-brand-border bg-white text-xs text-brand-text focus:outline-none focus:border-brand-teal font-sans uppercase"
              />
              <button
                type="submit"
                disabled={isApplyingCoupon}
                className="px-4 py-2 bg-brand-teal hover:bg-brand-deep-teal text-white font-heading font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer animate-fade-in"
              >
                {isApplyingCoupon ? 'Checking...' : 'Apply'}
              </button>
            </div>
            {couponError && (
              <p className="text-[10px] text-brand-coral font-heading font-bold pl-1 leading-none">{couponError}</p>
            )}
          </form>
        )}
      </div>

      <hr className="border-brand-border/40" />

      {/* Summary prices */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-brand-muted">
          <span>Items Subtotal</span>
          <span className="font-semibold text-brand-text">${subtotal.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <>
            <div className="flex justify-between text-brand-teal">
              <span>Discount</span>
              <span className="font-semibold">-${discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-brand-muted">
              <span>Taxable Amount</span>
              <span className="font-semibold text-brand-text">${taxableAmount.toFixed(2)}</span>
            </div>
          </>
        )}

        <div className="flex justify-between text-brand-muted">
          <span>{taxName} ({taxRate.toFixed(2)}%)</span>
          <span className="font-semibold text-brand-text">${tax.toFixed(2)}</span>
        </div>

        {(shipping > 0 || shippingLabel) && (
          <div className="flex justify-between text-brand-muted">
            <span>{shippingLabel || "Shipping"}</span>
            <span className="font-semibold text-brand-text">
              ${shipping.toFixed(2)}
            </span>
          </div>
        )}

        <hr className="border-brand-border/40" />

        <div className="flex justify-between text-sm font-heading font-black text-brand-text">
          <span>Final Total</span>
          <span className="text-base text-brand-coral">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-brand-bg/50 p-3 rounded-xl border border-brand-border/40 flex items-center gap-2 text-[9px] text-brand-muted">
        <ShieldCheck className="text-brand-teal shrink-0" size={16} />
        <span>SSL checkout ensures all contact and address details remain fully secure and protected.</span>
      </div>
    </div>
  );
}
