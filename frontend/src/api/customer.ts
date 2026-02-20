import axios from 'axios';
import { getAuthHeaders } from './config';
import type { Customer, CreateCustomerRequest } from '../types/customer';

const API_BASE = (import.meta as any).env.VITE_API_URL;

function getCustomerUrl(path: string): string {
  if (API_BASE) return `${API_BASE}/customers${path}`;
  return `/api/customers${path}`;
}

interface ApiRes<T = unknown> {
  data?: T;
}

export const customerApi = {
  async getList(q?: string): Promise<Customer[]> {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    const res = await axios.get<ApiRes<Customer[]>>(getCustomerUrl('' + params), { headers: getAuthHeaders() });
    const data = res.data?.data ?? (res.data as unknown as Customer[]);
    return Array.isArray(data) ? data : [];
  },

  async getById(id: number | string): Promise<Customer | null> {
    try {
      const res = await axios.get<ApiRes<Customer>>(getCustomerUrl(`/${id}`), { headers: getAuthHeaders() });
      return res.data?.data ?? (res.data as unknown as Customer) ?? null;
    } catch {
      return null;
    }
  },

  async create(payload: CreateCustomerRequest): Promise<Customer> {
    const res = await axios.post<ApiRes<Customer>>(getCustomerUrl(''), payload, { headers: getAuthHeaders() });
    return res.data?.data ?? (res.data as unknown as Customer);
  },

  async update(id: number | string, payload: CreateCustomerRequest & { name: string }): Promise<Customer> {
    const res = await axios.put<ApiRes<Customer>>(getCustomerUrl(`/${id}`), payload, { headers: getAuthHeaders() });
    return res.data?.data ?? (res.data as unknown as Customer);
  },

  async delete(id: number | string): Promise<void> {
    await axios.delete(getCustomerUrl(`/${id}`), { headers: getAuthHeaders() });
  },
};
