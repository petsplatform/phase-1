import api from "./axios";
import { isPrescriptionRequired } from "../utils/productUtils";

const fallbackImage =
  "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=650";

export function normalizeStoreProduct(product) {
  const price = Number(product.price ?? product.finalPrice ?? product.salePrice ?? 0);
  const originalPrice = Number(product.pricing?.price ?? product.mrp ?? price);

  const primaryCandidates = [
    typeof product.mainImage === "string" ? product.mainImage.trim() : product.mainImage?.url || product.mainImage?.src,
    typeof product.image === "string" ? product.image.trim() : product.image?.url || product.image?.src,
    typeof product.thumbnail === "string" ? product.thumbnail.trim() : product.thumbnail?.url || product.thumbnail?.src,
    typeof product.imageUrl === "string" ? product.imageUrl.trim() : null,
  ].filter(Boolean);

  const rawGallery = Array.isArray(product.gallery) ? product.gallery : [];
  const rawImages = Array.isArray(product.images) ? product.images : [];
  const galleryList = [...rawGallery, ...rawImages]
    .map((img) => {
      if (!img) return null;
      if (typeof img === "string" && img.trim()) return img.trim();
      if (img.url) return img.url;
      if (img.src) return img.src;
      return null;
    })
    .filter(Boolean);

  const colorVariantImages = (Array.isArray(product.colorVariants) ? product.colorVariants : [])
    .flatMap((v) => {
      if (!v) return [];
      const vMain = typeof v.mainImage === "string" ? v.mainImage.trim() : v.mainImage?.url || v.mainImage?.src;
      const vImg = typeof v.image === "string" ? v.image.trim() : v.image?.url || v.image?.src;
      const vUrl = typeof v.imageUrl === "string" ? v.imageUrl.trim() : null;
      const vGal = Array.isArray(v.gallery) ? v.gallery.map((g) => (typeof g === "string" ? g.trim() : g?.url || g?.src)) : [];
      return [vMain, vImg, vUrl, ...vGal];
    })
    .filter(Boolean);

  const variantImages = (Array.isArray(product.optionVariants) ? product.optionVariants : [])
    .flatMap((v) => {
      if (!v) return [];
      const vMain = typeof v.mainImage === "string" ? v.mainImage.trim() : v.mainImage?.url || v.mainImage?.src;
      const vImg = typeof v.image === "string" ? v.image.trim() : v.image?.url || v.image?.src;
      const vUrl = typeof v.imageUrl === "string" ? v.imageUrl.trim() : null;
      const vGal = Array.isArray(v.gallery) ? v.gallery.map((g) => (typeof g === "string" ? g.trim() : g?.url || g?.src)) : [];
      const vImgs = Array.isArray(v.images) ? v.images.map((g) => (typeof g === "string" ? g.trim() : g?.url || g?.src)) : [];
      return [vMain, vImg, vUrl, ...vGal, ...vImgs];
    })
    .filter(Boolean);

  const familyImages = (Array.isArray(product.familyVariants) ? product.familyVariants : [])
    .flatMap((fv) => {
      if (!fv) return [];
      const fMain = typeof fv.mainImage === "string" ? fv.mainImage.trim() : fv.mainImage?.url || fv.mainImage?.src;
      const fImg = typeof fv.image === "string" ? fv.image.trim() : fv.image?.url || fv.image?.src;
      const fUrl = typeof fv.imageUrl === "string" ? fv.imageUrl.trim() : null;
      const fGal = Array.isArray(fv.gallery) ? fv.gallery.map((g) => (typeof g === "string" ? g.trim() : g?.url || g?.src)) : [];
      return [fMain, fImg, fUrl, ...fGal];
    })
    .filter(Boolean);

  const images = Array.from(
    new Set([...primaryCandidates, ...galleryList, ...colorVariantImages, ...variantImages, ...familyImages]),
  ).filter(Boolean);

  const finalImages = images.length > 0 ? images : [fallbackImage];

  const categoryName =
    product.categoryName || product.category?.name || product.category || "Pet Supplies";
  const requiresRx = isPrescriptionRequired(product);

  const stockQuantity = Number(
    product.stockQuantity ?? product.stock ?? product.inventory?.stockQuantity ?? 0
  );
  const isExplicitlyOut =
    product.isInStock === false ||
    product.inStock === false ||
    product.isOutOfStock === true ||
    String(product.stockStatus || product.inventory?.stockStatus || product.status || "")
      .toUpperCase()
      .includes("OUT");

  const inStock = !isExplicitlyOut && (product.isInStock ?? (stockQuantity > 0));

  return {
    ...product,
    id: String(product.id),
    name: product.name || "Pet Product",
    prescriptionRequired: requiresRx,
    isPrescriptionRequired: requiresRx,
    originalPrice: originalPrice || price,
    sellPrice: price || originalPrice,
    discountPercentage: Number(product.discountPercentage || 0),
    description:
      product.description ||
      product.shortDescription ||
      product.productDetails?.overview ||
      product.productDetails?.description ||
      product.productDetails?.shortDescription ||
      product.productDetails?.content ||
      product.details ||
      product.overview ||
      product.summary ||
      product.fullDescription ||
      "",
    shortDescription:
      product.shortDescription ||
      product.productDetails?.shortDescription ||
      "",
    longDescription:
      product.longDescription ||
      product.fullDescription ||
      product.productDetails?.fullDescription ||
      product.productDetails?.content ||
      product.description ||
      product.shortDescription ||
      "",
    content:
      product.content ||
      product.htmlContent ||
      product.detailedContent ||
      product.productDetails?.content ||
      product.longDescription ||
      product.description ||
      "",
    categoryName,
    petType:
      typeof product.petType === "string"
        ? product.petType
        : Array.isArray(product.petType)
          ? product.petType.join(", ")
          : product.petTypes
            ? Array.isArray(product.petTypes)
              ? product.petTypes.join(", ")
              : String(product.petTypes)
            : product.pet_type || "",
    inStock,
    stockQuantity,
    brand: product.brand || product.manufacturer || "Happy PetRx",
    image: finalImages[0],
    images: finalImages,
    gallery: finalImages,
    productType: product.productType
      ? String(product.productType).trim().toUpperCase()
      : (Array.isArray(product.familyVariants) && product.familyVariants.length > 0)
        ? "FAMILY"
        : "SIMPLE",
    familyVariants: Array.isArray(product.familyVariants) ? product.familyVariants : [],
    productDetails: product.productDetails || {},
    parentContent: product.parentContent || "",
    sizes: product.sizes || (product.optionVariants && product.optionVariants.length
      ? product.optionVariants.map((v, idx) => {
          const pTitle = product.name || product.title || "";
          const vFId = String(v.familyVariantId || v.familyId || "");
          const vLabel = String(v.label || v.name || "").trim();
          let cleanVLabel = vLabel;
          if (pTitle) {
            cleanVLabel = cleanVLabel.replace(new RegExp(`^${pTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—:/]?\\s*`, "i"), "");
            cleanVLabel = cleanVLabel.replace(new RegExp(`\\(${pTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, "gi"), "");
          }
          cleanVLabel = cleanVLabel.trim() || vLabel;
          const cleanVLower = cleanVLabel.toLowerCase();

          const fv =
            (Array.isArray(product.familyVariants) && product.familyVariants.find(
              (f) => {
                if (!f) return false;
                const fId = String(f.id || f._id || "");
                if (fId && vFId && fId === vFId) return true;
                if (f.id && v.id && String(f.id) === String(v.id)) return true;
                if (f.sku && v.sku && f.sku === v.sku) return true;
                if (Array.isArray(f.skus) && f.skus.some((s) => String(s.id || s._id) === String(v.id) || (s.sku && v.sku && s.sku === v.sku))) return true;
                if (f.slug && v.familyVariantSlug && f.slug === v.familyVariantSlug) return true;

                const fName = String(f.name || f.displayName || f.label || "").trim();
                let cleanFName = fName;
                if (pTitle) {
                  cleanFName = cleanFName.replace(new RegExp(`^${pTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—:/]?\\s*`, "i"), "");
                  cleanFName = cleanFName.replace(new RegExp(`\\(${pTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, "gi"), "");
                }
                cleanFName = cleanFName.trim().toLowerCase();

                if (cleanFName && cleanVLower && (cleanVLower.includes(cleanFName) || cleanFName.includes(cleanVLower))) return true;
                if (f.packColor && cleanVLower.includes(String(f.packColor).toLowerCase())) return true;
                if (f.weightRange && cleanVLower.includes(String(f.weightRange).toLowerCase())) return true;
                return false;
              }
            )) ||
            (Array.isArray(product.familyVariants) && product.familyVariants.length === product.optionVariants.length
              ? product.familyVariants[idx]
              : (Array.isArray(product.familyVariants) && product.familyVariants[0] ? product.familyVariants[0] : null));

          const vOwnImg =
            (typeof v.mainImage === "string" && v.mainImage.trim()) ||
            (v.mainImage?.url || v.mainImage?.src) ||
            (typeof v.image === "string" && v.image.trim()) ||
            (v.image?.url || v.image?.src) ||
            (typeof v.imageUrl === "string" && v.imageUrl.trim()) ||
            null;

          const fvOwnImg =
            (typeof fv?.mainImage === "string" && fv.mainImage.trim()) ||
            (fv?.mainImage?.url || fv?.mainImage?.src) ||
            (typeof fv?.image === "string" && fv.image.trim()) ||
            (fv?.image?.url || fv?.image?.src) ||
            (typeof fv?.imageUrl === "string" && fv.imageUrl.trim()) ||
            null;

          const vImg = vOwnImg || fvOwnImg || finalImages[0] || fallbackImage;

          const rawVGal = [
            ...(Array.isArray(v.gallery) ? v.gallery : []),
            ...(Array.isArray(v.images) ? v.images : []),
            ...(Array.isArray(fv?.gallery) ? fv.gallery : []),
            ...(Array.isArray(fv?.images) ? fv.images : []),
          ];
          const cleanGalItems = rawVGal.map((img) => {
            if (!img) return null;
            if (typeof img === "string" && img.trim()) return img.trim();
            return img.url || img.src || null;
          }).filter(Boolean);

          const vGal = Array.from(
            new Set([
              ...(vOwnImg ? [vOwnImg] : []),
              ...(fvOwnImg ? [fvOwnImg] : []),
              ...cleanGalItems,
            ])
          ).filter(Boolean);

          const packLabel =
            v.packLabel ||
            v.packName ||
            v.pack ||
            v.packSizeLabel ||
            v.packSize ||
            v.doseLabel ||
            v.doses ||
            v.label ||
            v.name ||
            "";

          return {
            id: v.id,
            label: packLabel,
            displayLabel: cleanVLabel || packLabel,
            packLabel,
            price: Number(v.pricing?.finalPrice ?? v.price ?? v.salePrice ?? price),
            originalPrice: Number(v.pricing?.price ?? v.regularPrice ?? v.price ?? originalPrice),
            stock: v.stock ?? v.inventory?.stockQuantity ?? 0,
            sku: v.sku || product.sku,
            multiplier: 1.0,
            image: vImg,
            imageUrl: vImg,
            gallery: vGal.length > 0 ? vGal : [vImg],
            familyVariant: fv,
            familyVariantId: fv?.id || v.familyVariantId,
            variantName: fv?.name || fv?.displayName || "",
            weightRange: fv?.weightRange || "",
            color: fv?.packColor || fv?.color || null,
            colorHex: fv?.packColorHex || fv?.colorHex || null,
            description: fv?.shortDescription || fv?.description || v.shortDescription || v.description || v.details || "",
            shortDescription: fv?.shortDescription || v.shortDescription || fv?.description || v.description || "",
            details: fv?.details || v.details || "",
          };
        })
      : (product.familyVariants && product.familyVariants.length
          ? product.familyVariants.map((fv, fIdx) => {
              const fvImg =
                (typeof fv.mainImage === "string" ? fv.mainImage.trim() : fv.mainImage?.url || fv.mainImage?.src) ||
                (typeof fv.image === "string" ? fv.image.trim() : fv.image?.url || fv.image?.src) ||
                (typeof fv.imageUrl === "string" ? fv.imageUrl.trim() : null) ||
                finalImages[0] ||
                fallbackImage;

              const rawFvGal = [
                ...(Array.isArray(fv.gallery) ? fv.gallery : []),
                ...(Array.isArray(fv.images) ? fv.images : []),
              ];
              const fvGal = Array.from(
                new Set([
                  fvImg,
                  ...rawFvGal.map((img) => {
                    if (!img) return null;
                    if (typeof img === "string" && img.trim()) return img.trim();
                    return img.url || img.src || null;
                  }).filter(Boolean),
                ])
              ).filter(Boolean);

              let cleanLabel = fv.name || fv.displayName || fv.label || `Variant ${fIdx + 1}`;
              const pTitle = product.name || product.title || "";
              if (pTitle) {
                cleanLabel = cleanLabel.replace(new RegExp(`^${pTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—:/]?\\s*`, "i"), "");
                cleanLabel = cleanLabel.replace(new RegExp(`\\(${pTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, "gi"), "");
              }
              cleanLabel = cleanLabel.trim() || (fv.name || fv.displayName || fv.label);

              return {
                id: fv.id,
                label: fv.name || fv.displayName || fv.label,
                displayLabel: cleanLabel,
                price: Number(fv.pricing?.finalPrice ?? fv.price ?? fv.salePrice ?? price),
                originalPrice: Number(fv.pricing?.price ?? fv.regularPrice ?? fv.price ?? originalPrice),
                stock: fv.stock ?? fv.inventory?.stockQuantity ?? 50,
                sku: fv.sku || product.sku,
                multiplier: 1.0,
                image: fvImg,
                imageUrl: fvImg,
                gallery: fvGal.length > 0 ? fvGal : [fvImg],
                familyVariant: fv,
                familyVariantId: fv.id,
                variantName: fv.name || fv.displayName || "",
                weightRange: fv.weightRange || "",
                color: fv.packColor || fv.color || null,
                colorHex: fv.packColorHex || fv.colorHex || null,
                description: fv.shortDescription || fv.description || fv.details || "",
                shortDescription: fv.shortDescription || fv.description || "",
                details: fv.details || "",
              };
            })
          : [
              {
                label:
                  product.optionVariants?.find((variant) => variant.isAvailable !== false)?.label ||
                  "Standard",
                displayLabel: "Standard",
                multiplier: 1,
                image: finalImages[0] || fallbackImage,
                imageUrl: finalImages[0] || fallbackImage,
                gallery: finalImages.length > 0 ? finalImages : [fallbackImage],
                price,
                originalPrice,
                stock: stockQuantity || 50,
                sku: product.sku || "PROD-STD",
              },
            ])),
    variants: product.optionVariants?.length
      ? {
          type: "option",
          label: "Option",
          options: product.optionVariants
            .filter((variant) => variant.isAvailable !== false)
            .map((variant) => variant.label)
            .filter(Boolean),
          default: product.optionVariants.find((variant) => variant.isAvailable !== false)?.label,
        }
      : product.variants,
  };
}

export const productApi = {
  getProducts: async (params = {}) => {
    const res = await api.get("/customer-panel/catalog/products", { params });
    const data = res.data.data;
    return {
      ...data,
      items: (data.items || []).map(normalizeStoreProduct),
    };
  },

  getProductById: async (id) => {
    const res = await api.get(`/customer-panel/catalog/products/${id}`);
    return normalizeStoreProduct(res.data.data);
  },

  getCategories: async () => {
    const res = await api.get("/customer-panel/catalog/categories");
    return res.data.data;
  },
};

export default productApi;
