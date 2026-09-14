export const formatCurrency = (value) =>
  `$${Number(value || 0).toFixed(2)}`;

export const normalizeArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseFlatVariantParts = (variant = {}) => {
  const label = String(variant.label || variant.name || "").trim();
  const explicitPrimary = String(variant.familyVariantName || variant.primaryVariant || "").trim();
  const explicitPack = String(variant.packLabel || variant.pack || "").trim();
  if (explicitPrimary || explicitPack) {
    return {
      primary: explicitPrimary || String(variant.size || variant.weightRange || label).trim(),
      pack: explicitPack || String(variant.dose || variant.packSizeLabel || "").trim(),
    };
  }
  const split = label.split(/\s*(?:\/|\+|\|)\s*/).filter(Boolean);
  if (split.length >= 3) {
    return {
      primary: split.slice(0, -1).join(" / "),
      pack: split[split.length - 1],
    };
  }
  return {
    primary: String(variant.size || variant.weightRange || (split.length > 1 ? split[0] : label)).trim(),
    pack: String(variant.dose || variant.packSizeLabel || (split.length > 1 ? split.slice(1).join(" ") : "")).trim(),
  };
};

const shouldGroupOptionVariants = (optionVariants = []) => {
  if (optionVariants.length < 2) return false;
  const groups = new Map();
  optionVariants.forEach((variant) => {
    const { primary, pack } = parseFlatVariantParts(variant);
    if (!primary || !pack) return;
    const key = primary.toLowerCase();
    groups.set(key, (groups.get(key) || 0) + 1);
  });
  return groups.size > 1 && [...groups.values()].some((count) => count > 1);
};

export const getFamilyVariants = (product = {}) => {
  // An explicit SIMPLE selection from the admin must never be reclassified
  // as a family because its option variants happen to look groupable.
  if (String(product.productType || "").toUpperCase() === "SIMPLE") return [];

  const configured = normalizeArrayField(product.familyVariants);
  if (configured.length > 0) {
    return configured.map((variant, index) => {
      const name = String(
        variant.name ||
          variant.displayName ||
          variant.variantName ||
          variant.label ||
          variant.title ||
          `Variant ${index + 1}`,
      ).trim();
      return {
        ...variant,
        name,
        displayName: variant.name || variant.variantName || variant.label || variant.displayName || name,
        slug: variant.slug || slugify(name),
      };
    });
  }

  const optionVariants = normalizeArrayField(product.optionVariants);
  if (product.productType !== "FAMILY" && !shouldGroupOptionVariants(optionVariants)) {
    return [];
  }

  const groups = new Map();
  optionVariants.forEach((variant, index) => {
    const { primary, pack } = parseFlatVariantParts(variant);
    if (!primary || !pack) return;
    const key = primary.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, {
        id: variant.familyVariantId || `${product.id || "product"}-${slugify(primary)}`,
        name: variant.familyVariantName || variant.variantName || variant.name || variant.label || primary,
        displayName: variant.familyVariantName || variant.variantName || variant.name || variant.label || variant.displayName || primary,
        slug: variant.familyVariantSlug || slugify(primary),
        strength: variant.strength || "",
        weightRange: variant.weightRange && variant.weightRange !== primary ? variant.weightRange : "",
        packColor: variant.packColor || "",
        image: variant.image || variant.mainImage || "",
        gallery: normalizeArrayField(variant.gallery),
        shortDescription: variant.description || variant.details || "",
        content: variant.content || "",
        status: "Active",
        skus: [],
      });
    }
    const regularPrice = Number(variant.pricing?.price ?? variant.regularPrice ?? variant.mrp ?? variant.salePrice ?? variant.price);
    const price = Number(variant.pricing?.finalPrice ?? variant.price ?? variant.sellingPrice ?? regularPrice);
    groups.get(key).skus.push({
      id: variant.id,
      packLabel: pack,
      sku: variant.sku || product.sku,
      regularPrice,
      salePrice: price < regularPrice ? price : null,
      price: price < regularPrice ? price : regularPrice,
      stock: Number(variant.inventory?.stockQuantity ?? variant.stock ?? 0),
      status: variant.status || "Active",
      image: variant.image || "",
    });
  });
  return [...groups.values()];
};

