import axios from 'axios';
import { Project } from '../types/BasicTypes';

const API_URL = import.meta.env.VITE_API_URL + '/projects';

export const projectsAPI = {
  // Get all projects
  getAllProjects: async (): Promise<Project[]> => {
    const response: any = await axios.get(API_URL);
    return response.data.data || [];
  },

  // Get project by ID
  getProjectById: async (id: number): Promise<Project> => {
    const response: any = await axios.get(`${API_URL}/${id}`);
    return response.data.data;
  },

  // Create new project
  createProject: async (data: Partial<Project>): Promise<Project> => {
    const response: any = await axios.post(API_URL, data);
    return response.data.data;
  },

  // Update project
  updateProject: async (id: number, data: Partial<Project>): Promise<Project> => {
    const response: any = await axios.put(`${API_URL}/${id}`, data);
    return response.data.data;
  },

  // Delete project
  deleteProject: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },

  // Get project count
  getProjectCount: async (): Promise<{count: number}> => {
    const response: any = await axios.get(`${API_URL}/count`);
    return response.data.data;
  },

  // Reports related endpoints
  reports: {
    // Get all reports for a project
    getReports: async (projectId: number) => {
      const response: any = await axios.get(`${API_URL}/${projectId}/reports`);
      return response.data.data;
    },

    // Add report
    addReport: async (projectId: number, reportType: 'daily' | 'weekly' | 'monthly', data: any) => {
      const response: any = await axios.post(`${API_URL}/${projectId}/reports/${reportType}`, data);
      return response.data.data;
    },

    // Update report
    updateReport: async (reportId: number, data: any) => {
      const response: any = await axios.put(`${import.meta.env.VITE_API_URL}/reports/${reportId}`, data);
      return response.data.data;
    },

    // Delete report
    deleteReport: async (reportId: number): Promise<void> => {
      await axios.delete(`${import.meta.env.VITE_API_URL}/reports/${reportId}`);
    },
  },
};