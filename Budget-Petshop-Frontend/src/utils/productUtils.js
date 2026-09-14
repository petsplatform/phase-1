export function isPrescriptionRequired(product) {
  if (!product) return false;
  return Boolean(
    product.prescriptionRequired ??
    product.isPrescriptionRequired ??
    product.requiresPrescription ??
    product.isPrescription ??
    product.prescription_required ??
    false,
  );
}

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

export function lacksVetAccess(product, customer) {
  if (!isVetOnly(product)) return false;
  if (!customer) return true; // guest / non-logged in user lacks access
  const isVerified = Boolean(
    customer.isVetVerified === true ||
    customer.isVetVerified === "true" ||
    customer.vetVerificationStatus === "Approved" ||
    customer.vetStatus === "Approved" ||
    customer.vetVerification?.status === "Approved",
  );
  return !isVerified;
}

export function isFamilyProduct(product) {
  if (!product) return false;
  const pType = String(
    product.productType || product.type || product.product_type || "",
  )
    .trim()
    .toUpperCase();

  if (pType === "FAMILY") return true;
  if (pType === "SIMPLE") return false;

  return (
    Array.isArray(product.familyVariants) && product.familyVariants.length > 0
  );
}

export function hasVariants(product) {
  if (!product) return false;
  if (isFamilyProduct(product)) return true;
  if (
    Array.isArray(product.familyVariants) &&
    product.familyVariants.length > 0
  )
    return true;
  if (Number(product.variantCount ?? product.variantsCount ?? 0) > 1)
    return true;
  if (
    Array.isArray(product.optionVariants) &&
    product.optionVariants.length > 1
  )
    return true;
  if (Array.isArray(product.variants) && product.variants.length > 1)
    return true;
  if (product.variants && typeof product.variants === "object") {
    if (
      Array.isArray(product.variants.options) &&
      product.variants.options.length > 1
    )
      return true;
  }
  if (
    product.hasVariants === true ||
    product.has_variants === true ||
    product.isVariable === true
  )
    return true;
  const pType = String(
    product.productType || product.type || product.product_type || "",
  )
    .trim()
    .toUpperCase();
  return pType === "VARIABLE" || pType === "VARIANT" || pType === "FAMILY";
}

export function getProductUrl(product) {
  if (!product) return "/shop";
  const id = product.slug || product.id || product.productId;
  if (isFamilyProduct(product)) {
    return `/shop/product/${id}/variants`;
  }
  return `/shop/product/${id}`;
}
