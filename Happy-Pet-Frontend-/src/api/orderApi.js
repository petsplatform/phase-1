import api from "./axios";

const getVariantId = (variant = {}) =>
  variant.id || variant._id || variant.variantId || variant.familyVariantId || "";

const getVariantLabel = (variant = {}) =>
  variant.label || variant.name || variant.displayName || variant.title || "";

const getCatalogVariants = (product = {}) => [
  ...(Array.isArray(product.optionVariants) ? product.optionVariants : []),
  ...(Array.isArray(product.familyVariants) ? product.familyVariants : []),
  ...(Array.isArray(product.variants) ? product.variants : []),
];

const isUsableVariant = (variant) => variant && variant.isAvailable !== false && variant.active !== false;

// Product-card/cart data can contain a display-only ID (for example,
// "productId-option"). The order API requires the real catalog variant ID.
const resolveOrderVariants = async (payload) => {
  if (!Array.isArray(payload?.items) || payload.items.length === 0) return payload;

  const items = await Promise.all(
    payload.items.map(async (item) => {
      const productId = item.productId;
      const variantId = item.variantId || item.selectedVariantId;
      const looksSynthetic = productId && variantId && String(variantId).startsWith(`${productId}-`);

      if (!productId || (!looksSynthetic && variantId)) return item;

      try {
        const response = await api.get(`/customer-panel/catalog/products/${encodeURIComponent(productId)}`);
        const product = response.data?.data || {};
        const variants = getCatalogVariants(product).filter(isUsableVariant);
        if (variants.length === 0) return item;

        const selectedLabel = String(
          item.variantLabel || item.optionLabel || item.selectedOption || item.selectedSize || "",
        ).trim().toLowerCase();
        const currentVariant = variants.find(
          (variant) => String(getVariantId(variant)) === String(variantId),
        );
        const matchingVariant =
          currentVariant ||
          variants.find((variant) => {
            const label = String(getVariantLabel(variant)).trim().toLowerCase();
            return selectedLabel && (label === selectedLabel || selectedLabel.includes(label) || label.includes(selectedLabel));
          }) ||
          variants[0];
        const resolvedVariantId = getVariantId(matchingVariant);
        if (!resolvedVariantId) return item;

        return {
          ...item,
          variantId: resolvedVariantId,
          selectedVariantId: resolvedVariantId,
          variantLabel: item.variantLabel || getVariantLabel(matchingVariant),
        };
      } catch {
        // Let the backend return its normal validation message if the catalog
        // lookup is unavailable.
        return item;
      }
    }),
  );

  return { ...payload, items };
};

export const orderApi = {
  quoteOrder: async (payload) => {
    const res = await api.post("/customer-panel/orders/quote", payload);
    return res.data.data;
  },

  createOrder: async (payload) => {
    const orderPayload = await resolveOrderVariants(payload);
    const res = await api.post("/customer-panel/orders", orderPayload);
    return res.data.data;
  },

  getMyOrders: async () => {
    const res = await api.get("/customer-panel/orders");
    return res.data.data || [];
  },

  getOrders: async () => {
    const res = await api.get("/customer-panel/orders");
    return res.data.data || [];
  },

  getOrderById: async (id) => {
    const res = await api.get(`/customer-panel/orders/${encodeURIComponent(id)}`);
    return res.data.data;
  },

  cancelOrder: async (id) => {
    const res = await api.patch(`/customer-panel/orders/${encodeURIComponent(id)}/cancel`);
    return res.data.data;
  },
};
