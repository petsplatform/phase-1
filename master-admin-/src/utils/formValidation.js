import { showToast } from "../lib/toast";

const plainText = (value) =>
  String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

const isBlank = (value) => plainText(value).length === 0;

const isMissing = (value) => {
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof File) return false;
  return value === null || value === undefined || isBlank(value);
};

export function showValidationError(message) {
  showToast({
    type: "error",
    title: "Error",
    message,
  });
}

export function validateRequiredFields(fields) {
  const missing = fields.find((field) => isMissing(field.value));

  if (missing) {
    showValidationError(`${missing.label} is required.`);
    return false;
  }

  return true;
}

export function validatePositiveNumber(value, label, { allowZero = false } = {}) {
  const number = Number(value);
  const valid = Number.isFinite(number) && (allowZero ? number >= 0 : number > 0);

  if (!valid) {
    showValidationError(
      `${label} must be ${allowZero ? "zero or greater" : "greater than zero"}.`,
    );
    return false;
  }

  return true;
}

export function validateSellingPriceWithinMrp(price, mrp) {
  const sellingPrice = Number(price);
  const maximumRetailPrice = Number(mrp);

  if (
    Number.isFinite(sellingPrice) &&
    Number.isFinite(maximumRetailPrice) &&
    maximumRetailPrice >= 0 &&
    sellingPrice > maximumRetailPrice
  ) {
    showValidationError("Selling price cannot be greater than MRP.");
    return false;
  }

  return true;
}
