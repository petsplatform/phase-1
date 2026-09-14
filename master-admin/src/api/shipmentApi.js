import api from "./axios";
import { isSuperAdmin } from "../lib/api";

export const shipmentApi = {
  listShipments: async (params) => {
    const response = await api.get("/shipments", { params });
    return response.data.data;
  },
  getShipment: async (orderId, options = {}) => {
    const response = await api.get(`/orders/${orderId}/shipment`, {
      headers: options.storeKey ? { "x-store-key": options.storeKey } : undefined,
    });
    return response.data.data;
  },
  saveShipment: async (orderId, payload, exists = false) => {
    const response = exists
      ? await api.put(`/orders/${orderId}/shipment`, payload)
      : await api.post(`/orders/${orderId}/shipment`, payload);
    return response.data.data;
  },
  updateStatus: async (orderId, payload) => {
    const response = await api.put(`/orders/${orderId}/shipment/status`, payload);
    return response.data.data;
  },
  cancelShipment: async (orderId) => {
    const response = await api.delete(`/orders/${orderId}/shipment`);
    return response.data.data;
  },
  getShipmentLabelHtml: async (orderId) => {
    const encodedId = encodeURIComponent(orderId);
    const path = isSuperAdmin()
      ? `/super-admin/orders/${encodedId}/shipment-label`
      : `/orders/${encodedId}/shipment-label`;
    const response = await api.get(path, {
      responseType: "text",
      suppressToast: true,
    });
    return response.data;
  },
  bulkShipments: async (payload) => {
    const response = await api.post("/shipments/bulk", payload);
    return response.data.data;
  },
  listCouriers: async () => {
    const response = await api.get("/couriers");
    return response.data.data;
  },
  createCourier: async (payload) => {
    const response = await api.post("/couriers", payload);
    return response.data.data;
  },
  updateCourier: async (id, payload) => {
    const response = await api.put(`/couriers/${id}`, payload);
    return response.data.data;
  },
  deleteCourier: async (id) => {
    const response = await api.delete(`/couriers/${id}`);
    return response.data.data;
  },
  getSettings: async () => {
    const response = await api.get("/shipment-settings");
    return response.data.data;
  },
  updateSettings: async (payload) => {
    const response = await api.put("/shipment-settings", payload);
    return response.data.data;
  },
};
