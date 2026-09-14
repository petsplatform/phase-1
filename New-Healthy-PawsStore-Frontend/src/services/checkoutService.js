import { checkoutApi } from "../api/checkoutApi";

export async function requestCheckoutQuote(payload) {
  return {
    ok: true,
    source: "client-estimate",
    payload,
  };
}

export async function applyCouponCode(code, subtotal, discount = 0) {
  return checkoutApi.validateCoupon({ code, subtotal, discount });
}

export function uploadPrescription(file) {
  return checkoutApi.uploadPrescription(file);
}

export function placeCheckoutOrder(payload) {
  return checkoutApi.placeOrder(payload);
}
