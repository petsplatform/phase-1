import test from "node:test";
import assert from "node:assert/strict";

import { calculateCheckoutTotals } from "./checkoutTotals.js";

test("matches the backend total when a coupon is applied", () => {
  const totals = calculateCheckoutTotals({
    subtotal: 109,
    cartDiscount: 16.35,
    shipping: 0,
    taxRate: 10,
    couponDiscount: 9.26,
  });

  assert.deepEqual(totals, {
    subtotal: 109,
    cartDiscount: 16.35,
    shipping: 0,
    taxableAmount: 83.39,
    tax: 8.34,
    couponBaseAmount: 92.65,
    couponValidationSubtotal: 109,
    couponDiscount: 9.26,
    total: 91.73,
  });
});

test("matches the backend total without a coupon", () => {
  const totals = calculateCheckoutTotals({
    subtotal: 109,
    cartDiscount: 16.35,
    shipping: 0,
    taxRate: 10,
  });

  assert.equal(totals.tax, 9.27);
  assert.equal(totals.total, 101.92);
});
