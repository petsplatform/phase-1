import api from '../helper/axiosInstance';

export const shipmentChargeApi = {
  getCharges: async () => {
    try {
      const res = await api.get('/customer/shipment-charges');
      return res.data?.data || res.data || [];
    } catch (e) {
      console.error('Failed to fetch shipment charges:', e);
      return [];
    }
  },

  resolveChargeInfo: async (subtotal) => {
    const charges = await shipmentChargeApi.getCharges();
    if (!Array.isArray(charges) || !charges.length) {
      return { charge: 0, matched: null };
    }
    const amount = Number(subtotal) || 0;
    if (amount <= 0) {
      return { charge: 0, matched: null };
    }

    // Only rules where amount >= minOrderAmount are eligible
    const eligibleRules = charges.filter((c) => {
      const minAmt = Number(c.minOrderAmount ?? c.minAmount ?? 0);
      return amount >= minAmt;
    });

    if (!eligibleRules.length) {
      return { charge: 0, matched: null };
    }

    // 1. Try exact range match among eligible rules (min <= amount <= max)
    let matched = eligibleRules.find((c) => {
      const maxAmt =
        c.maxOrderAmount != null && c.maxOrderAmount !== ''
          ? Number(c.maxOrderAmount)
          : c.maxAmount != null && c.maxAmount !== ''
          ? Number(c.maxAmount)
          : null;
      return maxAmt == null || amount <= maxAmt;
    });

    // 2. If amount exceeds maxOrderAmount of all eligible rules, pick rule with highest minOrderAmount
    if (!matched) {
      matched = eligibleRules.reduce((prev, curr) => {
        const prevMin = Number(prev.minOrderAmount ?? prev.minAmount ?? 0);
        const currMin = Number(curr.minOrderAmount ?? curr.minAmount ?? 0);
        return currMin >= prevMin ? curr : prev;
      });
    }

    const charge = matched ? Number(matched.charge ?? matched.amount ?? 0) : 0;
    return { charge, matched };
  },

  resolveCharge: async (subtotal) => {
    const info = await shipmentChargeApi.resolveChargeInfo(subtotal);
    return info.charge;
  },
};

export default shipmentChargeApi;
