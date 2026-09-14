import api from './axios';

export const uploadApi = {
  /**
   * Upload a single image to Cloudinary via the backend.
   * @param {File} file - The image file to upload.
   * @returns {Promise<{ url: string, public_id: string }>}
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Upload multiple images to Cloudinary via the backend.
   * @param {File[]} files - Array of image files.
   * @returns {Promise<{ url: string, public_id: string }[]>}
   */
  uploadMultipleImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Delete an image from Cloudinary by its URL.
   * @param {string} imageUrl - The Cloudinary URL to delete.
   */
  deleteImage: async (imageUrl) => {
    const response = await api.delete('/upload', { data: { imageUrl } });
    return response.data;
  },
};