export const buildDemoFamilyVariants = (product = {}) => {
  const basePrice = Number(product.minVariantPrice ?? product.displayPrice ?? product.pricing?.finalPrice ?? product.price ?? 24.99);
  const productId = product.id || product.slug || "product";
  const primaryOptions = normalizeArrayField(product.capacities).length > 2
    ? normalizeArrayField(product.capacities).slice(0, 4).map((label) => String(label))
    : [
        "2-10 lbs (Yellow)",
        "11-20 lbs (Orange)",
        "21-40 lbs (Blue)",
        "41-80 lbs (Green)",
      ];
  const packs = [
    { label: "3 Doses", multiplier: 1 },
    { label: "6 Doses", multiplier: 1.92 },
    { label: "12 Doses", multiplier: 3.75 },
  ];

  return primaryOptions.map((name, variantIndex) => ({
    id: `${productId}-demo-${variantIndex + 1}`,
    name,
    displayName: `${product.name || "Product"} ${name}`,
    slug: slugify(name) || `variant-${variantIndex + 1}`,
    strength: "",
    weightRange: name,
    packColor: name.match(/\(([^)]+)\)/)?.[1] || "",
    image: "",
    gallery: [],
    shortDescription: product.description || "Choose the pack size that fits your pet care plan.",
    content: "",
    status: "Active",
    skus: packs.map((pack, packIndex) => {
      const price = Math.max(1, basePrice * pack.multiplier + variantIndex * 2);
      return {
        id: `${productId}-demo-${variantIndex + 1}-${packIndex + 1}`,
        packLabel: pack.label,
        sku: `${String(product.sku || productId).toUpperCase()}-${variantIndex + 1}${packIndex + 1}`,
        regularPrice: Number((price * 1.25).toFixed(2)),
        salePrice: Number(price.toFixed(2)),
        price: Number(price.toFixed(2)),
        stock: 25,
        status: "Active",
        image: "",
      };
    }),
  }));
};

export const normalizeProductPricing = (product = {}) => {
  const pricing = product.displayPricing || product.pricing || {};
  const finalPrice = Number(product.displayPrice ?? pricing.finalPrice ?? product.price ?? 0);
  const regularPrice = Number(
    product.displayMrp ??
      pricing.price ??
      product.regularPrice ??
      product.oldPrice ??
      product.salePrice ??
      finalPrice,
  );
  const salePrice = pricing.hasDiscount ? finalPrice : null;
  const hasDiscount =
    Boolean(pricing.hasDiscount) || (regularPrice > finalPrice && finalPrice > 0);

  return {
    price: Number.isFinite(finalPrice) ? finalPrice : 0,
    oldPrice: hasDiscount ? regularPrice : null,
    discount: hasDiscount
      ? `${pricing.discountPercentage || Math.round(((regularPrice - finalPrice) / regularPrice) * 100)}% Off`
      : undefined,
    pricing: {
      price: regularPrice,
      salePrice,
      hasDiscount,
      discountPercentage: hasDiscount
        ? pricing.discountPercentage || Math.round(((regularPrice - finalPrice) / regularPrice) * 100)
        : 0,
      finalPrice,
    },
  };
};

const activePricedVariants = (product = {}) =>
  normalizeArrayField(product.optionVariants).filter((variant) => {
    const status = String(variant.status || "Active").toLowerCase();
    const price = Number(variant.pricing?.finalPrice ?? variant.price);
    const stock = Number(variant.inventory?.stockQuantity ?? variant.stock ?? 0);
    return status === "active" && Number.isFinite(price) && price > 0 && stock > 0;
  });

export const hasPurchasableVariants = (product = {}) =>
  Boolean(product.hasVariants) || activePricedVariants(product).length > 0;

