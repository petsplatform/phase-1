const LOW_STOCK_THRESHOLD = 5;

function toMoney(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.round(numberValue * 100) / 100;
}

function normalizeJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isActive(value) {
  return !["inactive", "disabled", "out_of_stock", "false"].includes(
    String(value || "active").toLowerCase(),
  );
}

function buildPricing(product, variant = null) {
  const productRegularPrice = toMoney(product.salePrice ?? product.price);
  const productSalePrice = product.salePrice ? toMoney(product.price) : null;
  const variantRegularPrice = variant?.regularPrice ?? variant?.mrp ?? variant?.salePrice;
  const variantSalePrice = variant?.price ?? variant?.sellingPrice;

  const regularPrice = toMoney(
    variantRegularPrice ?? productRegularPrice ?? product.price,
  );
  const salePrice =
    variantSalePrice !== undefined && variantSalePrice !== null && variantSalePrice !== ""
      ? toMoney(variantSalePrice)
      : productSalePrice;
  const hasDiscount = salePrice !== null && salePrice > 0 && regularPrice > salePrice;
  const finalPrice = hasDiscount ? salePrice : regularPrice;

  return {
    price: regularPrice,
    salePrice: hasDiscount ? salePrice : null,
    hasDiscount,
    discountPercentage: hasDiscount
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0,
    finalPrice: toMoney(finalPrice),
  };
}

function buildInventory(product, variant = null) {
  const quantity = Math.max(0, Number(variant?.stock ?? product.stock ?? 0));
  const stockStatus =
    quantity <= 0
      ? "OUT_OF_STOCK"
      : quantity <= LOW_STOCK_THRESHOLD
        ? "LOW_STOCK"
        : "IN_STOCK";

  return {
    stockQuantity: quantity,
    stockStatus,
    isInStock: quantity > 0,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  };
}

function buildAggregateInventory(optionVariants = []) {
  const quantity = optionVariants.reduce((total, variant) => {
    if (variant.status !== "Active") return total;
    return total + (Number(variant.stock) || 0);
  }, 0);
  const stockStatus =
    quantity <= 0
      ? "OUT_OF_STOCK"
      : quantity <= LOW_STOCK_THRESHOLD
        ? "LOW_STOCK"
        : "IN_STOCK";

  return {
    stockQuantity: quantity,
    stockStatus,
    isInStock: quantity > 0,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  };
}

