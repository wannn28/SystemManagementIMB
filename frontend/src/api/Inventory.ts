import axios from 'axios';
import { InventoryCategory, InventoryData } from '../types/BasicTypes';
import { getAuthHeaders, getMultipartHeaders } from './config';

const inventoryAPI = {
  categories: {
    getAll: async (): Promise<InventoryCategory[]> => {
      const response: any = await axios.get('/inventory/categories', {
        headers: getAuthHeaders(),
      });
      // Pastikan data yang dikembalikan adalah array
      const responseData = response.data;
      const data = responseData && Array.isArray(responseData.data) ? responseData.data : 
                  (responseData && Array.isArray(responseData) ? responseData : []);
      return data;
    },
    
    create: async (categoryData: Omit<InventoryCategory, 'id'>): Promise<InventoryCategory> => {
      const response: any = await axios.post('/inventory/categories', categoryData, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    },
    
    update: async (id: string, categoryData: Partial<InventoryCategory>): Promise<InventoryCategory> => {
      const response: any = await axios.put(`/inventory/categories/${id}`, categoryData, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    },
    
    delete: async (id: string): Promise<void> => {
      await axios.delete(`/inventory/categories/${id}`, {
        headers: getAuthHeaders(),
      });
    },
  },
  
  data: {
    getAll: async (): Promise<InventoryData[]> => {
      const response: any = await axios.get('/inventory/data', {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    },
    
    getByCategory: async (categoryId: string): Promise<InventoryData[]> => {
      const response: any = await axios.get(`/inventory/categories/${categoryId}/data`, {
        headers: getAuthHeaders(),
      });
      // Handle response structure: { data: [...], status: 200 }
      const responseData = response.data;
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        return responseData.data;
      } else if (Array.isArray(responseData)) {
        return responseData;
      }
      return [];
    },
    
    create: async (inventoryData: FormData): Promise<InventoryData> => {
      const response: any = await axios.post(`/inventory/categories/${inventoryData.get('category_id')}/data`, inventoryData, {
        headers: getMultipartHeaders(),
      });
      return response.data.data;
    },
    
    update: async (id: string, inventoryData: FormData): Promise<InventoryData> => {
      const response: any = await axios.put(`/inventory/data/${id}`, inventoryData, {
        headers: getMultipartHeaders(),
      });
      return response.data.data;
    },
    
    delete: async (id: string): Promise<void> => {
      await axios.delete(`/inventory/data/${id}`, {
        headers: getAuthHeaders(),
      });
    },
  },
  
  images: {
    deleteImage: async (dataId: string, imageName: string): Promise<void> => {
      await axios.delete(`/inventory/data/${dataId}/images/${imageName}`, {
        headers: getAuthHeaders(),
      });
    },
  },
};

export default inventoryAPI;