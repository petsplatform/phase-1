/**
 * Safely looks up a prescription from the prescriptions map for a given cart item.
 * Supports lookup by item.id, item.productId, item.variantId, or composite productId:variantId.
 */
export function getPrescriptionForItem(prescriptions = {}, item = {}) {
  if (!prescriptions || typeof prescriptions !== "object" || !item) {
    return null;
  }

  // 1. Direct match by item.id
  if (item.id && prescriptions[item.id]) {
    return prescriptions[item.id];
  }

  // 2. Direct match by item.productId
  if (item.productId && prescriptions[item.productId]) {
    return prescriptions[item.productId];
  }

  // 3. Composite key match (productId:variantId)
  if (item.productId && item.variantId) {
    const compositeKey = `${item.productId}:${item.variantId}`;
    if (prescriptions[compositeKey]) {
      return prescriptions[compositeKey];
    }
  }

  // 4. Composite key match with item.id and variantId
  if (item.id && item.variantId) {
    const compositeKey = `${item.id}:${item.variantId}`;
    if (prescriptions[compositeKey]) {
      return prescriptions[compositeKey];
    }
  }

  // 5. Match by item.variantId
  if (item.variantId && prescriptions[item.variantId]) {
    return prescriptions[item.variantId];
  }

  // 6. Partial key matching fallback (e.g. key contains item.productId or item.id)
  const targetId = item.productId || item.id;
  if (targetId) {
    const entry = Object.entries(prescriptions).find(([key, val]) =>
      val && (key === targetId || key.startsWith(`${targetId}:`) || key.endsWith(`:${targetId}`))
    );
    if (entry) {
      return entry[1];
    }
  }

  return null;
}

/**
 * Returns a primary composite key for storing an item's prescription.
 */
export function getPrescriptionKey(item = {}) {
  if (!item) return "";
  if (item.productId && item.variantId) {
    return `${item.productId}:${item.variantId}`;
  }
  if (item.id && item.variantId && !item.id.includes(item.variantId)) {
    return `${item.id}:${item.variantId}`;
  }
  return String(item.id || item.productId || item.variantId || "");
}
