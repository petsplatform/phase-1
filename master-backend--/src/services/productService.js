const { prisma } = require("../config/db");
const { getTenantContext, runWithTenant } = require("../config/tenantContext");
const { notifySubscribersOfNewProduct } = require("./newsletterService");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");

const includeCategory = { category: true };

async function listProducts({ q, status, petType }) {
  const products = await prisma.product.findMany({
    where: {
      status: status && status !== "All" ? status : undefined,
      petType: petType && petType !== "All" ? petType : undefined,
      OR: q
        ? [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { petType: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ]
        : undefined,
    },
    include: includeCategory,
    orderBy: { createdAt: "desc" },
  });
  return products;
}

async function getProduct(id) {
  let product = await prisma.product.findUnique({
    where: { id },
    include: includeCategory,
  });
  if (!product && typeof prisma.product.findFirst === "function") {
    product = await prisma.product.findFirst({
      where: { slug: id },
      include: includeCategory,
    });
  }
  if (!product) throw new ApiError(404, "Product not found");
  return product;
}

async function createProduct(payload) {
  const data = await normalizeProduct(payload);
  assertPriceNotAboveMrp(data.price, data.salePrice);
  const product = await prisma.product.create({
    data: { id: generateId("product"), ...data },
    include: includeCategory,
  });
  queueNewProductNewsletter(product);
  return product;
}

async function updateProduct(id, payload) {
  await getProduct(id);
  const data = await normalizeProduct(payload);
  assertPriceNotAboveMrp(data.price, data.salePrice);

  // Require at least 1 image before allowing Active status
  if (data.status === "Active") {
    const hasImage = data.image || (Array.isArray(data.gallery) && data.gallery.length > 0) ||
      (Array.isArray(data.colorVariants) && data.colorVariants.some(v => v.mainImage)) ||
      (Array.isArray(data.optionVariants) && data.optionVariants.length > 0);
    if (!hasImage) {
      throw new ApiError(400, "Product must have at least 1 image before it can be set to Active.");
    }
  }
  const product = await prisma.product.update({
    where: { id },
    data,
    include: includeCategory,
  });
  return product;
}

async function patchProduct(id, payload) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Product not found");
  const allowed = ["price", "salePrice", "stock", "status", "shippingReturns", "returnPolicies", "prescriptionRequired", "vetOnly", "optionVariants", "familyVariants", "parentContent", "productDetails", "productType", "seoTitle", "seoDescription"];
  const data = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowed.includes(key)),
  );

  if (data.optionVariants !== undefined) {
    data.optionVariants = normalizeOptionVariants(data.optionVariants);
    assertOptionVariantPrices(data.optionVariants);
    const derived = deriveProductValuesFromVariants(data.optionVariants, {
      price: existing.price,
      salePrice: existing.salePrice,
      stock: existing.stock,
    });
    data.price = derived.price;
    data.salePrice = derived.salePrice;
    data.stock = derived.stock;
  }

  if (data.productType === "SIMPLE") {
    // Product structure is authoritative. A simple product must not be
    // converted to a family merely because the edit payload includes an
    // empty or stale familyVariants field.
    data.familyVariants = [];
  } else if (data.familyVariants !== undefined) {
    data.familyVariants = normalizeFamilyVariants(data.familyVariants);
    const derived = deriveProductValuesFromFamily(data.familyVariants, existing);
    data.price = derived.price;
    data.salePrice = derived.salePrice;
    data.stock = derived.stock;
    data.productType = "FAMILY";
    data.optionVariants = flattenFamilySkus(data.familyVariants);
  }

  if (data.productDetails !== undefined) {
    data.productDetails = normalizeProductDetails(data.productDetails);
  }

  assertPriceNotAboveMrp(
    data.price !== undefined ? data.price : existing.price,
    data.salePrice !== undefined ? data.salePrice : existing.salePrice,
  );

  // Require at least 1 image before allowing Active status
  if (data.status === "Active") {
    const hasImage = existing.image || (Array.isArray(existing.gallery) && existing.gallery.length > 0) ||
      (Array.isArray(existing.colorVariants) && existing.colorVariants.some(v => v.mainImage)) ||
      (Array.isArray(existing.optionVariants) && existing.optionVariants.length > 0);
    if (!hasImage) {
      throw new ApiError(400, "Product must have at least 1 image before it can be set to Active.");
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    include: includeCategory,
  });
  return product;
}

