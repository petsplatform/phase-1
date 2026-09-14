import api from './axios';

export const customerApi = {
  getAllCustomers: async (params) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  updateCustomer: async (id, body) => {
    const response = await api.put(`/customers/${id}`, body);
    return response.data;
  },

  updateCustomerStatus: async (id, status) => {
    const response = await api.patch(`/customers/${id}/status`, { status });
    return response.data;
  },

  blockCustomer: async (id, reason) => {
    const response = await api.patch(`/customers/${id}/block`, { reason });
    return response.data;
  },

  unblockCustomer: async (id) => {
    const response = await api.patch(`/customers/${id}/unblock`);
    return response.data;
  },

  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};
