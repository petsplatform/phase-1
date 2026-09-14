import api from "./axios";

function normalizeReview(r) {
  const s = r.rating || r.stars || r.star || 5;
  return {
    ...r,
    author:
      r.author ||
      r.customerName ||
      r.userName ||
      r.name ||
      r.user?.name ||
      r.customer?.name ||
      "Verified Buyer",
    date:
      r.date ||
      (r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : r.updatedAt
          ? new Date(r.updatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "Recently"),
    rating: String(s),
    stars: Number(s),
    star: Number(s),
    comment: r.comment || r.reviewText || r.review || r.body || r.text || "",
    title: r.title || r.reviewTitle || r.subject || "",
    verified: r.verified ?? r.isVerified ?? true,
    helpfulCount: r.helpfulCount || r.helpful || r.likes || 0,
  };
}

export const reviewApi = {
  getProductReviews: async (productId) => {
    const res = await api.get(
      `/customer-panel/reviews/${encodeURIComponent(productId)}`,
    );
    const raw = res.data;
    const list =
      (Array.isArray(raw) ? raw : null) ??
      raw?.data?.reviews ??
      raw?.data ??
      raw?.reviews ??
      raw?.items ??
      [];
    return Array.isArray(list) ? list.map(normalizeReview) : [];
  },
  submitReview: async ({
    productId,
    orderId,
    rating,
    star,
    stars,
    comment,
  }) => {
    const s = rating || star || stars || 5;
    const res = await api.post(`/customer-panel/reviews`, {
      productId,
      orderId,
      rating: s,
      star: s,
      stars: s,
      comment,
    });
    return res.data;
  },
};
