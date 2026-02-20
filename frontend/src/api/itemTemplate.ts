import axios from 'axios';
import { getAuthHeaders } from './config';
import type { ItemTemplate, CreateItemTemplateRequest } from '../types/itemTemplate';

const API_BASE = (import.meta as any).env.VITE_API_URL;

function getItemTemplateUrl(path: string): string {
  if (API_BASE) return `${API_BASE}/item-templates${path}`;
  return `/api/item-templates${path}`;
}

interface ApiRes<T = unknown> {
  data?: T;
}

export const itemTemplateApi = {
  async getList(q?: string): Promise<ItemTemplate[]> {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    const res = await axios.get<ApiRes<ItemTemplate[]>>(getItemTemplateUrl('' + params), { headers: getAuthHeaders() });
    const data = res.data?.data ?? (res.data as unknown as ItemTemplate[]);
    return Array.isArray(data) ? data : [];
  },

  async getById(id: number | string): Promise<ItemTemplate | null> {
    try {
      const res = await axios.get<ApiRes<ItemTemplate>>(getItemTemplateUrl(`/${id}`), { headers: getAuthHeaders() });
      return res.data?.data ?? (res.data as unknown as ItemTemplate) ?? null;
    } catch {
      return null;
    }
  },

  async create(payload: CreateItemTemplateRequest): Promise<ItemTemplate> {
    const res = await axios.post<ApiRes<ItemTemplate>>(getItemTemplateUrl(''), payload, { headers: getAuthHeaders() });
    return res.data?.data ?? (res.data as unknown as ItemTemplate);
  },

  async update(id: number | string, payload: CreateItemTemplateRequest & { name: string }): Promise<ItemTemplate> {
    const res = await axios.put<ApiRes<ItemTemplate>>(getItemTemplateUrl(`/${id}`), payload, { headers: getAuthHeaders() });
    return res.data?.data ?? (res.data as unknown as ItemTemplate);
  },

  async delete(id: number | string): Promise<void> {
    await axios.delete(getItemTemplateUrl(`/${id}`), { headers: getAuthHeaders() });
  },
};
