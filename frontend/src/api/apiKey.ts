import axios from 'axios';
import { API_BASE_URL } from './config';

export interface ApiKeyResponse {
  api_key: string;
  user_id: number;
}

export interface ApiKeyRequest {
  api_key: string;
}

export const apiKeyApi = {
  // Get API key for current user
  getApiKey: async (): Promise<ApiKeyResponse> => {
    const response: any = await axios.get(`${API_BASE_URL}/user/api-key`);
    const data = response.data.data;
    // Also save to localStorage for backward compatibility
    if (data && data.api_key) {
      localStorage.setItem('smartNotaApiKey', data.api_key);
    }
    return data;
  },

  // Save or update API key for current user
  saveApiKey: async (apiKey: string): Promise<{ message: string; user_id: number }> => {
    const response: any = await axios.post(`${API_BASE_URL}/user/api-key`, { api_key: apiKey });
    const data = response.data.data;
    // Also save to localStorage for backward compatibility
    localStorage.setItem('smartNotaApiKey', apiKey);
    return data;
  },

  // Delete API key for current user
  deleteApiKey: async (): Promise<{ message: string; user_id: number }> => {
    const response: any = await axios.delete(`${API_BASE_URL}/user/api-key`);
    const data = response.data.data;
    // Also remove from localStorage
    localStorage.removeItem('smartNotaApiKey');
    return data;
  },
}; 