function buildOptionVariants(product) {
  const familyVariants = buildFamilyVariants(product);
  if (familyVariants.length > 0) {
    return familyVariants.flatMap((familyVariant) =>
      familyVariant.skus.map((sku) => {
        const normalized = {
          id: sku.id,
          label: `${familyVariant.displayName || familyVariant.name} / ${sku.packLabel}`,
          size: familyVariant.strength || familyVariant.weightRange || familyVariant.displayName || familyVariant.name,
          weightRange: familyVariant.weightRange || "",
          dose: sku.packLabel,
          packSize: null,
          image: sku.image || familyVariant.image || null,
          gallery: familyVariant.gallery || [],
          description: familyVariant.shortDescription || "",
          details: familyVariant.shortDescription || "",
          sku: sku.sku || product.sku,
          status: familyVariant.status === "Active" && sku.status === "Active" ? "Active" : "Inactive",
          price: sku.price,
          regularPrice: sku.regularPrice,
          stock: sku.stock,
          familyVariantId: familyVariant.id,
          familyVariantSlug: familyVariant.slug,
          familyVariantName: familyVariant.name,
          packLabel: sku.packLabel,
        };
        const pricing = buildPricing(product, normalized);
        const inventory = buildInventory(product, normalized);
        return {
          ...normalized,
          pricing,
          inventory,
          price: pricing.finalPrice,
          salePrice: pricing.salePrice,
          stock: inventory.stockQuantity,
          isAvailable: normalized.status === "Active" && inventory.isInStock,
        };
      }),
    );
  }

  const configured = normalizeJsonArray(product.optionVariants);
  if (configured.length > 0) {
    return configured.map((variant, index) => {
      const size = String(variant.size || variant.weightRange || variant.label || "").trim();
      const dose = String(variant.dose || variant.packSizeLabel || "").trim();
      const label = String(
        variant.label ||
          [size, dose].filter(Boolean).join(" + ") ||
          variant.name ||
          "",
      ).trim();
      const normalized = {
        id: String(variant.id || `${product.id}-option-${index + 1}`),
        label,
        size,
        weightRange: String(variant.weightRange || "").trim(),
        dose,
        packSize:
          variant.packSize === undefined || variant.packSize === null || variant.packSize === ""
            ? null
            : Number(variant.packSize),
        image: variant.image || variant.mainImage || null,
        gallery: normalizeJsonArray(variant.gallery),
        description: variant.description || variant.details || "",
        details: variant.details || variant.description || "",
        sku: variant.sku || product.sku,
        status: isActive(variant.status) ? "Active" : "Inactive",
        price: variant.price,
        regularPrice: variant.regularPrice ?? variant.mrp ?? variant.salePrice,
        stock: variant.stock,
      };
      const pricing = buildPricing(product, normalized);
      const inventory = buildInventory(product, normalized);
      return {
        ...normalized,
        pricing,
        inventory,
        price: pricing.finalPrice,
        salePrice: pricing.salePrice,
        stock: inventory.stockQuantity,
        isAvailable: normalized.status === "Active" && inventory.isInStock,
      };
    });
  }

  return normalizeJsonArray(product.capacities).map((label, index) => {
    const pricing = buildPricing(product);
    const inventory = buildInventory(product);
    return {
      id: `${product.id}-option-${index + 1}`,
      label,
      sku: product.sku,
      status: product.status,
      pricing,
      inventory,
      price: pricing.finalPrice,
      salePrice: pricing.salePrice,
      stock: inventory.stockQuantity,
      isAvailable: product.status === "Active" && inventory.isInStock,
    };
  });
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildFamilyVariants(product) {
  // Respect the product structure selected in the admin.
  if (String(product.productType || "").toUpperCase() === "SIMPLE") return [];

  const configured = normalizeJsonArray(product.familyVariants);
  const sourceVariants = configured.length > 0
    ? configured
    : groupOptionVariantsIntoFamily(product);
  return sourceVariants
    .filter((variant) => variant && isActive(variant.status) && variant.enabled !== false)
    .map((variant, index) => {
      // Family variants created by older admin/import flows may use one of
      // these legacy label keys. Preserve the configured name for storefronts.
      const name = String(
        variant.name ||
          variant.displayName ||
          variant.variantName ||
          variant.label ||
          variant.title ||
          "",
      ).trim();
      const id = String(variant.id || `${product.id}-family-${index + 1}`);
      const normalizedVariant = {
        id,
        name,
        displayName: variant.name || variant.variantName || variant.label || variant.displayName || name,
        slug: normalizeSlug(variant.slug || name),
        strength: String(variant.strength || "").trim(),
        weightRange: String(variant.weightRange || "").trim(),
        packColor: String(variant.packColor || "").trim(),
        image: variant.image || variant.mainImage || null,
        gallery: normalizeJsonArray(variant.gallery),
        shortDescription: variant.shortDescription || variant.description || "",
        content: variant.content || variant.details || "",
        status: "Active",
        enabled: true,
        seoTitle: variant.seoTitle || "",
        seoDescription: variant.seoDescription || "",
      };
      const skus = normalizeJsonArray(variant.skus)
        .filter((sku) => sku && isActive(sku.status) && sku.enabled !== false)
        .map((sku, skuIndex) => {
          const regularPrice = toMoney(sku.regularPrice ?? sku.mrp ?? sku.salePrice ?? sku.price);
          const configuredPrice = sku.salePrice ?? sku.price ?? regularPrice;
          const price = toMoney(configuredPrice);
          const salePrice = price < regularPrice ? price : null;
          const normalizedSku = {
            id: String(sku.id || `${id}-sku-${skuIndex + 1}`),
            packLabel: String(sku.packLabel || sku.label || "").trim(),
            sku: sku.sku || product.sku,
            regularPrice,
            salePrice,
            price: salePrice || regularPrice,
            stock: Math.max(0, Number(sku.stock) || 0),
            status: "Active",
            enabled: true,
            image: sku.image || null,
            variantId: id,
            variantSlug: normalizedVariant.slug,
            variantName: name,
          };
          const pricing = buildPricing(product, normalizedSku);
          const inventory = buildInventory(product, normalizedSku);
          return {
            ...normalizedSku,
            pricing,
            inventory,
            isAvailable: inventory.isInStock,
          };
        });
      return { ...normalizedVariant, skus };
    });
}

function parseFlatVariantParts(variant = {}) {
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
  const hasStructuredPack = String(variant.dose || variant.packSizeLabel || "").trim();
  const primary = String(
    variant.size ||
      variant.weightRange ||
      (split.length > 1 ? split[0] : label),
  ).trim();
  const pack = String(
    variant.dose ||
      variant.packSizeLabel ||
      (split.length > 1 ? split.slice(1).join(" ") : ""),
  ).trim();

  return { primary, pack: hasStructuredPack || pack };
}

function shouldGroupOptionVariants(optionVariants = []) {
  if (optionVariants.length < 2) return false;
  const groups = new Map();
  optionVariants.forEach((variant) => {
    const { primary, pack } = parseFlatVariantParts(variant);
    if (!primary || !pack) return;
    const key = primary.toLowerCase();
    groups.set(key, (groups.get(key) || 0) + 1);
  });
  return groups.size > 1 && [...groups.values()].some((count) => count > 1);
}

function groupOptionVariantsIntoFamily(product) {
  const optionVariants = normalizeJsonArray(product.optionVariants);
  if (product.productType && product.productType !== "FAMILY") {
    return [];
  }
  if (!shouldGroupOptionVariants(optionVariants)) {
    return [];
  }

  const groups = new Map();
  optionVariants.forEach((variant, index) => {
    const { primary, pack } = parseFlatVariantParts(variant);
    if (!primary || !pack) return;
    const key = primary.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, {
        id: variant.familyVariantId || `${product.id}-${normalizeSlug(primary)}`,
        name: variant.familyVariantName || variant.variantName || variant.name || variant.label || primary,
        displayName: variant.familyVariantName || variant.variantName || variant.name || variant.label || variant.displayName || primary,
        slug: variant.familyVariantSlug || normalizeSlug(primary),
        strength: variant.strength || "",
        weightRange: variant.weightRange && variant.weightRange !== primary ? variant.weightRange : "",
        packColor: variant.packColor || "",
        image: variant.image || variant.mainImage || null,
        gallery: normalizeJsonArray(variant.gallery),
        shortDescription: variant.description || variant.details || "",
        content: variant.content || "",
        status: "Active",
        enabled: true,
        skus: [],
      });
    }
    const regularPrice = toMoney(variant.regularPrice ?? variant.mrp ?? variant.salePrice ?? variant.price);
    const salePrice = toMoney(variant.price ?? variant.sellingPrice ?? regularPrice);
    groups.get(key).skus.push({
      id: String(variant.id || `${groups.get(key).id}-sku-${groups.get(key).skus.length + 1}`),
      packLabel: pack,
      sku: variant.sku || product.sku,
      regularPrice,
      salePrice: salePrice < regularPrice ? salePrice : null,
      price: salePrice < regularPrice ? salePrice : regularPrice,
      stock: Math.max(0, Number(variant.stock) || 0),
      status: isActive(variant.status) ? "Active" : "Inactive",
      enabled: isActive(variant.status),
      image: variant.image || null,
    });
  });

  return [...groups.values()];
}

