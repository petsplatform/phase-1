import api from './axios';

export const cartApi = {
  getCart: async () => {
    const res = await api.get('/customer-panel/cart');
    return res.data.data || [];
  },
  syncCart: async (items) => {
    const res = await api.put('/customer-panel/cart', { items });
    return res.data.data || [];
  },
  addItem: async (item) => {
    const res = await api.post('/customer-panel/cart/items', { item });
    return res.data.data || [];
  },
  updateItem: async (id, quantity) => {
    const res = await api.patch(`/customer-panel/cart/items/${encodeURIComponent(id)}`, { quantity });
    return res.data.data || [];
  },
  removeItem: async (id) => {
    const res = await api.delete(`/customer-panel/cart/items/${encodeURIComponent(id)}`);
    return res.data.data || [];
  },
  clearCart: async () => {
    const res = await api.delete('/customer-panel/cart');
    return res.data.data || [];
  },
};
