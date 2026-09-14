import api from "./axios";
//jhfg

// shfgh
export const accountApi = {
  getDashboard: async () => {
    const res = await api.get("/customer-panel/dashboard");
    return res.data.data;
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
    return res.data.data || [];
  },

  addAddress: async (address) => {
    const res = await api.post("/customer-panel/addresses", { address });
    return res.data.data || [];
  },

  updateAddress: async (index, address) => {
    const res = await api.put(`/customer-panel/addresses/${index}`, { address });
    return res.data.data || [];
  },

  removeAddress: async (index) => {
    const res = await api.delete(`/customer-panel/addresses/${index}`);
    return res.data.data || [];
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