function normalizeProduct(product) {
  if (!product) return product;
  const familyVariants = buildFamilyVariants(product);
  const optionVariants = buildOptionVariants(product);
  const primaryVariant =
    optionVariants.find((variant) => variant.isAvailable) ||
    optionVariants.find((variant) => variant.status === "Active") ||
    optionVariants[0] ||
    null;
  const pricing = primaryVariant?.pricing || buildPricing(product);
  const inventory =
    optionVariants.length > 0
      ? buildAggregateInventory(optionVariants)
      : buildInventory(product);

  return {
    ...product,
    pricing,
    inventory,
    optionVariants,
    familyVariants,
    variantCount: familyVariants.length || optionVariants.length,
    productType: familyVariants.length > 0 || product.productType === "FAMILY" ? "FAMILY" : "SIMPLE",
    slug: product.slug || product.id,
    price: pricing.finalPrice,
    salePrice: pricing.salePrice,
    stock: inventory.stockQuantity,
    hasDiscount: pricing.hasDiscount,
    discountPercentage: pricing.discountPercentage,
    stockStatus: inventory.stockStatus,
    isInStock: inventory.isInStock,
    vetOnly: Boolean(product.vetOnly),
  };
}

function findVariant(product, variantId, variantLabel) {
  const variants = buildOptionVariants(product);
  return variants.find(
    (variant) =>
      (variantId && (variant.id === variantId || variant.sku === variantId)) ||
      (variantLabel && variant.label === variantLabel),
  ) || null;
}

module.exports = {
  buildFamilyVariants,
  LOW_STOCK_THRESHOLD,
  buildInventory,
  buildOptionVariants,
  buildPricing,
  findVariant,
  normalizeProduct,
  toMoney,
};
