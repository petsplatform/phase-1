const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function parsePrice(price) {
  if (typeof price === "number") {
    return price;
  }

  return Number.parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0;
}

export function formatPrice(value) {
  return currencyFormatter.format(value);
}

export function getCouponByCode(code) {
  const normalizedCode = String(code || "")
    .trim()
    .toUpperCase();
  try {
    if (typeof window === "undefined") return null;
    const storedCoupon = JSON.parse(
      window.localStorage.getItem("budget-petshop-coupon-detail") || "null",
    );
    if (storedCoupon?.code?.toUpperCase() === normalizedCode) {
      return storedCoupon;
    }
  } catch {
    return null;
  }
  return null;
}

export function getCouponDiscount(subtotal, coupon) {
  if (!coupon || subtotal <= 0) {
    return 0;
  }

  const couponType = String(coupon.type || "").toLowerCase();
  const couponAmount = Number(coupon.amount ?? coupon.value ?? 0);
  const rawDiscount =
    couponType === "percent" || couponType === "percentage"
      ? subtotal * (couponAmount / 100)
      : couponAmount;

  return Math.min(subtotal, Math.max(0, Number(rawDiscount.toFixed(2))));
}

export function getCartItemCount(cartItems) {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(cartItems) {
  return cartItems.reduce(
    (sum, item) => sum + parsePrice(item.salePrice) * item.quantity,
    0,
  );
}

export function getShippingCost(subtotal) {
  return 0;
}

export function getEstimatedTax(subtotal, rate = 0) {
  const taxRate = Number(rate || 0);
  return Math.max(0, subtotal) * (taxRate / 100);
}

export function calculateOrderTotals({
  subtotal = 0,
  coupon = null,
  discount,
  taxRate = 0,
  shipping,
} = {}) {
  const safeSubtotal = Math.max(0, Number(subtotal || 0));
  const couponDiscount =
    discount === undefined
      ? getCouponDiscount(safeSubtotal, coupon)
      : Math.min(safeSubtotal, Math.max(0, Number(discount || 0)));
  const discountedSubtotal = Math.max(0, safeSubtotal - couponDiscount);
  const taxableAmount = discountedSubtotal;
  const tax = getEstimatedTax(taxableAmount, taxRate);
  const shippingCost =
    shipping === undefined
      ? getShippingCost(discountedSubtotal)
      : Math.max(0, Number(shipping || 0));
  const grandTotal = Math.max(0, discountedSubtotal + tax + shippingCost);

  return {
    subtotal: safeSubtotal,
    discount: couponDiscount,
    couponDiscount,
    discountedSubtotal,
    taxableAmount,
    tax,
    estimatedTax: tax,
    shipping: shippingCost,
    shippingCost,
    grandTotal,
    orderTotal: grandTotal,
  };
}
