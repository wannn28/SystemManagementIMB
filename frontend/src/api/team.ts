import axios from 'axios';
import { Member, SalaryDetail, Kasbon, SalaryRecord, PaginatedResponse, QueryParams } from '../types/BasicTypes';
import { getAuthHeaders, getMultipartHeaders } from './config';

const API_URL = import.meta.env.VITE_API_URL;

export const teamAPI = {
  // Member related endpoints
  members: {
    // Get all team members
    getAll: async (): Promise<Member[]> => {
      const response: any = await axios.get(`${API_URL}/members`, {
        headers: getAuthHeaders()
      });
      return response.data.data || [];
    },

    // Get paginated team members
    getPaginated: async (params: QueryParams): Promise<PaginatedResponse<Member>> => {
      const queryString = new URLSearchParams();
      
      if (params.page) queryString.append('page', params.page.toString());
      if (params.limit) queryString.append('limit', params.limit.toString());
      if (params.search) queryString.append('search', params.search);
      if (params.sort) queryString.append('sort', params.sort);
      if (params.order) queryString.append('order', params.order);
      if (params.filter) queryString.append('filter', params.filter);
      
      const response: any = await axios.get(`${API_URL}/members/paginated?${queryString.toString()}`, {
        headers: getAuthHeaders()
      });
      
      return {
        data: response.data.data || [],
        pagination: {
          page: response.data.pagination?.page || 1,
          limit: response.data.pagination?.limit || 10,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.total_pages || 0,
          hasNext: response.data.pagination?.has_next || false,
          hasPrev: response.data.pagination?.has_prev || false
        }
      };
    },

    // Create new member
    create: async (memberData: Partial<Member>, profileImage?: File): Promise<Member> => {
      const formData = new FormData();
      
      // Add member data as JSON
      formData.append('data', JSON.stringify(memberData));
      
      // Add profile image if provided
      if (profileImage) {
        formData.append('file', profileImage);
      }
      
      const response: any = await axios.post(`${API_URL}/members`, formData, {
        headers: getMultipartHeaders()
      });
      
      return response.data.data;
    },

    // Update member
    update: async (id: string, memberData: Partial<Member>): Promise<Member> => {
      const response: any = await axios.put(`${API_URL}/members/${id}`, memberData, {
        headers: getAuthHeaders()
      });
      
      return response.data.data;
    },

    // Delete member
    delete: async (id: string): Promise<void> => {
      await axios.delete(`${API_URL}/members/${id}`, {
        headers: getAuthHeaders()
      });
    },

    // Upload profile image
    uploadProfileImage: async (memberId: string, file: File): Promise<{fileName: string}> => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response: any = await axios.post(
        `${API_URL}/members/${memberId}/profile`,
        formData,
        {
          headers: getMultipartHeaders()
        }
      );
      
      return response.data.data;
    },

    // Upload documents
    uploadDocuments: async (memberId: string, files: File[]): Promise<string[]> => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      const response: any = await axios.post(
        `${API_URL}/members/${memberId}/documents`,
        formData,
        {
          headers: getMultipartHeaders()
        }
      );
      // Normalize response to always be a string array
      const data = response?.data?.data;
      if (Array.isArray(data)) return data as string[];
      if (typeof data === 'string') return [data];
      if (Array.isArray(data?.files)) return data.files as string[];
      if (typeof data?.file === 'string') return [data.file];
      return [];
    },

    // Delete document
    deleteDocument: async (memberId: string, fileName: string): Promise<void> => {
      await axios.delete(`${API_URL}/members/${memberId}/documents/${fileName}`, {
        headers: getAuthHeaders()
      });
    },

    // Deactivate member
    deactivate: async (memberId: string, reason: string): Promise<{message: string}> => {
      const response: any = await axios.post(
        `${API_URL}/members/${memberId}/deactivate`,
        { reason },
        {
          headers: getAuthHeaders()
        }
      );
      return response.data.data;
    },

    // Activate member
    activate: async (memberId: string): Promise<{message: string}> => {
      const response: any = await axios.post(
        `${API_URL}/members/${memberId}/activate`,
        {},
        {
          headers: getAuthHeaders()
        }
      );
      return response.data.data;
    },

    // Get total salary for a specific member
    getTotalSalary: async (memberId: string): Promise<{member_id: string, total_salary: number}> => {
      const response: any = await axios.get(
        `${API_URL}/members/${memberId}/total-salary`,
        {
          headers: getAuthHeaders()
        }
      );
      return response.data.data;
    },

    // Get total salary for all members
    getAllTotalSalary: async (): Promise<{total_salary: number}> => {
      const response: any = await axios.get(
        `${API_URL}/members/total-salary`,
        {
          headers: getAuthHeaders()
        }
      );
      return response.data.data;
    },

    // Get total salary for a specific member with filter
    getTotalSalaryWithFilter: async (memberId: string, year?: string, month?: string): Promise<{member_id: string, year: string, month: string, total_salary: number}> => {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      
      const response: any = await axios.get(
        `${API_URL}/members/${memberId}/total-salary/filter?${params.toString()}`,
        {
          headers: getAuthHeaders()
        }
      );
      return response.data.data;
    },

    // Get total salary for all members with filter
    getAllTotalSalaryWithFilter: async (year?: string, month?: string): Promise<{year: string, month: string, total_salary: number}> => {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      
      const response: any = await axios.get(
        `${API_URL}/members/total-salary/filter?${params.toString()}`,
        {
          headers: getAuthHeaders()
        }
      );
      return response.data.data;
    },

    // Get all members with salary info (with filter and sort)
    getAllWithSalaryInfo: async (year?: string, month?: string, order: 'asc' | 'desc' = 'desc'): Promise<{
      member_id: string;
      full_name: string;
      role: string;
      total_salary: number;
      is_active: boolean;
    }[]> => {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      params.append('order', order);
      
      const response: any = await axios.get(
        `${API_URL}/members/salary-info?${params.toString()}`,
        {
          headers: getAuthHeaders()
        }
      );
      return response.data.data;
    },

    // Get member monthly salary details
    getMonthlySalaryDetails: async (memberId: string, year?: string): Promise<{
      month: string;
      salary: number;
      loan: number;
      net_salary: number;
      gross_salary: number;
      status: string;
      created_at: string;
    }[]> => {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      
      const response: any = await axios.get(
        `${API_URL}/members/${memberId}/monthly-salary-details?${params.toString()}`,
        {
          headers: getAuthHeaders()
        }
      );
      return response.data.data || [];
    },
  },

  // Salary related endpoints
  salaries: {
    // Get salaries for a member
    getByMemberId: async (memberId: string): Promise<SalaryRecord[]> => {
      const response: any = await axios.get(`${API_URL}/members/${memberId}/salaries`, {
        headers: getAuthHeaders()
      });
      
      return response.data.data || [];
    },

    // Get salary by ID
    getBySalaryId: async (salaryId: string): Promise<SalaryRecord> => {
      const response: any = await axios.get(`${API_URL}/salaries/${salaryId}`, {
        headers: getAuthHeaders()
      });
      
      return response.data.data;
    },

    // Create new salary
    create: async (memberId: string, salaryData: Partial<SalaryRecord>): Promise<SalaryRecord> => {
      const response: any = await axios.post(
        `${API_URL}/members/${memberId}/salaries`,
        salaryData,
        {
          headers: getAuthHeaders()
        }
      );
      
      return response.data.data;
    },

    // Update salary
    update: async (memberId: string, salaryId: string, salaryData: Partial<SalaryRecord>): Promise<SalaryRecord> => {
      const response: any = await axios.put(
        `${API_URL}/members/${memberId}/salaries/${salaryId}`,
        salaryData,
        {
          headers: getAuthHeaders()
        }
      );
      
      return response.data.data;
    },

    // Delete salary
    delete: async (memberId: string, salaryId: string): Promise<void> => {
      await axios.delete(`${API_URL}/members/${memberId}/salaries/${salaryId}`, {
        headers: getAuthHeaders()
      });
    },

    // Upload salary documents
    uploadDocuments: async (salaryId: string, files: File[]): Promise<string[]> => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      const response: any = await axios.post(
        `${API_URL}/salaries/${salaryId}/documents`,
        formData,
        {
          headers: getMultipartHeaders()
        }
      );
      // Normalize response to always be a string array
      const data = response?.data?.data;
      if (Array.isArray(data)) return data as string[];
      if (typeof data === 'string') return [data];
      if (Array.isArray(data?.files)) return data.files as string[];
      if (typeof data?.file === 'string') return [data.file];
      return [];
    },

    // Delete salary document
    deleteDocument: async (salaryId: string, fileName: string): Promise<void> => {
      await axios.delete(`${API_URL}/salaries/${salaryId}/documents/${fileName}`, {
        headers: getAuthHeaders()
      });
    },
  },

  // Salary details related endpoints
  salaryDetails: {
    // Get salary details
    getBySalaryId: async (salaryId: string): Promise<SalaryDetail[]> => {
      const response: any = await axios.get(`${API_URL}/salaries/${salaryId}/details`, {
        headers: getAuthHeaders()
      });
      
      return response.data.data || [];
    },

    // Create salary detail
    create: async (salaryId: string, detailData: Partial<SalaryDetail>): Promise<SalaryDetail> => {
      const response: any = await axios.post(
        `${API_URL}/salaries/${salaryId}/details`,
        { ...detailData, tanggal: new Date(detailData.tanggal as string).toISOString() },
        {
          headers: getAuthHeaders()
        }
      );
      
      return response.data.data;
    },

    // Update salary detail
    update: async (salaryId: string, detailId: string, detailData: Partial<SalaryDetail>): Promise<SalaryDetail> => {
      const response: any = await axios.put(
        `${API_URL}/salaries/${salaryId}/details/${detailId}`,
        { ...detailData, tanggal: new Date(detailData.tanggal as string).toISOString() },
        {
          headers: getAuthHeaders()
        }
      );
      
      return response.data.data;
    },

    // Delete salary detail
    delete: async (salaryId: string, detailId: string): Promise<void> => {
      await axios.delete(`${API_URL}/salaries/${salaryId}/details/${detailId}`, {
        headers: getAuthHeaders()
      });
    },
  },

  // Kasbon related endpoints
  kasbons: {
    // Get kasbons for a salary
    getBySalaryId: async (salaryId: string): Promise<Kasbon[]> => {
      const response: any = await axios.get(`${API_URL}/salaries/${salaryId}/kasbons`, {
        headers: getAuthHeaders()
      });
      
      return response.data.data || [];
    },

    // Create kasbon
    create: async (salaryId: string, kasbonData: Partial<Kasbon>): Promise<Kasbon> => {
      const response: any = await axios.post(
        `${API_URL}/salaries/${salaryId}/kasbons`,
        { ...kasbonData, tanggal: new Date(kasbonData.tanggal as string).toISOString() },
        {
          headers: getAuthHeaders()
        }
      );
      
      return response.data.data;
    },

    // Update kasbon
    update: async (kasbonId: string, kasbonData: Partial<Kasbon>): Promise<Kasbon> => {
      const response: any = await axios.put(
        `${API_URL}/kasbons/${kasbonId}`,
        { ...kasbonData, tanggal: new Date(kasbonData.tanggal as string).toISOString() },
        {
          headers: getAuthHeaders()
        }
      );
      
      return response.data.data;
    },

    // Delete kasbon
    delete: async (kasbonId: string): Promise<void> => {
      await axios.delete(`${API_URL}/kasbons/${kasbonId}`, {
        headers: getAuthHeaders()
      });
    },
  },
};