import api from './axios';

export const productApi = {
  getProducts: async (params = {}) => {
    const res = await api.get('/customer-panel/catalog/products', { params });
    return res.data.data;
  },

  getProductById: async (id) => {
    const res = await api.get(`/customer-panel/catalog/products/${id}`);
    return res.data.data;
  },

  getProductVariant: async (productSlug, variantSlug) => {
    const res = await api.get(
      `/customer-panel/catalog/products/${productSlug}/variants/${variantSlug}`,
    );
    return res.data.data;
  },

  getCategories: async () => {
    const res = await api.get('/customer-panel/catalog/categories');
    return res.data.data;
  },
};
  