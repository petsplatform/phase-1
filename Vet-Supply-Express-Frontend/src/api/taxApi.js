import api from "./axios";

export const taxApi = {
  getActiveTax: async () => {
    const res = await api.get("/customer-panel/taxes/active");
    return res.data.data;
  },
};
