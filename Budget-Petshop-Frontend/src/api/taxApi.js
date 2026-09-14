import api from "./axios";

export const taxApi = {
  getActive: async () => {
    const res = await api.get("/customer-panel/taxes/active", {
      params: { t: Date.now() },
    });
    return res.data.data || null;
  },
};
