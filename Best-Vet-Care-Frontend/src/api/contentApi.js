import api from './axios';

export const contentApi = {
  getStoreContent: async () => {
    const res = await api.get('/customer-panel/store/content', {
      params: { t: Date.now() },
    });
    return res.data.data;
  },

  getAnnouncement: async () => {
    const res = await api.get('/content/announcement');
    return res.data.data;
  },
};
