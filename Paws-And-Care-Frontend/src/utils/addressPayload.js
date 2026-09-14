export const normalizePhone = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
};

export const splitCityStateZip = (value = "") => {
  if (!value) return { city: "", state: "", postalCode: "" };
  const parts = String(value || "")
    .split(",")
    .map((part) => part.trim());
  if (parts.length >= 3) {
    return {
      city: parts[0] || "",
      state: parts[1] || "",
      postalCode: parts[2] || "",
    };
  }
  if (parts.length === 2) {
    const city = parts[0] || "";
    const stateZipParts = parts[1].split(/\s+/).filter(Boolean);
    const state = stateZipParts[0] || "";
    const postalCode = stateZipParts.slice(1).join(" ") || "";
    return { city, state, postalCode };
  }
  const spaceParts = value.split(/\s+/).filter(Boolean);
  if (spaceParts.length >= 3) {
    const postalCode = spaceParts[spaceParts.length - 1];
    const state = spaceParts[spaceParts.length - 2];
    const city = spaceParts.slice(0, -2).join(" ");
    return { city, state, postalCode };
  }
  return { city: value, state: "", postalCode: "" };
};

export const normalizeAddressForApi = (address = {}, fallback = {}) => {
  if (!address) address = {};
  if (typeof address === "string") {
    try {
      address = JSON.parse(address);
    } catch {
      address = { streetAddress: address, addressLine1: address };
    }
  }

  const cityStateZip = splitCityStateZip(
    address.cityStateZip || address.city_state_zip,
  );
  const fullName =
    address.fullName ||
    address.name ||
    fallback.fullName ||
    [fallback.firstName, fallback.lastName].filter(Boolean).join(" ") ||
    "";

  const phone = normalizePhone(
    address.phone ||
      address.phoneNumber ||
      address.mobile ||
      fallback.phone ||
      fallback.mobile ||
      "",
  );

  const addressLine1 =
    address.addressLine1 ||
    address.streetAddress ||
    address.address ||
    address.street ||
    address.line1 ||
    "";

  const addressLine2 =
    address.addressLine2 ||
    address.apartment ||
    address.apt ||
    address.unit ||
    address.suite ||
    "";

  const city = address.city || cityStateZip.city || "";
  const state = address.state || cityStateZip.state || "";
  const postalCode =
    address.postalCode ||
    address.zip ||
    address.zipCode ||
    address.pincode ||
    address.postal_code ||
    cityStateZip.postalCode ||
    "";
  const country = address.country || fallback.country || "United States";

  return {
    ...address,
    fullName,
    phone,
    phoneNumber: phone,
    addressLine1,
    addressLine2,
    streetAddress: addressLine1,
    apartment: addressLine2,
    city,
    state,
    postalCode,
    zip: postalCode,
    country,
    isDefault: Boolean(address.isDefault),
  };
};
