import api from "./axios";
import { authApi } from "./authApi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORE_KEY = import.meta.env.VITE_STORE_KEY || "STORE_1";

const unwrap = (res) => res.data?.data;

export const supportApi = {
  listConversations: async () => unwrap(await api.get("/customer-panel/support")),
  createConversation: async (payload = {}) => unwrap(await api.post("/customer-panel/support", payload)),
  getConversation: async (id) => unwrap(await api.get(`/customer-panel/support/${encodeURIComponent(id)}`)),
  sendMessage: async (id, payload) => unwrap(await api.post(`/customer-panel/support/${encodeURIComponent(id)}/messages`, payload)),
  markRead: async (id) => unwrap(await api.post(`/customer-panel/support/${encodeURIComponent(id)}/read`)),
  resolve: async (id) => unwrap(await api.post(`/customer-panel/support/${encodeURIComponent(id)}/resolve`)),
  reopen: async (id) => unwrap(await api.post(`/customer-panel/support/${encodeURIComponent(id)}/reopen`)),
  rate: async (id, payload) => unwrap(await api.post(`/customer-panel/support/${encodeURIComponent(id)}/rating`, payload)),
  streamUrl: (conversationId) => {
    const token = authApi.getSession()?.token || "";
    const params = new URLSearchParams({ token });
    if (STORE_KEY) params.set("storeKey", STORE_KEY);
    return `${API_BASE_URL}/customer-panel/support/${encodeURIComponent(conversationId)}/stream?${params.toString()}`;
  },
};
