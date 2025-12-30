import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/project-incomes';

export interface ProjectIncome {
  id: number;
  projectId: number;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  status: 'Received' | 'Pending' | 'Planned';
  createdAt: string;
  updatedAt: string;
}

export interface ProjectIncomeCreateRequest {
  projectId: number;
  tanggal: string;
  kategori: string;
  deskripsi?: string;
  jumlah: number;
  status: 'Received' | 'Pending' | 'Planned';
}

export interface ProjectIncomeUpdateRequest {
  tanggal?: string;
  kategori?: string;
  deskripsi?: string;
  jumlah?: number;
  status?: 'Received' | 'Pending' | 'Planned';
}

export const projectIncomesAPI = {
  // Create new income
  createIncome: async (data: ProjectIncomeCreateRequest): Promise<ProjectIncome> => {
    const response: any = await axios.post(API_URL, data);
    return response.data.data;
  },

  // Update income
  updateIncome: async (id: number, data: ProjectIncomeUpdateRequest): Promise<ProjectIncome> => {
    const response: any = await axios.put(`${API_URL}/${id}`, data);
    return response.data.data;
  },

  // Delete income
  deleteIncome: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },

  // Get income by ID
  getIncomeById: async (id: number): Promise<ProjectIncome> => {
    const response: any = await axios.get(`${API_URL}/${id}`);
    return response.data.data;
  },

  // Get all incomes
  getAllIncomes: async (): Promise<ProjectIncome[]> => {
    const response: any = await axios.get(API_URL);
    return response.data.data || [];
  },

  // Get incomes by project ID
  getIncomesByProjectId: async (projectId: number): Promise<ProjectIncome[]> => {
    const response: any = await axios.get(`${API_URL}/project/${projectId}`);
    return response.data.data || [];
  },
};

