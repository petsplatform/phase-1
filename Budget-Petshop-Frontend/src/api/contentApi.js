import api from "./axios";

export const contentApi = {
  getStoreContent: async () => {
    const res = await api.get("/customer-panel/store/content", {
      params: { t: Date.now() },
    });
    return res.data.data;
  },

  getAnnouncement: async () => {
    const res = await api.get("/content/announcement", {
      params: { t: Date.now() },
    });
    return res.data.data;
  },

  getSettings: async () => {
    const res = await api.get("/settings");
    return res.data.data;
  },
};
