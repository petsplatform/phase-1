import { apiRequest } from "./client";

export const couponApi = {
  async list() {
    return apiRequest(`/customer-panel/coupons?t=${Date.now()}`, {
      cache: "no-store",
    });
  },

  async validate(code, subtotal, discount = 0) {
    return apiRequest("/customer-panel/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, subtotal, discount }),
    });
  },
};
