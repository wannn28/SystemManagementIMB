import axios from 'axios';
import { InventoryCategory, InventoryData } from '../types/BasicTypes';

const inventoryAPI = {
  categories: {
    getAll: async (): Promise<InventoryCategory[]> => {
      const response = await axios.get('/api/inventory/categories', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      // Pastikan data yang dikembalikan adalah array
      const data = response.data && Array.isArray(response.data) ? response.data : 
                  (response.data && Array.isArray(response.data.data) ? response.data.data : []);
      return data;
    },
    
    create: async (categoryData: Omit<InventoryCategory, 'id'>): Promise<InventoryCategory> => {
      const response = await axios.post('/api/inventory/categories', categoryData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    
    update: async (id: string, categoryData: Partial<InventoryCategory>): Promise<InventoryCategory> => {
      const response = await axios.put(`/api/inventory/categories/${id}`, categoryData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    
    delete: async (id: string): Promise<void> => {
      await axios.delete(`/api/inventory/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    },
  },
  
  data: {
    getAll: async (): Promise<InventoryData[]> => {
      const response = await axios.get('/api/inventory/data', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    
    getByCategory: async (categoryId: string): Promise<InventoryData[]> => {
      const response = await axios.get(`/api/inventory/data/category/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    
    create: async (inventoryData: FormData): Promise<InventoryData> => {
      const response = await axios.post('/api/inventory/data', inventoryData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    
    update: async (id: string, inventoryData: FormData): Promise<InventoryData> => {
      const response = await axios.put(`/api/inventory/data/${id}`, inventoryData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    
    delete: async (id: string): Promise<void> => {
      await axios.delete(`/api/inventory/data/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    },
  },
  
  images: {
    deleteImage: async (dataId: string, imageName: string): Promise<void> => {
      await axios.delete(`/api/inventory/data/${dataId}/images/${imageName}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    },
  },
};

export default inventoryAPI;