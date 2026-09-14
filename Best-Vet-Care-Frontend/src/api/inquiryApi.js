const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STORE_KEY = import.meta.env.VITE_STORE_KEY || 'STORE_1';
const STORE_DOMAIN = typeof window !== 'undefined' ? window.location.origin : '';

export const inquiryApi = {
  submit: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/customer-panel/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(STORE_KEY ? { 'x-store-key': STORE_KEY } : {}),
        ...(STORE_DOMAIN ? { 'x-store-domain': STORE_DOMAIN } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'Unable to send your message.');
    }
    return data.data;
  },
};
