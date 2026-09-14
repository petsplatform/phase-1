import axiosInstance from "../helper/axiosInstance";

export const productApi = {
  getProducts: async (params = {}) => {
    const res = await axiosInstance.get("/customer-panel/catalog/products", {
      params,
    });
    return res.data?.data || res.data;
  },

  getProductById: async (id) => {
    const res = await axiosInstance.get(
      `/customer-panel/catalog/products/${encodeURIComponent(id)}`,
    );
    return res.data?.data || res.data;
  },

  getProductVariant: async (productSlug, variantSlug) => {
    return null;
  },

  getCategories: async () => {
    const res = await axiosInstance.get("/customer-panel/catalog/categories");
    return res.data?.data || res.data;
  },
};

export default productApi;
