import api from "./axios";
import { normalizeOrder } from "./orderApi";

const DEFAULT_COUNTRY = "United States";

export const normalizeAddress = (address = {}, index = 0) => ({
  id: address.id || String(address.index ?? index),
  index: Number(address.index ?? index),
  title: address.title || (index === 0 ? "Home" : "Saved Address"),
  name: address.name || [address.firstName, address.lastName].filter(Boolean).join(" "),
  street: address.street || address.address || "",
  address: address.address || address.street || "",
  city: address.city || "",
  state: address.state || "",
  zip: address.zip || address.zipCode || "",
  zipCode: address.zipCode || address.zip || "",
  phone: address.phone || "",
  country: address.country || DEFAULT_COUNTRY,
  isDefault: Boolean(address.isDefault || index === 0),
});

const normalizeAddresses = (addresses = []) =>
  Array.isArray(addresses) ? addresses.map(normalizeAddress) : [];

const normalizeDashboard = (dashboard = {}) => ({
  ...dashboard,
  customer: dashboard.customer,
  stats: dashboard.stats || {},
  recentOrders: (dashboard.recentOrders || []).map(normalizeOrder),
  statusSummary: dashboard.statusSummary || {},
});

export const accountApi = {
  getDashboard: async () => {
    const res = await api.get("/customer-panel/dashboard");
    return normalizeDashboard(res.data.data);
  },

  getProfile: async () => {
    const res = await api.get("/customer-panel/profile");
    return res.data.data;
  },

  updateProfile: async (profile) => {
    const res = await api.patch("/customer-panel/profile", profile);
    return res.data.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.post("/customer-panel/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  removeAvatar: async () => {
    const res = await api.delete("/customer-panel/profile/avatar");
    return res.data.data;
  },

  getAddresses: async () => {
    const res = await api.get("/customer-panel/addresses");
    return normalizeAddresses(res.data.data || []);
  },

  addAddress: async (address) => {
    const res = await api.post("/customer-panel/addresses", { address });
    return normalizeAddresses(res.data.data || []);
  },

  updateAddress: async (index, address) => {
    const res = await api.put(`/customer-panel/addresses/${index}`, { address });
    return normalizeAddresses(res.data.data || []);
  },

  removeAddress: async (index) => {
    const res = await api.delete(`/customer-panel/addresses/${index}`);
    return normalizeAddresses(res.data.data || []);
  },

  getVetVerification: async () => {
    const res = await api.get("/customer/vet-verification");
    return res.data.data;
  },

  submitVetVerification: async (payload, reapply = false) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    const res = reapply
      ? await api.put("/customer/vet-verification/reapply", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      : await api.post("/customer/vet-verification", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
    return res.data.data;
  },
};
