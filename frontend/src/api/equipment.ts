import axios from 'axios';
import { getAuthHeaders } from './config';
import type { Equipment, CreateEquipmentRequest } from '../types/equipment';

const API_BASE = (import.meta as any).env.VITE_API_URL;

function getEquipmentUrl(path: string): string {
  if (API_BASE) return `${API_BASE}/equipment${path}`;
  return `/api/equipment${path}`;
}

interface ApiRes<T = unknown> {
  data?: T;
}

export const equipmentApi = {
  async getList(q?: string, type?: string): Promise<Equipment[]> {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (type) params.set('type', type);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const res = await axios.get<ApiRes<Equipment[]>>(getEquipmentUrl('' + suffix), { headers: getAuthHeaders() });
    const data = res.data?.data ?? (res.data as unknown as Equipment[]);
    return Array.isArray(data) ? data : [];
  },

  async getById(id: number | string): Promise<Equipment | null> {
    try {
      const res = await axios.get<ApiRes<Equipment>>(getEquipmentUrl(`/${id}`), { headers: getAuthHeaders() });
      return res.data?.data ?? (res.data as unknown as Equipment) ?? null;
    } catch {
      return null;
    }
  },

  async create(payload: CreateEquipmentRequest): Promise<Equipment> {
    const res = await axios.post<ApiRes<Equipment>>(getEquipmentUrl(''), payload, { headers: getAuthHeaders() });
    return res.data?.data ?? (res.data as unknown as Equipment);
  },

  async update(id: number | string, payload: CreateEquipmentRequest & { name: string; type?: string }): Promise<Equipment> {
    const res = await axios.put<ApiRes<Equipment>>(getEquipmentUrl(`/${id}`), payload, { headers: getAuthHeaders() });
    return res.data?.data ?? (res.data as unknown as Equipment);
  },

  async delete(id: number | string): Promise<void> {
    await axios.delete(getEquipmentUrl(`/${id}`), { headers: getAuthHeaders() });
  },
};
