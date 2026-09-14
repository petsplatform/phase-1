import api from "./axios";

export const reviewApi = {
  submitReview: async ({ productId, orderId, rating, comment, userName, name, customerName }) => {
    const displayName = userName || name || customerName || "";
    const res = await api.post("/customer-panel/reviews", {
      productId,
      orderId,
      rating: Number(rating),
      comment: comment || "",
      userName: displayName,
      name: displayName,
      customerName: displayName,
    });

    if (res.data && res.data.success === false) {
      throw new Error(res.data.message || "Something went wrong");
    }

    return res.data?.data || res.data;
  },

  getProductReviews: async (productId) => {
    try {
      const res = await api.get(
        `/customer-panel/reviews/${encodeURIComponent(productId)}`,
      );
      if (res.data && res.data.success === false) {
        return [];
      }
      const data = res.data?.data || res.data?.reviews || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};

