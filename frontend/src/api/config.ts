import axios from 'axios';

// Setup axios interceptors
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Base API URL
export const API_BASE_URL = (import.meta as any).env.VITE_API_URL;

// Helper function to handle API responses
export const handleApiResponse = (response: any) => {
  return response.data.data || response.data;
};

// Helper function to handle API errors
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  throw error;
};