import api from "./axios";

export const inquiryApi = {
  create: async ({ fullName, email, phone, subject, message }) => {
    const res = await api.post("/inquiries", {
      fullName,
      email,
      phone,
      subject,
      message,
    });
    return res.data.data;
  },

  submit: async (payload) => {
    const res = await api.post("/inquiries", payload);
    return res.data.data;
  },
};
