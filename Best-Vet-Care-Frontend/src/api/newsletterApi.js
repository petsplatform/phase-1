import api from "./axios";

export const newsletterApi = {
  subscribe: async ({ email, name = "", source = "website" }) => {
    const res = await api.post("/customer-panel/subscribe", { email, name, source }, { skipAuth: true });
    return res.data?.data;
  },
};
