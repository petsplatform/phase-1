import api from "./axios";

export const settingsApi = {
  getSettings: async () => {
    const res = await api.get("/settings");
    return res.data.data;
  },
};
