import api from './axios';

function normalizeWishlistResponse(res) {
  const data = res?.data?.data !== undefined ? res.data.data : res?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.wishlistItems)) return data.wishlistItems;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
}

export const wishlistApi = {
  getWishlist: async () => {
    const res = await api.get('/customer-panel/wishlist');
    return normalizeWishlistResponse(res);
  },
  syncWishlist: async (items) => {
    const res = await api.put('/customer-panel/wishlist', { items });
    return normalizeWishlistResponse(res);
  },
  addItem: async (item) => {
    const cleanItem = {
      ...item,
      id: String(item.id || item.productId || '').split('__')[0],
      productId: String(item.productId || item.id || '').split('__')[0],
    };
    const res = await api.post('/customer-panel/wishlist/items', { item: cleanItem });
    return normalizeWishlistResponse(res);
  },
  removeItem: async (id) => {
    const cleanId = String(id).split('__')[0];
    const res = await api.delete(`/customer-panel/wishlist/items/${encodeURIComponent(cleanId)}`);
    return normalizeWishlistResponse(res);
  },
  clearWishlist: async () => {
    const res = await api.delete('/customer-panel/wishlist');
    return normalizeWishlistResponse(res);
  },
};

