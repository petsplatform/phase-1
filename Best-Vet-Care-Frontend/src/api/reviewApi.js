import api from "./axios";

export const reviewApi = {
  submitReview: async ({ productId, orderId, rating, comment }) => {
    const res = await api.post("/customer-panel/reviews", { productId, orderId, rating, comment });
    return res.data.data;
  },

  getProductReviews: async (productId) => {
    const res = await api.get(`/customer-panel/reviews/${encodeURIComponent(productId)}`);
    return res.data.data || [];
  },
};
