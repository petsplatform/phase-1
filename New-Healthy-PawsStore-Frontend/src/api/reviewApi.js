import api from "./axios";

export const reviewApi = {
  submitReview: async ({ productId, orderId, rating, comment }) => {
    const res = await api.post("/customer-panel/reviews", { productId, orderId, rating, comment });
    return res?.data?.data ?? res?.data;
  },

  getProductReviews: async (productId) => {
    if (!productId) return [];
    try {
      const res = await api.get(`/customer-panel/reviews/${encodeURIComponent(productId)}`);
      const items = res?.data?.data ?? res?.data;
      return Array.isArray(items) ? items : [];
    } catch (err) {
      console.warn("Failed to fetch product reviews:", err);
      return [];
    }
  },
};
