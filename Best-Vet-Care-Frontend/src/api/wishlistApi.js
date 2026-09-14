import api from "./axios";

export const wishlistApi = {
  getWishlist: async () => {
    const res = await api.get("/customer-panel/wishlist");
    return res.data.data || [];
  },

  syncWishlist: async (items) => {
    const res = await api.put("/customer-panel/wishlist", { items });
    return res.data.data || [];
  },

  addItem: async (item) => {
    const res = await api.post("/customer-panel/wishlist/items", { item });
    return res.data.data || [];
  },

  removeItem: async (id) => {
    const res = await api.delete(`/customer-panel/wishlist/items/${encodeURIComponent(id)}`);
    return res.data.data || [];
  },

  clearWishlist: async () => {
    const res = await api.delete("/customer-panel/wishlist");
    return res.data.data || [];
  },
};
