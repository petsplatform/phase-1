import api from "./axios";

export const CART_UPDATED_EVENT = "budget-petshop-cart-updated";

const emitCartUpdated = () => {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

export const cartApi = {
  getCart: async () => {
    const res = await api.get("/customer-panel/cart");
    return res.data.data || [];
  },

  syncCart: async (items) => {
    const res = await api.put("/customer-panel/cart", { items });
    emitCartUpdated();
    return res.data.data || [];
  },

  addItem: async (item) => {
    const res = await api.post("/customer-panel/cart/items", { item });
    emitCartUpdated();
    return res.data.data || [];
  },

  updateItem: async (id, quantity) => {
    const res = await api.patch(`/customer-panel/cart/items/${encodeURIComponent(id)}`, {
      quantity,
    });
    emitCartUpdated();
    return res.data.data || [];
  },

  removeItem: async (id) => {
    const res = await api.delete(`/customer-panel/cart/items/${encodeURIComponent(id)}`);
    emitCartUpdated();
    return res.data.data || [];
  },

  clearCart: async () => {
    const res = await api.delete("/customer-panel/cart");
    emitCartUpdated();
    return res.data.data || [];
  },
};
