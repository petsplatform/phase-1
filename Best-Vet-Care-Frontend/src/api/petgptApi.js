import api from "./axios";

export const petgptApi = {
  chat: async (payload) => {
    const res = await api.post("petgpt/chat", payload, { skipAuth: false });
    return res.data.data;
  },
};