async function deleteProduct(id) {
  await getProduct(id);
  await prisma.product.delete({ where: { id } });
}

async function normalizeProduct(body) {
  const category = await resolveActiveCategory(body);
  const productType = body.productType === "FAMILY" ? "FAMILY" : "SIMPLE";
  const optionVariants = normalizeOptionVariants(body.optionVariants);
  const familyVariants = normalizeFamilyVariants(
    Array.isArray(body.familyVariants) && body.familyVariants.length > 0
      ? body.familyVariants
      : productType === "FAMILY"
        ? groupOptionVariantsIntoFamily(optionVariants, body)
        : [],
  );
  const derived = productType === "FAMILY"
    ? deriveProductValuesFromFamily(familyVariants, body)
    : deriveProductValuesFromVariants(optionVariants, body);

  return {
    name: body.name,
    slug: normalizeSlug(body.slug || body.name),
    description: body.description,
    parentContent: body.parentContent,
    productDetails: normalizeProductDetails(body.productDetails),
    productType,
    familyVariants,
    seoTitle: body.seoTitle,
    seoDescription: body.seoDescription,
    shippingReturns: body.shippingReturns,
    returnPolicies: body.returnPolicies,
    prescriptionRequired: Boolean(body.prescriptionRequired),
    vetOnly: Boolean(body.vetOnly),
    price: derived.price,
    salePrice: derived.salePrice,
    stock: derived.stock,
    sku: body.sku,
    status: body.status,
    image: body.image,
    gallery: body.gallery || [],
    petType: normalizePetType(body.petType),
    optionType: body.optionType || "size",
    optionLabel: body.optionLabel || getDefaultOptionLabel(body.optionType),
    capacities: productType === "FAMILY" ? [] : Array.isArray(body.capacities) ? body.capacities : [],
    colorVariants: Array.isArray(body.colorVariants) ? body.colorVariants : [],
    optionVariants: productType === "FAMILY" ? flattenFamilySkus(familyVariants) : optionVariants,
    categoryId: category.id,
  };
}

