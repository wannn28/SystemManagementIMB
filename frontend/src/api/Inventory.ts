import axios from 'axios';
import { TableHeader } from '../types/BasicTypes';

const API_URL = 'http://localhost:8080/inventory';

interface InventoryCategory {
  id: string;
  title: string;
  description: string;
  headers: TableHeader[];
}

interface InventoryData {
  id: string;
  categoryId: string;
  values: Record<string, any>;
}

export const inventoryAPI = {
  // Kategori
  getCategories: async (): Promise<InventoryCategory[]> => {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  },

  getCategory: async (id: string): Promise<InventoryCategory> => {
    const response = await axios.get(`${API_URL}/categories/${id}`);
    return response.data;
  },

  // Data
  getCategoryData: async (categoryId: string): Promise<InventoryData[]> => {
    const response = await axios.get(`${API_URL}/categories/${categoryId}/data`);
    return response.data;
  },
  
  // Fungsi lainnya untuk create/update/delete...
};