export const getProductDisplayPrice = (product = {}) => {
  const variants = activePricedVariants(product);
  if (variants.length === 0) {
    const price = Number(product.displayPrice ?? product.pricing?.finalPrice ?? product.price ?? 0);
    return {
      price,
      mrp: Number(product.displayMrp ?? product.pricing?.price ?? product.oldPrice ?? product.salePrice ?? price),
      label: formatCurrency(price),
      prefix: "",
      hasRange: false,
    };
  }

  const prices = variants.map((variant) => Number(variant.pricing?.finalPrice ?? variant.price));
  const mrps = variants.map((variant) => Number(variant.pricing?.price ?? variant.regularPrice ?? variant.mrp ?? variant.salePrice ?? variant.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minMrp = Math.min(...mrps);
  const maxMrp = Math.max(...mrps);
  const hasRange = minPrice !== maxPrice;

  return {
    price: minPrice,
    mrp: minMrp,
    maxPrice,
    maxMrp,
    label: hasRange ? `From ${formatCurrency(minPrice)}` : formatCurrency(minPrice),
    mrpLabel: minMrp !== maxMrp ? `${formatCurrency(minMrp)} - ${formatCurrency(maxMrp)}` : formatCurrency(minMrp),
    prefix: hasRange ? "From" : "",
    hasRange,
  };
};

export const getSelectedVariantPrice = (product = {}, variantId) => {
  if (!hasPurchasableVariants(product)) {
    return normalizeProductPricing(product);
  }
  if (!variantId) return null;
  const variant = activePricedVariants(product).find((item) => String(item.id) === String(variantId));
  if (!variant) return null;
  const pricing = variant.pricing || {};
  const finalPrice = Number(pricing.finalPrice ?? variant.price ?? 0);
  const regularPrice = Number(pricing.price ?? variant.regularPrice ?? variant.mrp ?? variant.salePrice ?? finalPrice);
  const hasDiscount = regularPrice > finalPrice && finalPrice > 0;
  return {
    price: finalPrice,
    oldPrice: hasDiscount ? regularPrice : null,
    discount: hasDiscount ? `${Math.round(((regularPrice - finalPrice) / regularPrice) * 100)}% Off` : undefined,
    pricing: {
      price: regularPrice,
      salePrice: hasDiscount ? finalPrice : null,
      hasDiscount,
      discountPercentage: hasDiscount ? Math.round(((regularPrice - finalPrice) / regularPrice) * 100) : 0,
      finalPrice,
    },
  };
};

export const normalizeProductInventory = (product = {}) => {
  const inventory = product.inventory || {};
  const familySkus = normalizeArrayField(product.familyVariants).flatMap((variant) => (
    Array.isArray(variant?.skus) ? variant.skus : []
  ));
  const optionVariants = normalizeArrayField(product.optionVariants);
  const variantStock = familySkus.length > 0
    ? familySkus
      .filter((variant) => String(variant.status || "Active").toLowerCase() !== "inactive")
      .reduce((total, variant) => total + Number(variant.stock ?? variant.inventory?.stockQuantity ?? 0), 0)
    : optionVariants.length > 0
      ? optionVariants
        .filter((variant) => String(variant.status || "Active").toLowerCase() !== "inactive")
        .reduce((total, variant) => total + Number(variant.stock ?? variant.inventory?.stockQuantity ?? 0), 0)
      : null;
  const stockQuantity = Number(inventory.stockQuantity ?? (variantStock !== null ? variantStock : product.stock) ?? 0);
  const safeQuantity = Number.isFinite(stockQuantity) ? Math.max(0, stockQuantity) : 0;
  const stockStatus =
    inventory.stockStatus ||
    (safeQuantity <= 0 ? "OUT_OF_STOCK" : safeQuantity <= 5 ? "LOW_STOCK" : "IN_STOCK");

  return {
    stock: safeQuantity,
    inventory: {
      stockQuantity: safeQuantity,
      stockStatus,
      isInStock: inventory.isInStock ?? safeQuantity > 0,
    },
  };
};

export const stockLabel = (product = {}) => {
  const { inventory } = normalizeProductInventory(product);
  if (!inventory.isInStock) return "Out of stock";
  if (inventory.stockStatus === "LOW_STOCK") {
    return `Only ${inventory.stockQuantity} left`;
  }
  return `In stock - ${inventory.stockQuantity} available`;
};

export const mapCatalogProduct = (product = {}) => {
  const familyVariants = getFamilyVariants(product);
  const pricing = normalizeProductPricing(product);
  const inventory = normalizeProductInventory(product);
  const displayPrice = getProductDisplayPrice(product);
  return {
    ...product,
    slug: product.slug || product.id,
    // Keep the product-level price aligned with the available variant used by
    // the listing label, even when the API's stored parent price is stale.
    price: displayPrice.price.toFixed(2),
    oldPrice: pricing.oldPrice ? pricing.oldPrice.toFixed(2) : undefined,
    displayPriceLabel: displayPrice.label,
    displayMrpLabel: displayPrice.mrpLabel,
    pricePrefix: displayPrice.prefix,
    hasVariants: hasPurchasableVariants(product),
    productType: product.productType === "FAMILY" || familyVariants.length > 0 ? "FAMILY" : (product.productType || "SIMPLE"),
    familyVariants,
    variantCount: product.variantCount ?? familyVariants.length,
    minVariantPrice: displayPrice.price,
    maxVariantPrice: displayPrice.maxPrice,
    discount: pricing.discount,
    pricing: pricing.pricing,
    stock: inventory.stock,
    inventory: inventory.inventory,
    optionVariants: normalizeArrayField(product.optionVariants),
    capacities: normalizeArrayField(product.capacities),
    colorVariants: normalizeArrayField(product.colorVariants),
  };
};
