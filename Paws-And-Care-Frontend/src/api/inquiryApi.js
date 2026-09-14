import api from './axios';

export const inquiryApi = {
  submit: async (payload) => {
    const res = await api.post('/inquiries', payload);
    return res.data.data;
  },
};
