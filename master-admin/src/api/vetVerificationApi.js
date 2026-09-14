import api from "./axios";
import { isSuperAdmin } from "../lib/api";

const basePath = () => (isSuperAdmin() ? "/super-admin/vet-verifications" : "/vet-verifications");

export const vetVerificationApi = {
  list: async (params) => {
    const response = await api.get(basePath(), { params });
    return response.data.data;
  },
  getById: async (id) => {
    const response = await api.get(`${basePath()}/${encodeURIComponent(id)}`);
    return response.data.data;
  },
  approve: async (id) => {
    const response = await api.put(`/vet-verifications/${id}/approve`);
    return response.data.data;
  },
  reject: async (id, remarks) => {
    const response = await api.put(`/vet-verifications/${id}/reject`, { remarks });
    return response.data.data;
  },
};
