import axiosInstance from "../helper/axiosInstance";

export const reviewApi = {
  submitReview: async ({ productId, orderId, rating, comment }) => {
    const res = await axiosInstance.post("/customer-panel/reviews", {
      productId,
      orderId,
      rating,
      comment,
    });
    return res.data?.data || res.data;
  },

  getProductReviews: async (productId) => {
    const res = await axiosInstance.get(
      `/customer-panel/reviews/${encodeURIComponent(productId)}`
    );
    return res.data?.data || res.data || [];
  },
};

export default reviewApi;
