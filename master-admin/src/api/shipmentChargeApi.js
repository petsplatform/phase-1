import api from "./axios";

export const shipmentChargeApi = {
  list: () => api.get("/shipment-charges"),
  create: (data) => api.post("/shipment-charges", data),
  update: (id, data) => api.put(`/shipment-charges/${id}`, data),
  remove: (id) => api.delete(`/shipment-charges/${id}`),
};
