import api from "./axios";

export const auditApi = {
  getLogs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "all") query.set(k, v);
    });
    const qs = query.toString();
    return api.get(`/audit-logs${qs ? `?${qs}` : ""}`).then((r) => r.data);
  },
};
