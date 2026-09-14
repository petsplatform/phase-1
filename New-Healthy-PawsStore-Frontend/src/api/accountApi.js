import { apiRequest } from "./client";
import { getStoredAuthUser } from "./authApi";

function normalizeDateInputValue(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const datePart = value.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function normalizeProfile(user = {}) {
  const fallback = getStoredAuthUser() || {};
  const fullName =
    user.name ||
    user.fullName ||
    fallback.name ||
    fallback.fullName ||
    "Pet Parent";
  const dateOfBirth = normalizeDateInputValue(
    user.dateOfBirth || user.dob || fallback.dateOfBirth || fallback.dob,
  );

  return {
    ...user,
    fullName,
    firstName: user.firstName || fullName.split(" ")[0],
    email: user.email || fallback.email || "",
    phone: user.phone || "",
    dateOfBirth,
    dob: dateOfBirth,
    gender: user.gender || fallback.gender || "Prefer not to say",
    avatar: user.avatar || fallback.avatar || "",
    loyaltyPoints: user.loyaltyPoints || 0,
  };
}

export const accountApi = {
  async getProfile() {
    const user = await apiRequest("/customer-panel/profile");
    return normalizeProfile(user);
  },

  async updateProfile(profile) {
    const user = await apiRequest("/customer-panel/profile", {
      method: "PATCH",
      body: JSON.stringify(profile),
    });
    return normalizeProfile(user);
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);

    const user = await apiRequest("/customer-panel/profile/avatar", {
      method: "POST",
      body: formData,
    });
    return normalizeProfile(user);
  },

  async getVetVerification() {
    const data = await apiRequest("/customer/vet-verification");
    return data;
  },

  async submitVetVerification(payload, reapply = false) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    const endpoint = reapply
      ? "/customer/vet-verification/reapply"
      : "/customer/vet-verification";
    const method = reapply ? "PUT" : "POST";
    const data = await apiRequest(endpoint, {
      method,
      body: formData,
    });
    return data;
  },
};
