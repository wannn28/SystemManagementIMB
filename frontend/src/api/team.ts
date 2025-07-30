import axios from 'axios';
import { Member, SalaryDetail, Kasbon, SalaryRecord, PaginatedResponse, QueryParams } from '../types/BasicTypes';
import { getAuthHeaders, getMultipartHeaders } from './config';

const API_URL = import.meta.env.VITE_API_URL;

export const teamAPI = {
  // Member related endpoints
  members: {
    // Get all team members
    getAll: async (): Promise<Member[]> => {
      const response = await axios.get(`${API_URL}/members`, {
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
      
      const response = await axios.get(`${API_URL}/members/paginated?${queryString.toString()}`, {
        headers: getAuthHeaders()
      });
      
      return {
        data: response.data.data || [],
        pagination: {
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.total_pages,
          hasNext: response.data.pagination.has_next,
          hasPrev: response.data.pagination.has_prev
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
      
      const response = await axios.post(`${API_URL}/members`, formData, {
        headers: getMultipartHeaders()
      });
      
      return response.data.data;
    },

    // Update member
    update: async (id: string, memberData: Partial<Member>): Promise<Member> => {
      const response = await axios.put(`${API_URL}/members/${id}`, memberData, {
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
      
      const response = await axios.post(
        `${API_URL}/members/${memberId}/profile`,
        formData,
        {
          headers: getMultipartHeaders()
        }
      );
      
      return response.data;
    },

    // Upload documents
    uploadDocuments: async (memberId: string, files: File[]): Promise<string[]> => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      const response = await axios.post(
        `${API_URL}/members/${memberId}/documents`,
        formData,
        {
          headers: getMultipartHeaders()
        }
      );
      
      return response.data;
    },

    // Delete document
    deleteDocument: async (memberId: string, fileName: string): Promise<void> => {
      await axios.delete(`${API_URL}/members/${memberId}/documents/${fileName}`, {
        headers: getAuthHeaders()
      });
    },
  },

  // Salary related endpoints
  salaries: {
    // Get salaries for a member
    getByMemberId: async (memberId: string): Promise<SalaryRecord[]> => {
      const response = await axios.get(`${API_URL}/members/${memberId}/salaries`, {
        headers: getAuthHeaders()
      });
      
      return response.data.data || [];
    },

    // Get salary by ID
    getBySalaryId: async (salaryId: string): Promise<SalaryRecord> => {
      const response = await axios.get(`${API_URL}/salaries/${salaryId}`, {
        headers: getAuthHeaders()
      });
      
      return response.data.data;
    },

    // Create new salary
    create: async (memberId: string, salaryData: Partial<SalaryRecord>): Promise<SalaryRecord> => {
      const response = await axios.post(
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
      const response = await axios.put(
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
      
      const response = await axios.post(
        `${API_URL}/salaries/${salaryId}/documents`,
        formData,
        {
          headers: getMultipartHeaders()
        }
      );
      
      return response.data;
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
      const response = await axios.get(`${API_URL}/salaries/${salaryId}/details`, {
        headers: getAuthHeaders()
      });
      
      return response.data.data || [];
    },

    // Create salary detail
    create: async (salaryId: string, detailData: Partial<SalaryDetail>): Promise<SalaryDetail> => {
      const response = await axios.post(
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
      const response = await axios.put(
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
      const response = await axios.get(`${API_URL}/salaries/${salaryId}/kasbons`, {
        headers: getAuthHeaders()
      });
      
      return response.data.data || [];
    },

    // Create kasbon
    create: async (salaryId: string, kasbonData: Partial<Kasbon>): Promise<Kasbon> => {
      const response = await axios.post(
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
      const response = await axios.put(
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