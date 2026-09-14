import api from "./axios";
import { normalizeProductImages } from "../utils/productImages";

export function normalizeStoreProduct(product) {
  const price = Number(product.price ?? product.pricing?.finalPrice ?? product.salePrice ?? 0);
  const originalPrice = Number(product.pricing?.price ?? product.mrp ?? price);
  const images = normalizeProductImages(product);
  const categoryName =
    product.categoryName || product.category?.name || product.category || "Pet Supplies";
  const slug = product.slug || (product.name ? product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : String(product.id));

  return {
    ...product,
    id: String(product.id),
    productId: String(product.id),
    name: product.name || "Pet Product",
    slug,
    price,
    originalPrice: originalPrice || price,
    sellPrice: price || originalPrice,
    discountPercent: Number(product.discountPercent ?? product.discountPercentage ?? product.pricing?.discountPercentage ?? 0),
    discountPercentage: Number(product.discountPercentage ?? product.pricing?.discountPercentage ?? 0),
    description: product.description || product.shortDescription || "",
    shortDescription: product.shortDescription || product.description || "",
    fullDescription: product.fullDescription || product.longDescription || product.description || "",
    category: categoryName,
    categoryName,
    stockQuantity: Number(product.stockQuantity ?? product.stock ?? product.inventory?.stockQuantity ?? 0),
    stockStatus: product.stockStatus ?? product.inventory?.stockStatus ?? "IN_STOCK",
    inStock: product.isInStock ?? Number(product.stock ?? product.stockQuantity ?? product.inventory?.stockQuantity ?? 0) > 0,
    brand: product.brand || product.manufacturer || "Happy PetRx",
    prescriptionRequired: Boolean(product.prescriptionRequired),
    image: images[0],
    images,
    gallery: images,
    sku: product.sku || `VSE-${String(product.id).toUpperCase()}`,
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

  getProductVariant: async (productSlug, variantSlug) => {
    const res = await api.get(
      `/customer-panel/catalog/products/${productSlug}/variants/${variantSlug}`,
    );
    return res.data.data;
  },

  getCategories: async () => {
    const res = await api.get("/customer-panel/catalog/categories");
    return res.data.data;
  },
};
