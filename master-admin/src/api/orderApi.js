import api from './axios';

export const orderApi = {
  getAllOrders: async (params) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
  
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, statusData) => {
    const response = await api.patch(`/orders/${id}/status`, statusData);
    return response.data;
  },

  deleteOrder: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  }
};
