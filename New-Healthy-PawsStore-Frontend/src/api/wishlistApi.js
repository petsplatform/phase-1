import { apiRequest } from "./client";
import { normalizeProduct } from "./catalogApi";

function normalizeWishlistItem(item = {}) {
  return normalizeProduct({
    ...item,
    id: item.id || item._id || item.productId || item.slug,
    productId: item.productId || item.id || item._id,
    oldPrice: item.oldPrice ?? item.salePrice ?? item.price,
  });
}

function normalizeWishlistResponse(result) {
  const items = Array.isArray(result)
    ? result
    : result?.items || result?.wishlistItems || result?.data || [];

  return (Array.isArray(items) ? items : []).map(normalizeWishlistItem);
}

export const wishlistApi = {
  async getWishlist() {
    const result = await apiRequest("/customer-panel/wishlist");
    return normalizeWishlistResponse(result);
  },
  async syncWishlist(items) {
    const result = await apiRequest("/customer-panel/wishlist", {
      method: "PUT",
      body: JSON.stringify({ items }),
    });
    return normalizeWishlistResponse(result);
  },
  async addItem(item) {
    const cleanItem = {
      ...item,
      productId: String(item.productId || item.id || "").split("__")[0],
    };
    const result = await apiRequest("/customer-panel/wishlist/items", {
      method: "POST",
      body: JSON.stringify({ item: cleanItem }),
    });
    return normalizeWishlistResponse(result);
  },
  async removeItem(id) {
    const cleanId = String(id).split("__")[0];
    const result = await apiRequest(`/customer-panel/wishlist/items/${encodeURIComponent(cleanId)}`, {
      method: "DELETE",
    });
    return normalizeWishlistResponse(result);
  },
  clear: () => apiRequest("/customer-panel/wishlist", { method: "DELETE" }),
};
