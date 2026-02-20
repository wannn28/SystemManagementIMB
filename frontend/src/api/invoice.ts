import axios from 'axios';
import { getAuthHeaders } from './config';
import type {
  Invoice,
  InvoiceTemplate,
  CreateInvoiceRequest,
  InvoiceListParams,
  InvoiceListResponse,
} from '../types/invoice';

const API_BASE = (import.meta as any).env.VITE_API_URL;

function getUrl(path: string): string {
  if (API_BASE) return `${API_BASE}/invoices${path}`;
  return `/api/invoices${path}`;
}

interface ApiRes<T = unknown> {
  data?: T;
  pagination?: { page: number; limit: number; total: number; total_pages: number; has_next: boolean; has_prev: boolean };
}

export const invoiceApi = {
  async getTemplates(): Promise<InvoiceTemplate[]> {
    const res = await axios.get<ApiRes<InvoiceTemplate[]>>(getUrl('/templates'), { headers: getAuthHeaders() });
    const data = res.data?.data ?? (res.data as unknown as InvoiceTemplate[]);
    return Array.isArray(data) ? data : [];
  },

  async getTemplateById(id: number | string): Promise<InvoiceTemplate | null> {
    try {
      const res = await axios.get<ApiRes<InvoiceTemplate>>(getUrl(`/templates/${id}`), { headers: getAuthHeaders() });
      return res.data?.data ?? (res.data as unknown as InvoiceTemplate) ?? null;
    } catch {
      return null;
    }
  },

  async createTemplate(body: { name: string; description?: string; layout?: string }): Promise<InvoiceTemplate> {
    const res = await axios.post<ApiRes<InvoiceTemplate>>(getUrl('/templates'), body, { headers: getAuthHeaders() });
    return res.data?.data ?? (res.data as unknown as InvoiceTemplate);
  },

  async updateTemplate(
    id: number | string,
    body: { name: string; description?: string; layout?: string }
  ): Promise<InvoiceTemplate> {
    const res = await axios.put<ApiRes<InvoiceTemplate>>(getUrl(`/templates/${id}`), body, { headers: getAuthHeaders() });
    return res.data?.data ?? (res.data as unknown as InvoiceTemplate);
  },

  async deleteTemplate(id: number | string): Promise<void> {
    await axios.delete(getUrl(`/templates/${id}`), { headers: getAuthHeaders() });
  },

  async getInvoices(params?: InvoiceListParams): Promise<InvoiceListResponse> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    if (params?.sort) q.set('sort', params.sort);
    if (params?.order) q.set('order', params.order);
    if (params?.filter) q.set('filter', params.filter);

    const res = await axios.get<InvoiceListResponse>(getUrl('') + (q.toString() ? `?${q.toString()}` : ''), {
      headers: getAuthHeaders(),
    });

    const data = res.data?.data ?? [];
    const pagination = res.data?.pagination ?? {
      page: 1,
      limit: 10,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false,
    };

    return {
      data: Array.isArray(data) ? data : [],
      pagination: {
        page: pagination.page ?? 1,
        limit: pagination.limit ?? 10,
        total: pagination.total ?? 0,
        total_pages: pagination.total_pages ?? 0,
        has_next: pagination.has_next ?? false,
        has_prev: pagination.has_prev ?? false,
      },
    };
  },

  async getInvoiceById(id: number | string): Promise<Invoice | null> {
    try {
      const res = await axios.get<ApiRes<Invoice>>(getUrl(`/${id}`), { headers: getAuthHeaders() });
      return res.data?.data ?? (res.data as unknown as Invoice) ?? null;
    } catch {
      return null;
    }
  },

  /** Daftar pelanggan dari data invoice sebelumnya (untuk pilih atau ketik manual) */
  async getCustomerSuggestions(q?: string): Promise<{ customer_name: string; customer_phone: string; customer_email: string; customer_address: string }[]> {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    const res = await axios.get<ApiRes<{ customer_name: string; customer_phone: string; customer_email: string; customer_address: string }[]>>(
      getUrl('/customer-suggestions' + params),
      { headers: getAuthHeaders() }
    );
    const data = res.data?.data ?? (res.data as unknown as { customer_name: string; customer_phone: string; customer_email: string; customer_address: string }[]);
    return Array.isArray(data) ? data : [];
  },

  async createInvoice(payload: CreateInvoiceRequest): Promise<Invoice> {
    const body = {
      template_id: payload.template_id,
      invoice_number: payload.invoice_number,
      invoice_date: payload.invoice_date,
      due_date: payload.due_date || null,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone || '',
      customer_email: payload.customer_email || '',
      customer_address: payload.customer_address || '',
      items: payload.items.map((i) => ({
        item_name: i.item_name,
        description: i.description || '',
        quantity: i.quantity ?? 1,
        price: i.price ?? 0,
        row_date: i.row_date || '',
        days: i.days ?? 0,
        bbm_quantity: i.bbm_quantity ?? 0,
        bbm_unit_price: i.bbm_unit_price ?? 0,
        equipment_group: i.equipment_group ?? '',
      })),
      tax_percent: payload.tax_percent ?? 0,
      notes: payload.notes || '',
      include_bbm_note: payload.include_bbm_note ?? false,
      use_bbm_columns: payload.use_bbm_columns ?? false,
      location: payload.location || '',
      subject: payload.subject || 'Invoice',
      equipment_name: payload.equipment_name || '',
      intro_paragraph: payload.intro_paragraph || '',
      bank_account: payload.bank_account || '',
      terbilang_custom: payload.terbilang_custom ?? '',
      quantity_unit: payload.quantity_unit || 'hari',
      price_unit_label: payload.price_unit_label || 'Harga/Hari',
    };

    const res = await axios.post<ApiRes<Invoice>>(getUrl(''), body, { headers: getAuthHeaders() });
    return res.data?.data ?? (res.data as unknown as Invoice);
  },

  async updateInvoice(
    id: number | string,
    payload: Partial<CreateInvoiceRequest> & { status?: string }
  ): Promise<Invoice> {
    const body: Record<string, unknown> = {
      template_id: payload.template_id,
      invoice_number: payload.invoice_number,
      invoice_date: payload.invoice_date,
      due_date: payload.due_date,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      customer_email: payload.customer_email,
      customer_address: payload.customer_address,
      items: payload.items?.map((i) => ({
        item_name: i.item_name,
        description: i.description || '',
        quantity: i.quantity ?? 1,
        price: i.price ?? 0,
        row_date: i.row_date || '',
        days: i.days ?? 0,
        bbm_quantity: i.bbm_quantity ?? 0,
        bbm_unit_price: i.bbm_unit_price ?? 0,
        equipment_group: i.equipment_group ?? '',
      })),
      tax_percent: payload.tax_percent,
      notes: payload.notes,
      status: payload.status,
      include_bbm_note: payload.include_bbm_note ?? false,
      use_bbm_columns: payload.use_bbm_columns ?? false,
      location: payload.location || '',
      subject: payload.subject || 'Invoice',
      equipment_name: payload.equipment_name ?? '',
      intro_paragraph: payload.intro_paragraph || '',
      bank_account: payload.bank_account || '',
      terbilang_custom: payload.terbilang_custom ?? '',
      quantity_unit: payload.quantity_unit || 'hari',
      price_unit_label: payload.price_unit_label || 'Harga/Hari',
    };
    const res = await axios.put<ApiRes<Invoice>>(getUrl(`/${id}`), body, { headers: getAuthHeaders() });
    return res.data?.data ?? (res.data as unknown as Invoice);
  },

  async deleteInvoice(id: number | string): Promise<void> {
    await axios.delete(getUrl(`/${id}`), { headers: getAuthHeaders() });
  },
};
