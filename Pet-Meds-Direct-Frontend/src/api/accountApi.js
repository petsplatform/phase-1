import axiosInstance from "../helper/axiosInstance";

export const accountApi = {
  getVetVerification: async () => {
    const res = await axiosInstance.get("/customer/vet-verification");
    return res.data.data;
  },

  submitVetVerification: async (payload, reapply = false) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    const res = reapply
      ? await axiosInstance.put("/customer/vet-verification/reapply", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      : await axiosInstance.post("/customer/vet-verification", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
    return res.data.data;
  },

  getAddresses: async () => {
    const res = await axiosInstance.get("/customer-panel/addresses");
    return res.data?.data || res.data || [];
  },

  addAddress: async (address) => {
    const res = await axiosInstance.post("/customer-panel/addresses", { address });
    return res.data?.data || res.data || [];
  },

  updateAddress: async (id, address) => {
    const res = await axiosInstance.put(`/customer-panel/addresses/${id}`, { address });
    return res.data?.data || res.data || [];
  },

  removeAddress: async (id) => {
    const res = await axiosInstance.delete(`/customer-panel/addresses/${id}`);
    return res.data?.data || res.data || [];
  },
};
