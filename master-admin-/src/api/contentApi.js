import api from './axios';

export const contentApi = {
  getAllBanners: async () => {
    const response = await api.get('/content/banners');
    return response.data;
  },
  
  createBanner: async (bannerData) => {
    const response = await api.post('/content/banners', bannerData);
    return response.data;
  },

  updateBanner: async (id, bannerData) => {
    const response = await api.put(`/content/banners/${id}`, bannerData);
    return response.data;
  },

  deleteBanner: async (id) => {
    const response = await api.delete(`/content/banners/${id}`);
    return response.data;
  },

  getAllBlogs: async () => {
    const response = await api.get('/content/blogs');
    return response.data;
  },

  createBlog: async (blogData) => {
    const response = await api.post('/content/blogs', blogData);
    return response.data;
  },

  updateBlog: async (id, blogData) => {
    const response = await api.put(`/content/blogs/${id}`, blogData);
    return response.data;
  },

  deleteBlog: async (id) => {
    const response = await api.delete(`/content/blogs/${id}`);
    return response.data;
  },

  getAllCoupons: async () => {
    const response = await api.get('/coupons');
    return response.data;
  },

  createCoupon: async (couponData) => {
    const response = await api.post('/coupons', couponData);
    return response.data;
  },

  updateCoupon: async (id, couponData) => {
    const response = await api.put(`/coupons/${id}`, couponData);
    return response.data;
  },

  deleteCoupon: async (id) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  }
};
