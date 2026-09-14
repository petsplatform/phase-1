import api from './axios';

export const settingsApi = {
  getSettings: async () => {
    const res = await api.get('/settings', { skipAuth: true });
    return res.data.data;
  },
};
