import api from './axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STORE_KEY = import.meta.env.VITE_STORE_KEY || 'STORE_1';

const customerToken = () => {
  try {
    return JSON.parse(localStorage.getItem('petcare_customer_session') || 'null')?.token || '';
  } catch {
    return '';
  }
};

export const orderApi = {
  createOrder: async (orderData) => {
    const res = await api.post('/customer-panel/orders', orderData);
    return res.data.data;
  },

  getCheckoutQuote: async (orderData) => {
    const res = await api.post('/customer-panel/orders/quote', orderData);
    return res.data.data;
  },

  validateCoupon: async (code, subtotal, discount = 0) => {
    const res = await api.post('/customer-panel/coupons/validate', { code, subtotal, discount });
    return res.data.data;
  },

  uploadPrescription: async (file) => {
    const formData = new FormData();
    formData.append('prescription', file);

    const res = await api.post('/customer-panel/checkout/prescription', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  getMyOrders: async () => {
    const res = await api.get('/customer-panel/orders');
    return res.data.data;
  },

  getOrderById: async (id) => {
    const res = await api.get(`/customer-panel/orders/${id}`);
    return res.data.data;
  },

  getShipment: async (id) => {
    const res = await api.get(`/customer/orders/${id}/shipment`);
    return res.data.data;
  },

  getTracking: async (id) => {
    const res = await api.get(`/customer/orders/${id}/tracking`);
    return res.data.data;
  },

  invoiceUrl: (id) => {
    const params = new URLSearchParams();
    const token = customerToken();
    if (token) params.set('token', token);
    if (STORE_KEY) params.set('storeKey', STORE_KEY);
    return `${API_BASE_URL}/customer-panel/orders/${encodeURIComponent(id)}/invoice?${params.toString()}`;
  },
};
