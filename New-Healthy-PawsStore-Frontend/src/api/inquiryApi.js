import { apiRequest } from "./client";

export const inquiryApi = {
  create(values) {
    const phone = values.phone?.trim();

    return apiRequest("/inquiries", {
      method: "POST",
      body: JSON.stringify({
        fullName: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        ...(phone ? { phone } : {}),
        subject: values.subject.trim(),
        message: values.message.trim(),
      }),
    });
  },
};
