import api from "./axios";

export const prescriptionApi = {
  uploadPrescription: async (file) => {
    const formData = new FormData();
    formData.append("prescription", file);

    const res = await api.post("/customer-panel/checkout/prescription", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
};
