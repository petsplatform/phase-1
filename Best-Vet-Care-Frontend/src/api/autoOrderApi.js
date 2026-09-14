import api from "./axios";

export const autoOrderApi = {
  create: async (payload) => {
    const res = await api.post("/customer-panel/auto-orders", payload);
    return res.data.data;
  },

  list: async () => {
    const res = await api.get("/customer-panel/auto-orders");
    return res.data.data || [];
  },

  get: async (id) => {
    const res = await api.get(`/customer-panel/auto-orders/${id}`);
    return res.data.data;
  },

  update: async (id, payload) => {
    const res = await api.patch(`/customer-panel/auto-orders/${id}`, payload);
    return res.data.data;
  },

  pause: async (id) => {
    const res = await api.post(`/customer-panel/auto-orders/${id}/pause`);
    return res.data.data;
  },

  resume: async (id) => {
    const res = await api.post(`/customer-panel/auto-orders/${id}/resume`);
    return res.data.data;
  },

  cancel: async (id) => {
    const res = await api.post(`/customer-panel/auto-orders/${id}/cancel`);
    return res.data.data;
  },

  createPaymentSetupIntent: async (id) => {
    const res = await api.post(`/customer-panel/auto-orders/${id}/payment-setup-intent`);
    return res.data.data;
  },

  savePaymentMethod: async (id, setupIntentId) => {
    const res = await api.post(`/customer-panel/auto-orders/${id}/payment-method`, { setupIntentId });
    return res.data.data;
  },
};
