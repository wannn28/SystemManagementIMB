import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from './config';

export interface CompanySettings {
  company_name: string;
  company_logo: string;
  primary_color: string;
  name: string;
  email: string;
}

/** Convert a relative logo path (/uploads/logos/...) to a full URL using the backend root. */
export const resolveLogoUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const backendRoot = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendRoot}${path}`;
};

export const companySettingsApi = {
  getSettings: async (): Promise<CompanySettings> => {
    const res = await axios.get(`${API_BASE_URL}/user/settings`, { headers: getAuthHeaders() });
    return res.data.data;
  },

  updateSettings: async (data: { company_name?: string; primary_color?: string }): Promise<CompanySettings> => {
    const res = await axios.put(`${API_BASE_URL}/user/settings`, data, { headers: getAuthHeaders() });
    return res.data.data;
  },

  uploadLogo: async (file: File): Promise<{ company_logo: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await axios.post(`${API_BASE_URL}/user/settings/logo`, formData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
