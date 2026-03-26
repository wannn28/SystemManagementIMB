import axios from 'axios';
import { API_BASE_URL } from './config';

export type IntegrationScopes = {
  projects: boolean;
  finance: boolean;
  reports: boolean;
  team: boolean;
  inventory: boolean;
};

export type IntegrationTokenRow = {
  id: number;
  user_id: number;
  name: string;
  token_prefix: string;
  scopes: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
};

export const integrationTokensApi = {
  list: async (): Promise<IntegrationTokenRow[]> => {
    const res: any = await axios.get(`${API_BASE_URL}/user/integration-tokens`);
    return res.data?.data || [];
  },
  create: async (name: string, scopes: IntegrationScopes) => {
    const res: any = await axios.post(`${API_BASE_URL}/user/integration-tokens`, { name, scopes });
    return res.data?.data as { id: number; token: string; token_prefix: string };
  },
  update: async (id: number, name: string, scopes: IntegrationScopes, isActive: boolean) => {
    const res: any = await axios.put(`${API_BASE_URL}/user/integration-tokens/${id}`, {
      name,
      scopes,
      is_active: isActive,
    });
    return res.data?.data;
  },
  remove: async (id: number) => {
    const res: any = await axios.delete(`${API_BASE_URL}/user/integration-tokens/${id}`);
    return res.data?.data;
  },
};

