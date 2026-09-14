import api from './axios';

export const shipmentChargeApi = {
  getCharges: async () => {
    const res = await api.get('/customer/shipment-charges');
    return res.data.data || [];
  },

  resolveCharge: async (subtotal) => {
    const charges = await shipmentChargeApi.getCharges();
    if (!charges.length) return 0;
    const amount = Number(subtotal) || 0;
    const matched = charges.find((c) => {
      const aboveMin = amount >= c.minOrderAmount;
      const belowMax = c.maxOrderAmount == null || amount <= c.maxOrderAmount;
      return aboveMin && belowMax;
    });
    return matched ? matched.charge : 0;
  },
};
