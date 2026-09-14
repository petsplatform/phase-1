export function money(value, fallback = 0) {
  const numberValue = Number(
    typeof value === "string" ? value.replace(/[^0-9.-]/g, "") : value,
  );
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export function getProductVariants(product = {}) {
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    return product.sizes.map((s, index) => normalizeVariant(product, s, index));
  }

  const variants = Array.isArray(product.optionVariants) ? product.optionVariants : [];

  if (variants.length > 0) {
    return variants.map((variant, index) => normalizeVariant(product, variant, index));
  }

  return [
    normalizeVariant(
      product,
      {
        id: product.id,
        label: product.optionLabel || "Default",
        status: product.status,
        stock: product.inventory?.stockQuantity ?? product.stock,
        pricing: product.pricing,
        image: product.image,
      },
      0,
    ),
  ];
}

export function normalizeVariant(product = {}, variant = {}, index = 0) {
  const pricing = variant.pricing || {};
  const inventory = variant.inventory || {};
  const regularPrice = money(
    variant.originalPrice ?? pricing.price ?? variant.regularPrice ?? variant.mrp ?? product.oldPrice ?? product.price,
  );
  const finalPrice = money(
    variant.price ?? pricing.finalPrice ?? variant.sellingPrice ?? product.price,
    regularPrice,
  );
  const stock = Math.max(0, Number(variant.stock ?? inventory.stockQuantity ?? product.stock ?? 0) || 0);
  const status = String(variant.status || product.status || "Active");
  const isActive = !["inactive", "disabled", "false"].includes(status.toLowerCase());

  const vImg =
    (typeof variant.image === "string" && variant.image.trim()) ||
    (typeof variant.imageUrl === "string" && variant.imageUrl.trim()) ||
    (typeof variant.mainImage === "string" && variant.mainImage.trim()) ||
    variant.mainImage?.url ||
    variant.image?.url ||
    product.image;

  const vGal = Array.isArray(variant.gallery) && variant.gallery.length > 0
    ? variant.gallery
    : [vImg].filter(Boolean);

  return {
    ...variant,
    id: String(variant.id || `${product.id}-variant-${index + 1}`),
    label: String(variant.displayLabel || variant.label || variant.name || product.optionLabel || "Default").trim(),
    displayLabel: String(variant.displayLabel || variant.label || variant.name || "Default").trim(),
    regularPrice,
    finalPrice,
    stock,
    isAvailable: isActive && stock > 0 && variant.isAvailable !== false,
    image: vImg,
    imageUrl: vImg,
    gallery: vGal,
  };
}

export function getPrimaryVariant(product = {}) {
  const variants = getProductVariants(product);
  return variants[0] || null;
}

export function getFirstAvailableVariant(product = {}) {
  const variants = getProductVariants(product);
  return variants.find((variant) => variant.isAvailable) || variants[0] || null;
}

export function getTotalVariantStock(product = {}) {
  return getProductVariants(product).reduce((total, variant) => {
    if (!variant.isAvailable) return total;
    return total + (Number(variant.stock) || 0);
  }, 0);
}

export function getProductDisplayPricing(product = {}) {
  const variant = getPrimaryVariant(product);
  const price = money(variant?.finalPrice ?? product.price);
  const oldPrice = money(variant?.regularPrice ?? product.oldPrice, price);
  const savings = Math.max(oldPrice - price, 0);
  const discount = oldPrice > price ? `-${Math.round((savings / oldPrice) * 100)}%` : "-0%";

  return { price, oldPrice, savings, discount, variant };
}

export function buildVariantCartItem(product = {}, variant = null, quantity = 1) {
  const selectedVariant = variant || getFirstAvailableVariant(product);
  const price = money(selectedVariant?.finalPrice ?? product.price);
  const stock = Math.max(0, Number(selectedVariant?.stock ?? product.stock ?? 0) || 0);
  const safeQuantity = Math.min(Math.max(1, Number(quantity) || 1), Math.max(stock, 1));

  return {
    ...product,
    id: selectedVariant?.id ? `${product.id}:${selectedVariant.id}` : product.id,
    productId: product.id,
    variantId: selectedVariant?.id,
    variantLabel: selectedVariant?.label,
    selectedVariant,
    title: product.title || product.name || "Product",
    name: product.name || product.title || "Product",
    price,
    oldPrice: money(selectedVariant?.regularPrice ?? product.oldPrice, price),
    quantity: safeQuantity,
    variantStock: stock,
    stock,
    maxQuantity: stock,
  };
}