function normalizeProductDetails(details = {}) {
  if (!details || typeof details !== "object" || Array.isArray(details)) return {};
  const cleanLines = (items) =>
    Array.isArray(items)
      ? items.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
  return {
    ...details,
    content: stringOrNull(details.content),
    overview: stringOrNull(details.overview),
    benefits: cleanLines(details.benefits),
    directions: cleanLines(details.directions),
    ingredients: stringOrNull(details.ingredients),
    safety: stringOrNull(details.safety),
    faq: Array.isArray(details.faq)
      ? details.faq
          .map((item) => ({
            question: stringOrNull(item?.question),
            answer: stringOrNull(item?.answer),
          }))
          .filter((item) => item.question || item.answer)
      : [],
  };
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeOptionVariants(optionVariants = []) {
  if (!Array.isArray(optionVariants)) return [];
  const normalized = optionVariants
    .filter((variant) => variant && String(variant.label || variant.size || variant.weightRange || variant.dose || "").trim())
    .map((variant, index) => ({
      id: String(variant.id || `variant-${Date.now()}-${index + 1}`),
      label: buildVariantLabel(variant),
      size: stringOrNull(variant.size || variant.weightRange || variant.label),
      weightRange: stringOrNull(variant.weightRange || variant.size),
      dose: stringOrNull(variant.dose),
      packSize:
        variant.packSize === undefined || variant.packSize === null || variant.packSize === ""
          ? null
          : Number(variant.packSize),
      image: stringOrNull(variant.image || variant.mainImage),
      gallery: Array.isArray(variant.gallery) ? variant.gallery : [],
      description: stringOrNull(variant.description || variant.details),
      details: stringOrNull(variant.details || variant.description),
      sku: variant.sku ? String(variant.sku).trim() : null,
      price: variant.price === undefined || variant.price === null || variant.price === ""
        ? null
        : Number(variant.price),
      regularPrice:
        variant.regularPrice === undefined && variant.salePrice === undefined
          ? null
          : Number(variant.regularPrice ?? variant.salePrice),
      stock: variant.stock === undefined || variant.stock === null || variant.stock === ""
        ? null
        : Number(variant.stock),
      status: variant.status === "Inactive" ? "Inactive" : "Active",
    }));

  assertOptionVariantsComplete(normalized);
  assertUniqueOptionVariants(normalized);
  assertOptionVariantNumbers(normalized);
  assertOptionVariantPrices(normalized);
  return normalized;
}

function stringOrNull(value) {
  const nextValue = String(value || "").trim();
  return nextValue || null;
}

function normalizeFamilyVariants(familyVariants = []) {
  if (!Array.isArray(familyVariants)) return [];
  const normalized = familyVariants
    .filter((variant) =>
      variant &&
      String(
        variant.name ||
          variant.displayName ||
          variant.variantName ||
          variant.label ||
          variant.title ||
          "",
      ).trim(),
    )
    .map((variant, index) => {
      const name = String(
        variant.name ||
          variant.displayName ||
          variant.variantName ||
          variant.label ||
          variant.title ||
          "",
      ).trim();
      const id = String(variant.id || `family-variant-${Date.now()}-${index + 1}`);
      const slug = normalizeSlug(variant.slug || name);
      const status = variant.enabled === false || variant.status === "Inactive" ? "Inactive" : "Active";
      const skus = normalizeFamilySkus(variant.skus, { variantId: id, variantName: name, variantSlug: slug });
      return {
        id,
        name,
        // The editable name is authoritative. Do not let an old generated
        // displayName such as "Variant 1" override it.
        displayName: stringOrNull(variant.name || variant.variantName || variant.label || variant.displayName || name),
        slug,
        strength: stringOrNull(variant.strength),
        weightRange: stringOrNull(variant.weightRange),
        packColor: stringOrNull(variant.packColor),
        image: stringOrNull(variant.image || variant.mainImage),
        gallery: Array.isArray(variant.gallery) ? variant.gallery : [],
        shortDescription: stringOrNull(variant.shortDescription || variant.description),
        content: stringOrNull(variant.content),
        status,
        enabled: status === "Active",
        seoTitle: stringOrNull(variant.seoTitle),
        seoDescription: stringOrNull(variant.seoDescription),
        skus,
      };
    });

  assertUniqueFamilyVariants(normalized);
  assertUniqueFamilySkus(normalized);
  return normalized;
}

function normalizeFamilySkus(skus = [], variant) {
  if (!Array.isArray(skus)) return [];
  return skus
    .filter((sku) => sku && String(sku.packLabel || sku.label || "").trim())
    .map((sku, index) => {
      const regularPrice = Number(sku.regularPrice ?? sku.mrp ?? sku.salePrice ?? sku.price);
      const sellingPriceValue = sku.salePrice ?? sku.price ?? regularPrice;
      const salePrice = Number(sellingPriceValue);
      const status = sku.enabled === false || sku.status === "Inactive" ? "Inactive" : "Active";
      return {
        id: String(sku.id || `${variant.variantId}-sku-${index + 1}`),
        variantId: variant.variantId,
        variantSlug: variant.variantSlug,
        variantName: variant.variantName,
        packLabel: String(sku.packLabel || sku.label).trim(),
        sku: String(sku.sku || "").trim(),
        regularPrice,
        salePrice: salePrice < regularPrice ? salePrice : null,
        price: salePrice < regularPrice ? salePrice : regularPrice,
        stock: Number(sku.stock),
        status,
        enabled: status === "Active",
        image: stringOrNull(sku.image),
      };
    });
}

function groupOptionVariantsIntoFamily(optionVariants = [], product = {}) {
  const groups = new Map();
  optionVariants.forEach((option, index) => {
    const { primary, pack } = parseFlatVariantParts(option);
    if (!primary || !pack) return;
    const key = primary.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, {
        id: option.familyVariantId || `${product.id || normalizeSlug(product.name || "product")}-${normalizeSlug(primary)}`,
        name: option.familyVariantName || option.variantName || option.name || option.label || primary,
        displayName: option.familyVariantName || option.variantName || option.name || option.label || option.displayName || primary,
        slug: option.familyVariantSlug || normalizeSlug(primary),
        strength: option.strength || null,
        weightRange: option.weightRange && option.weightRange !== primary ? option.weightRange : null,
        packColor: option.packColor || null,
        image: option.image || null,
        gallery: option.gallery || [],
        shortDescription: option.description || "",
        content: option.content || "",
        status: "Active",
        skus: [],
      });
    }
    const regularPrice = Number(option.regularPrice ?? option.mrp ?? option.salePrice ?? option.price);
    const salePrice = Number(option.price ?? option.sellingPrice ?? regularPrice);
    groups.get(key).skus.push({
      id: option.id,
      packLabel: pack,
      sku: option.sku,
      regularPrice,
      salePrice: salePrice < regularPrice ? salePrice : null,
      price: salePrice < regularPrice ? salePrice : regularPrice,
      stock: option.stock,
      status: option.status,
      image: option.image,
    });
  });
  return [...groups.values()];
}

