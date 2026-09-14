import { apiRequest } from "./client";

const DEFAULT_SHIPPING_COUNTRY = "US";

function normalizeAddress(address = {}, index = 0) {
  const addressIndex = Number(address.index ?? index);
  const line2Parts = String(address.line2 || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    ...address,
    id: address.id || `address-${addressIndex}`,
    index: addressIndex,
    label: address.label || "Address",
    isDefault: Boolean(address.isDefault),
    fullName: address.fullName || address.name || "",
    phone: address.phone || "",
    line1: address.line1 || address.address || "",
    city: address.city || line2Parts[0] || "",
    state: address.state || line2Parts[1] || "",
    postalCode: address.postalCode || address.zip || line2Parts[2] || "",
    country: address.country || DEFAULT_SHIPPING_COUNTRY,
  };
}

function withDefaultCountry(address = {}) {
  return {
    ...address,
    country: address.country || DEFAULT_SHIPPING_COUNTRY,
  };
}

export const addressApi = {
  async getAddresses() {
    const result = await apiRequest("/customer-panel/addresses");
    return (Array.isArray(result) ? result : []).map(normalizeAddress);
  },

  async addAddress(address) {
    const result = await apiRequest("/customer-panel/addresses", {
      method: "POST",
      body: JSON.stringify({ address: withDefaultCountry(address) }),
    });
    const addresses = Array.isArray(result) ? result : [result];
    return normalizeAddress(addresses[addresses.length - 1], addresses.length - 1);
  },

  async updateAddress(index, address) {
    const result = await apiRequest(`/customer-panel/addresses/${index}`, {
      method: "PUT",
      body: JSON.stringify({ address: withDefaultCountry(address) }),
    });
    const addresses = Array.isArray(result) ? result : [result];
    return normalizeAddress(addresses[index], index);
  },

  async deleteAddress(index) {
    const result = await apiRequest(`/customer-panel/addresses/${index}`, {
      method: "DELETE",
    });
    return (Array.isArray(result) ? result : []).map(normalizeAddress);
  },
};
