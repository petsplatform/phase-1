import api from "./axios";

const AUTO_ORDER_BASE = "/orders/auto-orders";

export const autoOrderApi = {
  getMetrics: async () => {
    const response = await api.get(`${AUTO_ORDER_BASE}/metrics`);
    return response.data.data;
  },

  getAll: async (params) => {
    const response = await api.get(AUTO_ORDER_BASE, { params });
    return response.data.data || [];
  },

  getById: async (id) => {
    const response = await api.get(`${AUTO_ORDER_BASE}/${id}`);
    return response.data.data;
  },

  runDue: async () => {
    const response = await api.post(`${AUTO_ORDER_BASE}/run-due`);
    return response.data.data;
  },

  update: async (id, payload) => {
    const response = await api.patch(`${AUTO_ORDER_BASE}/${id}`, payload);
    return response.data.data;
  },

  pause: async (id) => {
    const response = await api.post(`${AUTO_ORDER_BASE}/${id}/pause`);
    return response.data.data;
  },

  resume: async (id) => {
    const response = await api.post(`${AUTO_ORDER_BASE}/${id}/resume`);
    return response.data.data;
  },

  cancel: async (id) => {
    const response = await api.post(`${AUTO_ORDER_BASE}/${id}/cancel`);
    return response.data.data;
  },
};
