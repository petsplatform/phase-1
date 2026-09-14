import api from './axios';

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  verifyToken: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: async () => {
    return { success: true };
  }
};
