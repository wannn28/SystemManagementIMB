import axios from 'axios';
import { getAuthHeaders } from './config';
import { FinanceEntry } from '../types/BasicTypes';

const API_URL = import.meta.env.VITE_API_URL + '/finance';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export const financeAPI = {
  categories: {
    list: async (): Promise<Array<{id:number; name:string}>> => {
      const response: any = await axios.get(`${API_URL}/categories`, { headers: getAuthHeaders() });
      return response.data?.data || [];
    },
    create: async (name: string): Promise<{id:number; name:string}> => {
      const response: any = await axios.post(`${API_URL}/categories`, { name }, { headers: getAuthHeaders() });
      return response.data?.data;
    },
    update: async (id: number, name: string): Promise<{id:number; name:string}> => {
      const response: any = await axios.put(`${API_URL}/categories/${id}`, { name }, { headers: getAuthHeaders() });
      return response.data?.data;
    },
    delete: async (id: number): Promise<void> => {
      await axios.delete(`${API_URL}/categories/${id}`, { headers: getAuthHeaders() });
    }
  },
  // Get all finance entries by type using the correct filter endpoint
  getFinanceByType: async (type: 'income' | 'expense'): Promise<FinanceEntry[]> => {
    console.log(`Fetching finance data for type: ${type}`);
    try {
      // Use the correct filter endpoint according to documentation
      const response: any = await axios.get(`${API_URL}/filter/type?type=${type}`);
      console.log(`API response for ${type}:`, response.data);
      return response.data?.data || [];
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      // Fallback: try to get all data and filter manually
      try {
        const allResponse: any = await axios.get(API_URL);
        const allData = allResponse.data?.data || [];
        const filteredData = allData.filter((item: any) => item.type === type);
        console.log(`Fallback filtering for ${type}:`, filteredData.length, 'items found');
        return filteredData;
      } catch (fallbackError) {
        console.error(`Fallback failed for ${type}:`, fallbackError);
        return [];
      }
    }
  },

  // Get all finance entries (simple endpoint)
  getAll: async (): Promise<FinanceEntry[]> => {
    const response: any = await axios.get(API_URL);
    return response.data?.data || [];
  },

  // Get finance entries with pagination and filtering
  getPaginated: async (params: PaginationParams): Promise<PaginatedResponse<FinanceEntry>> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);
    if (params.filter) queryParams.append('filter', params.filter);

    const response: any = await axios.get(`${API_URL}/paginated?${queryParams}`);
    return response.data;
  },

  // Get finance entries by type with pagination
  getFinanceByTypePaginated: async (
    type: 'income' | 'expense', 
    params: PaginationParams
  ): Promise<PaginatedResponse<FinanceEntry>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('type', type);
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);
    if (params.filter) queryParams.append('filter', params.filter);

    const response: any = await axios.get(`${API_URL}/filter/type?${queryParams}`);
    return response.data;
  },

  // Get finance entry by ID
  getFinanceById: async (id: number): Promise<FinanceEntry> => {
    const response: any = await axios.get(`${API_URL}/${id}`);
    return response.data.data;
  },

  // Create new finance entry
  createFinance: async (data: Partial<FinanceEntry>): Promise<FinanceEntry> => {
    const response: any = await axios.post(API_URL, data);
    return response.data.data;
  },

  // Update finance entry
  updateFinance: async (id: number, data: Partial<FinanceEntry>): Promise<FinanceEntry> => {
    const response: any = await axios.put(`${API_URL}/${id}`, data);
    return response.data.data;
  },

  // Delete finance entry
  deleteFinance: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },

  // Get finance summary
  getFinanceSummary: async () => {
    const response: any = await axios.get(`${API_URL}/summary`);
    return response.data.data;
  },

  // Get monthly finance data
  getMonthlyFinance: async () => {
    const response: any = await axios.get(`${API_URL}/monthly`);
    return response.data.data;
  },

  // Enhanced filtering methods
  filterByDateRange: async (startDate: string, endDate: string): Promise<FinanceEntry[]> => {
    const response: any = await axios.get(`${API_URL}/filter/date-range?start_date=${startDate}&end_date=${endDate}`);
    return response.data?.data || [];
  },

  filterByAmountRange: async (minAmount: number, maxAmount: number): Promise<FinanceEntry[]> => {
    const response: any = await axios.get(`${API_URL}/filter/amount-range?min_amount=${minAmount}&max_amount=${maxAmount}`);
    return response.data?.data || [];
  },

  filterByCategory: async (category: string): Promise<FinanceEntry[]> => {
    const response: any = await axios.get(`${API_URL}/filter/category?category=${category}`);
    return response.data?.data || [];
  },

  filterByStatus: async (status: 'Paid' | 'Unpaid'): Promise<FinanceEntry[]> => {
    const response: any = await axios.get(`${API_URL}/filter/status?status=${status}`);
    return response.data?.data || [];
  },
};