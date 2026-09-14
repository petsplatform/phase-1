/**
 * Utility function to check if a product requires a valid veterinarian prescription.
 * @param {Object} product - The product object to evaluate.
 * @returns {boolean} True if prescription is required, false otherwise.
 */
export function isPrescriptionRequired(product) {
  if (!product) return false;
  return Boolean(
    product.prescriptionRequired ??
    product.isPrescriptionRequired ??
    product.requiresPrescription ??
    product.isPrescription ??
    product.prescription_required ??
    false
  );
}

/**
 * Utility function to check if a product is restricted to verified veterinarians.
 * Strictly checks dynamic API product boolean/string flags returned by the backend.
 * NO static category IDs or names are hardcoded.
 * @param {Object} product - The product object to evaluate.
 * @returns {boolean} True if vet verification flag is true in API data, false otherwise.
 */
export function isVetOnly(product) {
  if (!product) return false;
  const val =
    product.vetOnly ??
    product.isVetOnly ??
    product.vet_only ??
    product.requiresVet ??
    product.vetRequired ??
    product.isVetRequired ??
    product.isVet ??
    product.vet;

  if (val === true || val === "true" || val === 1 || val === "1") return true;
  return false;
}

/**
 * Utility function to check if customer lacks access for a vet-only product.
 * @param {Object} product - The product object to evaluate.
 * @param {Object} customer - The current user/customer object.
 * @returns {boolean} True if product is vetOnly and customer is not vet verified.
 */
export function lacksVetAccess(product, customer) {
  if (!isVetOnly(product)) return false;
  if (!customer) return true; // guest / non-logged in user lacks access
  const isVerified = Boolean(
    customer.isVetVerified === true ||
    customer.isVetVerified === "true" ||
    customer.vetVerificationStatus === "Approved" ||
    customer.vetStatus === "Approved" ||
    customer.vetVerification?.status === "Approved"
  );
  return !isVerified;
}

export function isFamilyProduct(product) {
  if (!product) return false;
  const pType = String(product.productType || product.type || "").trim().toUpperCase();
  if (pType === "FAMILY") return true;
  if (pType === "SIMPLE") return false;
  if (Array.isArray(product.familyVariants) && product.familyVariants.length > 0) return true;
  if (Array.isArray(product.sizes) && product.sizes.length > 1) return true;
  if (Array.isArray(product.optionVariants) && product.optionVariants.length > 1) return true;
  return false;
}

export function hasVariants(product) {
  if (!product) return false;
  return isFamilyProduct(product);
}

export function getProductUrl(product) {
  if (!product) return "/products";
  const id =
    product.baseProductId ||
    product.productId ||
    (typeof product.id === "string" ? product.id.split("__")[0] : product.id) ||
    product._id ||
    product.slug;
  if (!id) return "/products";
  if (isFamilyProduct(product)) {
    return `/products/${id}/variants`;
  }
  return `/products/${id}`;
}

