import api from './axios';

export const dashboardApi = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
};
