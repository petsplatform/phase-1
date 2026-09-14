export function toMoney(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.round(numberValue * 100) / 100;
}

export function calculateCheckoutTotals({
  subtotal,
  cartDiscount = 0,
  shipping = 0,
  taxRate = 0,
  couponDiscount = 0,
}) {
  const normalizedSubtotal = toMoney(subtotal);
  const normalizedCartDiscount = toMoney(cartDiscount);
  const normalizedShipping = toMoney(shipping);
  const normalizedCouponDiscount = toMoney(couponDiscount);
  const taxableAmount = toMoney(
    Math.max(
      0,
      normalizedSubtotal - normalizedCartDiscount - normalizedCouponDiscount,
    ),
  );
  const tax = toMoney((taxableAmount * Number(taxRate || 0)) / 100);
  // The live order API applies coupons to discounted merchandise only.
  // Shipping and sales tax are not coupon-eligible.
  const couponBaseAmount = toMoney(
    Math.max(0, normalizedSubtotal - normalizedCartDiscount),
  );
  const total = toMoney(
    Math.max(
      0,
      taxableAmount + normalizedShipping + tax,
    ),
  );

  return {
    subtotal: normalizedSubtotal,
    cartDiscount: normalizedCartDiscount,
    shipping: normalizedShipping,
    taxableAmount,
    tax,
    couponBaseAmount,
    couponValidationSubtotal: normalizedSubtotal,
    couponDiscount: normalizedCouponDiscount,
    total,
  };
}
