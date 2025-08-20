import axios from 'axios';

// Define API response structure
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: string;
}

// Setup axios interceptors
axios.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Base API URL
export const API_BASE_URL = (import.meta as any).env.VITE_API_URL;

// Konfigurasi default axios
axios.defaults.baseURL = API_BASE_URL;

// Helper function untuk membuat headers dengan authorization
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Helper function untuk membuat headers dengan authorization dan content-type
export const getAuthHeadersWithContentType = (contentType: string = 'application/json') => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': contentType,
  };
};

// Helper function untuk membuat headers multipart/form-data
export const getMultipartHeaders = () => {
  return getAuthHeadersWithContentType('multipart/form-data');
};

// Helper function to handle API responses
export const handleApiResponse = <T>(response: any): T => {
  return response.data.data || response.data;
};

// Helper function to handle API errors
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  throw error;
};