import api from './axios';
import { isSuperAdmin } from '../lib/api';

const unwrap = (response) => {
  const payload = response.data;
  if (payload?.success === false) {
    throw new Error(payload.message || payload.error || 'Category request failed');
  }
  return payload?.data ?? payload;
};

function toCategoryRequest(categoryData = {}) {
  if (!categoryData.imageFile) return categoryData;

  const formData = new FormData();
  formData.append('name', categoryData.name || '');
  formData.append('description', categoryData.description || '');
  formData.append('status', categoryData.status || 'Active');
  formData.append('image', categoryData.imageFile);
  return formData;
}

const formConfig = (body) =>
  body instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined;

export const categoryApi = {
  getAllCategories: async (params) => {
    const response = await api.get(isSuperAdmin() ? '/super-admin/categories' : '/categories', { params });
    return unwrap(response);
  },
  
  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return unwrap(response);
  },

  createCategory: async (categoryData) => {
    const body = toCategoryRequest(categoryData);
    const response = await api.post('/categories', body, formConfig(body));
    return unwrap(response);
  },

  updateCategory: async (id, categoryData) => {
    const body = toCategoryRequest(categoryData);
    const response = await api.put(`/categories/${id}`, body, formConfig(body));
    return unwrap(response);
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return unwrap(response);
  }
};
