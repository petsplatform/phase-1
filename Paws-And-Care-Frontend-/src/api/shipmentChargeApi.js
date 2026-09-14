import api from "./axios";

export const shipmentChargeApi = {
  getCharges: async () => {
    try {
      const res = await api.get("/customer/shipment-charges");
      const data = res?.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      return [];
    } catch (e) {
      console.error("Failed to fetch shipment charges:", e);
      return [];
    }
  },

  resolveChargeRule: async (subtotal) => {
    const charges = await shipmentChargeApi.getCharges();
    if (!Array.isArray(charges) || !charges.length) return null;

    const amount = Number(subtotal) || 0;
    const activeCharges = charges.filter((c) => {
      const status = String(c.status || c.state || "Active").toLowerCase();
      return status === "active" || status === "enabled" || status === "true";
    });

    const targetList = activeCharges.length ? activeCharges : charges;

    const matched = targetList.find((charge) => {
      const min = Number(charge.minOrderAmount ?? charge.minOrder ?? charge.minAmount ?? charge.min ?? 0);
      const maxVal = charge.maxOrderAmount ?? charge.maxOrder ?? charge.maxAmount ?? charge.max;
      const max =
        maxVal === null || maxVal === undefined || maxVal === ""
          ? null
          : Number(maxVal);

      return amount >= min && (max === null || amount <= max);
    });

    if (!matched) return null;

    const chargeValue = Number(matched.charge ?? matched.amount ?? matched.cost ?? matched.price ?? 0);
    const labelValue = matched.label || matched.name || matched.title || "Shipping Charge";

    return {
      ...matched,
      charge: chargeValue,
      label: labelValue,
    };
  },

  resolveCharge: async (subtotal) => {
    const rule = await shipmentChargeApi.resolveChargeRule(subtotal);
    return Number(rule?.charge || 0);
  },

  resolveChargeInfo: async (subtotal) => {
    const rule = await shipmentChargeApi.resolveChargeRule(subtotal);
    return {
      charge: Number(rule?.charge || 0),
      matched: rule,
    };
  },
};

export default shipmentChargeApi;
