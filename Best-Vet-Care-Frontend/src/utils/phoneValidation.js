export const PHONE_VALIDATION_MESSAGE = "Please enter a valid phone number.";

export const isValidPhone = (phone) => {
  const value = String(phone || "").trim();
  if (!value) return false;
  if (!/^\+?[0-9\s\-()]+$/.test(value)) return false;

  const digitCount = value.replace(/\D/g, "").length;
  return digitCount >= 7 && digitCount <= 15;
};

export const trimFormValues = (form) =>
  Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, String(value || "").trim()]),
  );