function parseFlatVariantParts(variant = {}) {
  const label = String(variant.label || variant.name || "").trim();
  const explicitPrimary = stringOrNull(variant.familyVariantName || variant.primaryVariant);
  const explicitPack = stringOrNull(variant.packLabel || variant.pack);
  if (explicitPrimary || explicitPack) {
    return {
      primary: explicitPrimary || stringOrNull(variant.size || variant.weightRange || label),
      pack: explicitPack || stringOrNull(variant.dose || variant.packSizeLabel),
    };
  }
  const split = label.split(/\s*(?:\/|\+|\|)\s*/).filter(Boolean);
  if (split.length >= 3) {
    return {
      primary: stringOrNull(split.slice(0, -1).join(" / ")),
      pack: stringOrNull(split[split.length - 1]),
    };
  }
  return {
    primary: stringOrNull(variant.size || variant.weightRange || (split.length > 1 ? split[0] : label)),
    pack: stringOrNull(variant.dose || variant.packSizeLabel || (split.length > 1 ? split.slice(1).join(" ") : "")),
  };
}

function flattenFamilySkus(familyVariants = []) {
  return familyVariants.flatMap((variant) =>
    (variant.skus || []).map((sku) => ({
      id: sku.id,
      label: `${variant.displayName || variant.name} / ${sku.packLabel}`,
      size: variant.strength || variant.weightRange || variant.displayName || variant.name,
      weightRange: variant.weightRange,
      dose: sku.packLabel,
      packSize: null,
      image: sku.image || variant.image,
      gallery: variant.gallery || [],
      description: variant.shortDescription || "",
      details: variant.shortDescription || "",
      sku: sku.sku,
      price: sku.price,
      regularPrice: sku.regularPrice,
      stock: sku.stock,
      status: variant.status === "Active" && sku.status === "Active" ? "Active" : "Inactive",
      familyVariantId: variant.id,
      familyVariantSlug: variant.slug,
      familyVariantName: variant.name,
      packLabel: sku.packLabel,
    })),
  );
}

