import api from "./axios";

export const shipmentChargeApi = {
  getCharges: async () => {
    const res = await api.get("/customer/shipment-charges");
    return res.data.data || [];
  },

  resolveChargeRule: async (subtotal) => {
    const charges = await shipmentChargeApi.getCharges();
    if (!charges.length) return null;

    const amount = Number(subtotal) || 0;
    const matched = charges.find((charge) => {
      const min = Number(charge.minOrderAmount || 0);
      const max =
        charge.maxOrderAmount === null || charge.maxOrderAmount === undefined
          ? null
          : Number(charge.maxOrderAmount);
      return amount >= min && (max === null || amount <= max);
    });

    return matched
      ? {
          ...matched,
          charge: Number(matched.charge || 0),
          label: matched.label || "Shipping",
        }
      : null;
  },

  resolveCharge: async (subtotal) => {
    const rule = await shipmentChargeApi.resolveChargeRule(subtotal);
    return Number(rule?.charge || 0);
  },
};
