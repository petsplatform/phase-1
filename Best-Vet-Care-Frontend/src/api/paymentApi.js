import api from "./axios";

const getPaymentAmount = (checkoutPayload) => {
  const amount = Number(checkoutPayload?.amount ?? checkoutPayload?.total);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Order total must be greater than zero for online payment.");
  }
  return amount;
};

export const paymentApi = {
  createIntent: async (checkoutPayload, currency = import.meta.env.VITE_STRIPE_CURRENCY || "usd") => {
    const res = await api.post("/customer-panel/payments/create-intent", {
      amount: getPaymentAmount(checkoutPayload),
      currency,
    });
    return res.data.data;
  },

  updateIntentAmount: async (paymentIntentId, checkoutPayload, currency = import.meta.env.VITE_STRIPE_CURRENCY || "usd") => {
    const res = await api.patch(`/customer-panel/payments/${paymentIntentId}`, {
      amount: getPaymentAmount(checkoutPayload),
      currency,
    });
    return res.data.data;
  },
};
