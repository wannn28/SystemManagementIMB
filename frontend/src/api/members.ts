import axios from 'axios';
import { Member, SalaryDetail, Kasbon } from '../types/BasicTypes';

const API_URL = import.meta.env.VITE_API_URL + '/members';

export const membersAPI = {
  // Get all members
  getAllMembers: async (): Promise<Member[]> => {
    const response = await axios.get(API_URL);
    return response.data.data || [];
  },

  // Get member by ID
  getMemberById: async (id: string): Promise<Member> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data.data;
  },

  // Create new member
  createMember: async (data: Partial<Member>): Promise<Member> => {
    const response = await axios.post(API_URL, data);
    return response.data.data;
  },

  // Update member
  updateMember: async (id: string, data: Partial<Member>): Promise<Member> => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data.data;
  },

  // Delete member
  deleteMember: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },

  // Get member count
  getMemberCount: async (): Promise<{count: number}> => {
    const response = await axios.get(`${API_URL}/count`);
    return response.data.data;
  },

  // Upload member documents
  uploadDocuments: async (memberId: string, files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await axios.post(
      `${API_URL}/${memberId}/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      }
    );
    return response.data;
  },

  // Salary related endpoints
  salary: {
    // Add salary detail
    addSalaryDetail: async (salaryId: number, data: Partial<SalaryDetail>): Promise<SalaryDetail> => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/salaries/${salaryId}/details`,
        { ...data, tanggal: new Date(data.tanggal as string).toISOString() }
      );
      return response.data.data;
    },

    // Update salary detail
    updateSalaryDetail: async (salaryId: string, detailId: string, data: Partial<SalaryDetail>): Promise<SalaryDetail> => {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/salaries/${salaryId}/details/${detailId}`,
        { ...data, tanggal: new Date(data.tanggal as string).toISOString() }
      );
      return response.data.data;
    },

    // Delete salary detail
    deleteSalaryDetail: async (salaryId: string, detailId: string): Promise<void> => {
      await axios.delete(`${import.meta.env.VITE_API_URL}/salaries/${salaryId}/details/${detailId}`);
    },
  },

  // Kasbon related endpoints
  kasbon: {
    // Get kasbons for a salary
    getKasbons: async (salaryId: string): Promise<Kasbon[]> => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/salaries/${salaryId}/kasbons`);
      return response.data.data || [];
    },

    // Add kasbon
    addKasbon: async (salaryId: number, data: Partial<Kasbon>): Promise<Kasbon> => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/salaries/${salaryId}/kasbons`,
        { ...data, tanggal: new Date(data.tanggal as string).toISOString() }
      );
      return response.data.data;
    },

    // Update kasbon
    updateKasbon: async (kasbonId: string, data: Partial<Kasbon>): Promise<Kasbon> => {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/kasbons/${kasbonId}`,
        { ...data, tanggal: new Date(data.tanggal as string).toISOString() }
      );
      return response.data.data;
    },

    // Delete kasbon
    deleteKasbon: async (kasbonId: string): Promise<void> => {
      await axios.delete(`${import.meta.env.VITE_API_URL}/kasbons/${kasbonId}`);
    },
  },
};