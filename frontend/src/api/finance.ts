import axios from 'axios';
import { FinanceEntry } from '../types/BasicTypes';

const API_URL = import.meta.env.VITE_API_URL + '/finance';

export const financeAPI = {
  // Get all finance entries by type
  getFinanceByType: async (type: 'income' | 'expense'): Promise<FinanceEntry[]> => {
    const response = await axios.get(`${API_URL}?type=${type}`);
    return response.data?.data || [];
  },

  // Get finance entry by ID
  getFinanceById: async (id: number): Promise<FinanceEntry> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data.data;
  },

  // Create new finance entry
  createFinance: async (data: Partial<FinanceEntry>): Promise<FinanceEntry> => {
    const response = await axios.post(API_URL, data);
    return response.data.data;
  },

  // Update finance entry
  updateFinance: async (id: number, data: Partial<FinanceEntry>): Promise<FinanceEntry> => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data.data;
  },

  // Delete finance entry
  deleteFinance: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },

  // Get finance summary
  getFinanceSummary: async () => {
    const response = await axios.get(`${API_URL}/summary`);
    return response.data.data;
  },

  // Get monthly finance data
  getMonthlyFinance: async () => {
    const response = await axios.get(`${API_URL}/monthly`);
    return response.data.data;
  },
};