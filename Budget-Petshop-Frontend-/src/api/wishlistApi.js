import api from "./axios";

export const WISHLIST_UPDATED_EVENT = "budget-petshop-wishlist-updated";

const emitWishlistUpdated = () => {
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
};

export const wishlistApi = {
  getWishlist: async () => {
    const res = await api.get("/customer-panel/wishlist");
    return res.data.data || [];
  },

  syncWishlist: async (items) => {
    const res = await api.put("/customer-panel/wishlist", { items });
    emitWishlistUpdated();
    return res.data.data || [];
  },

  addItem: async (item) => {
    const res = await api.post("/customer-panel/wishlist/items", { item });
    emitWishlistUpdated();
    return res.data.data || [];
  },

  removeItem: async (id) => {
    const res = await api.delete(`/customer-panel/wishlist/items/${encodeURIComponent(id)}`);
    emitWishlistUpdated();
    return res.data.data || [];
  },

  clearWishlist: async () => {
    const res = await api.delete("/customer-panel/wishlist");
    emitWishlistUpdated();
    return res.data.data || [];
  },
};
