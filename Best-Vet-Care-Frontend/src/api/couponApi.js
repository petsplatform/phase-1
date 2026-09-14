import api from './axios';

export const couponApi = {
  list: async () => {
    const res = await api.get('/customer-panel/coupons', {
      params: { t: Date.now() },
    });
    return res.data.data || [];
  },

  validate: async (code, subtotal, discount = 0) => {
    const res = await api.post('/customer-panel/coupons/validate', { code, subtotal, discount });
    return res.data.data;
  },
};
