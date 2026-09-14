import { getAdminToken, getAdminStoreKey } from '../lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authHeaders() {
  const token = getAdminToken();
  const storeKey = getAdminStoreKey();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (storeKey) headers['x-store-key'] = storeKey;
  return headers;
}

export const bulkImportApi = {
  // Download Excel template
  downloadTemplate: () => {
    const headers = authHeaders();
    const params = new URLSearchParams(headers).toString();
    // Use anchor trick for file download
    const url = `${API_BASE_URL}/bulk-import/template`;
    return fetch(url, { headers }).then(async (res) => {
      if (!res.ok) throw new Error('Failed to download template');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Product_Import_Template.xlsx';
      link.click();
      URL.revokeObjectURL(link.href);
    });
  },

  // Export all products
  exportProducts: () => {
    return fetch(`${API_BASE_URL}/bulk-import/export`, { headers: authHeaders() }).then(async (res) => {
      if (!res.ok) throw new Error('Failed to export products');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Products_Export_${Date.now()}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  },

  // Validate uploaded file — returns preview data
  validateFile: (file, importMode = 'AddNew') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('importMode', importMode);
    return fetch(`${API_BASE_URL}/bulk-import/validate`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Validation failed');
      return json.data;
    });
  },

  // Execute confirmed import
  executeImport: (validRowsData, importMode, fileName) => {
    return fetch(`${API_BASE_URL}/bulk-import/execute`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ validRowsData, importMode, fileName }),
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Import failed');
      return json.data;
    });
  },

  // Get import history
  getHistory: () => {
    return fetch(`${API_BASE_URL}/bulk-import/history`, { headers: authHeaders() }).then(async (res) => {
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load history');
      return json.data;
    });
  },

  // Download error report for a specific import
  downloadErrorReport: (importId, fileName) => {
    return fetch(`${API_BASE_URL}/bulk-import/history/${importId}/errors`, { headers: authHeaders() }).then(async (res) => {
      if (!res.ok) throw new Error('Failed to download error report');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Import_Error_Report_${fileName || importId}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  },
};