function buildVariantLabel(variant = {}) {
  const explicitLabel = stringOrNull(variant.label);
  const size = stringOrNull(variant.size || variant.weightRange);
  const dose = stringOrNull(variant.dose);
  return explicitLabel || [size, dose].filter(Boolean).join(" + ");
}

function deriveProductValuesFromVariants(optionVariants = [], fallback = {}) {
  if (!optionVariants.length) {
    return {
      price: fallback.price,
      salePrice: fallback.salePrice,
      stock: fallback.stock,
    };
  }

  const primaryVariant =
    optionVariants.find((variant) => variant.status === "Active" && Number(variant.stock) > 0) ||
    optionVariants.find((variant) => variant.status === "Active") ||
    optionVariants[0];
  const stock = optionVariants.reduce((total, variant) => {
    if (variant.status !== "Active") return total;
    const quantity = Number(variant.stock);
    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

  return {
    price: primaryVariant.price,
    salePrice: primaryVariant.regularPrice,
    stock,
  };
}

function deriveProductValuesFromFamily(familyVariants = [], fallback = {}) {
  const skus = flattenFamilySkus(familyVariants);
  if (!skus.length) {
    return {
      price: fallback.price || 0,
      salePrice: fallback.salePrice,
      stock: fallback.stock || 0,
    };
  }
  const activeSkus = skus.filter((sku) => sku.status === "Active");
  const inStockSkus = activeSkus.filter((sku) => Number(sku.stock) > 0);
  const pricedSkus = (inStockSkus.length ? inStockSkus : activeSkus).filter((sku) => Number.isFinite(Number(sku.price)));
  const lowest = pricedSkus.reduce((best, sku) => (!best || Number(sku.price) < Number(best.price) ? sku : best), null);
  return {
    price: lowest?.price ?? fallback.price ?? 0,
    salePrice: lowest?.regularPrice ?? fallback.salePrice ?? null,
    stock: activeSkus.reduce((total, sku) => total + (Number(sku.stock) || 0), 0),
  };
}

function assertUniqueFamilyVariants(familyVariants = []) {
  const seen = new Set();
  for (const variant of familyVariants) {
    const key = String(variant.slug || variant.name).toLowerCase();
    if (seen.has(key)) throw new ApiError(400, `Duplicate variant "${variant.name}" is not allowed`);
    seen.add(key);
  }
}

function assertUniqueFamilySkus(familyVariants = []) {
  const seen = new Set();
  for (const variant of familyVariants) {
    for (const sku of variant.skus || []) {
      if (!sku.sku) throw new ApiError(400, `${variant.name} ${sku.packLabel} requires a SKU`);
      if (!Number.isFinite(sku.regularPrice) || sku.regularPrice <= 0 || !Number.isFinite(sku.price) || sku.price <= 0 || !Number.isFinite(sku.stock) || sku.stock < 0) {
        throw new ApiError(400, `${variant.name} ${sku.packLabel} has invalid price, MRP, or stock`);
      }
      if (Number(sku.price) > Number(sku.regularPrice)) {
        throw new ApiError(400, `${variant.name} ${sku.packLabel} selling price cannot be greater than MRP`);
      }
      const key = sku.sku.toLowerCase();
      if (seen.has(key)) throw new ApiError(400, `Duplicate SKU "${sku.sku}" is not allowed`);
      seen.add(key);
    }
  }
}

async function resolveActiveCategory(body) {
  const category = body.categoryId
    ? await prisma.category.findUnique({ where: { id: body.categoryId } })
    : await prisma.category.findUnique({ where: { name: body.category } });

  if (!category) throw new ApiError(400, "Selected category was not found");

  if (category.status !== "Active") {
    throw new ApiError(400, "Selected category must be active");
  }

  return category;
}

function normalizePetType(petType) {
  const value = String(petType || "").trim();
  return value || null;
}

function assertPriceNotAboveMrp(price, salePrice) {
  if (salePrice === null || salePrice === undefined) return;

  const sellingPrice = Number(price);
  const maximumRetailPrice = Number(salePrice);

  if (
    Number.isFinite(sellingPrice) &&
    Number.isFinite(maximumRetailPrice) &&
    sellingPrice > maximumRetailPrice
  ) {
    throw new ApiError(400, "Selling price cannot be greater than MRP");
  }
}

function assertOptionVariantPrices(optionVariants = []) {
  const invalidVariant = optionVariants.find((variant) => {
    if (variant.price === null || variant.price === undefined) return false;
    if (variant.regularPrice === null || variant.regularPrice === undefined) return false;

    const sellingPrice = Number(variant.price);
    const maximumRetailPrice = Number(variant.regularPrice);

    return (
      Number.isFinite(sellingPrice) &&
      Number.isFinite(maximumRetailPrice) &&
      sellingPrice > maximumRetailPrice
    );
  });

  if (invalidVariant) {
    throw new ApiError(
      400,
      `${invalidVariant.label} selling price cannot be greater than MRP`,
    );
  }
}

function assertOptionVariantNumbers(optionVariants = []) {
  const invalidVariant = optionVariants.find((variant) => {
    const values = [variant.price, variant.regularPrice, variant.stock];
    if (variant.packSize !== null && variant.packSize !== undefined) values.push(variant.packSize);
    return values.some((value) => !Number.isFinite(Number(value)) || Number(value) < 0);
  });

  if (invalidVariant) {
    throw new ApiError(
      400,
      `${invalidVariant.label} variant has invalid price, pack size, or stock`,
    );
  }
}


function assertOptionVariantsComplete(optionVariants = []) {
  const incompleteVariant = optionVariants.find((variant) => (
    !variant.label ||
    variant.price === null ||
    variant.price === undefined ||
    variant.regularPrice === null ||
    variant.regularPrice === undefined ||
    variant.stock === null ||
    variant.stock === undefined
  ));

  if (incompleteVariant) {
    throw new ApiError(
      400,
      `${incompleteVariant.label} variant requires selling price, MRP, and stock`,
    );
  }
}

function assertUniqueOptionVariants(optionVariants = []) {
  const seenCombinations = new Set();
  const seenSkus = new Set();

  for (const variant of optionVariants) {
    const combination = [
      variant.size || variant.weightRange || variant.label,
      variant.dose || "",
      variant.packSize || "",
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .join("|");
    if (seenCombinations.has(combination)) {
      throw new ApiError(400, `Duplicate variant option "${variant.label}" is not allowed`);
    }
    seenCombinations.add(combination);

    if (variant.sku) {
      const sku = String(variant.sku).trim().toLowerCase();
      if (seenSkus.has(sku)) {
        throw new ApiError(400, `Duplicate variant SKU "${variant.sku}" is not allowed`);
      }
      seenSkus.add(sku);
    }
  }
}

function getDefaultOptionLabel(optionType = "size") {
  const labels = {
    size: "Size",
    weight: "Weight",
    volume: "Volume",
    length: "Length",
    custom: "Option",
  };
  return labels[optionType] || labels.size;
}

function queueNewProductNewsletter(product) {
  if (product.status !== "Active") return;
  const tenantContext = getTenantContext();
  Promise.resolve()
    .then(() => (
      tenantContext
        ? runWithTenant(tenantContext, () => notifySubscribersOfNewProduct(product))
        : notifySubscribersOfNewProduct(product)
    ))
    .then((result) => {
      console.info("[Newsletter] New product update processed", {
        productId: product.id,
        delivered: result.delivered,
        failed: result.failed,
        total: result.total,
      });
    })
    .catch((error) => {
      console.warn("[Newsletter] New product update failed", {
        productId: product.id,
        message: error.message,
      });
    });
}

module.exports = {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  patchProduct,
  updateProduct,
};
