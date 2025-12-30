import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/project-expenses';

export interface ProjectExpense {
  id: number;
  projectId: number;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
  createdAt: string;
  updatedAt: string;
}

export interface ProjectExpenseCreateRequest {
  projectId: number;
  tanggal: string;
  kategori: string;
  deskripsi?: string;
  jumlah: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
}

export interface ProjectExpenseUpdateRequest {
  tanggal?: string;
  kategori?: string;
  deskripsi?: string;
  jumlah?: number;
  status?: 'Paid' | 'Unpaid' | 'Pending';
}

export interface ExpenseCategory {
  kategori: string;
  total: number;
  count: number;
}

export interface ProjectFinancialSummary {
  projectId: number;
  projectName: string;
  totalRevenue: number;
  totalExpenses: number;
  expensesPaid: number;
  expensesUnpaid: number;
  estimatedProfit: number;
  progressPercent: number;
  profitMargin: number;
  expenseCategories: ExpenseCategory[];
}

export const projectExpensesAPI = {
  // Create new expense
  createExpense: async (data: ProjectExpenseCreateRequest): Promise<ProjectExpense> => {
    const response: any = await axios.post(API_URL, data);
    return response.data.data;
  },

  // Update expense
  updateExpense: async (id: number, data: ProjectExpenseUpdateRequest): Promise<ProjectExpense> => {
    const response: any = await axios.put(`${API_URL}/${id}`, data);
    return response.data.data;
  },

  // Delete expense
  deleteExpense: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },

  // Get expense by ID
  getExpenseById: async (id: number): Promise<ProjectExpense> => {
    const response: any = await axios.get(`${API_URL}/${id}`);
    return response.data.data;
  },

  // Get all expenses
  getAllExpenses: async (): Promise<ProjectExpense[]> => {
    const response: any = await axios.get(API_URL);
    return response.data.data || [];
  },

  // Get expenses by project ID
  getExpensesByProjectId: async (projectId: number): Promise<ProjectExpense[]> => {
    const response: any = await axios.get(`${API_URL}/project/${projectId}`);
    return response.data.data || [];
  },

  // Get financial summary for a project
  getFinancialSummary: async (projectId: number): Promise<ProjectFinancialSummary> => {
    const response: any = await axios.get(`${API_URL}/project/${projectId}/financial-summary`);
    return response.data.data;
  },
};

