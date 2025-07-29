// Utility functions for Smart Nota API Key management

export const SMART_NOTA_API_KEY_STORAGE_KEY = 'smartNotaApiKey';

export const getSmartNotaApiKey = (): string | null => {
  return localStorage.getItem(SMART_NOTA_API_KEY_STORAGE_KEY);
};

export const setSmartNotaApiKey = (apiKey: string): void => {
  localStorage.setItem(SMART_NOTA_API_KEY_STORAGE_KEY, apiKey);
};

export const removeSmartNotaApiKey = (): void => {
  localStorage.removeItem(SMART_NOTA_API_KEY_STORAGE_KEY);
};

export const hasSmartNotaApiKey = (): boolean => {
  return !!getSmartNotaApiKey();
};

// Function to create headers with API key for Smart Nota API calls
export const createSmartNotaHeaders = (): Record<string, string> => {
  const apiKey = getSmartNotaApiKey();
  if (!apiKey) {
    throw new Error('Smart Nota API Key tidak ditemukan. Silakan atur di Settings.');
  }
  
  return {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
  };
};

// Smart Nota API base URL
export const SMART_NOTA_BASE_URL = 'https://smartnotaapi.indiramaju.com';

// Smart Nota API endpoints
export const SMART_NOTA_ENDPOINTS = {
  INVOICES: '/api/api-key/invoices',
  INVOICE_BY_ID: (id: string | number) => `/api/api-key/invoices/${id}`,
} as const; 