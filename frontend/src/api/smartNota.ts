import { SMART_NOTA_BASE_URL, SMART_NOTA_ENDPOINTS, createSmartNotaHeaders } from '../utils/apiKey';

// Types for Smart Nota API
export interface SmartNotaInvoiceItem {
  id: number;
  invoice_id: number;
  item_name: string;
  quantity: number;
  price: number;
  total: number;
  description: string;
  custom_data: any;
  created_at: string;
  updated_at: string;
}

export interface SmartNotaCustomer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    company_name: string;
    created_at: string;
    updated_at: string;
  };
}

export interface SmartNotaTemplate {
  id: number;
  user_id: number;
  name: string;
  layout: any[];
  item_fields: any;
  template_design_data: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    company_name: string;
    created_at: string;
    updated_at: string;
  };
}

export interface SmartNotaSignature {
  id: number;
  invoice_id: number;
  signer_name: string;
  signer_email: string;
  role: string;
  signature_file: string;
  cloudinary_url: string;
  cloudinary_id: string;
  signed_at: string;
  created_at: string;
  updated_at: string;
}

export interface SmartNotaInvoice {
  id: number;
  template_id: number;
  customer_id: number;
  user_id: number;
  data: Record<string, any>;
  items: SmartNotaInvoiceItem[];
  photos: any[];
  signatures: SmartNotaSignature[];
  status: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  customer: SmartNotaCustomer;
  template: SmartNotaTemplate;
  user: {
    id: number;
    name: string;
    email: string;
    company_name: string;
    created_at: string;
    updated_at: string;
  };
}

export interface CreateInvoiceRequest {
  template_id: number;
  customer_id: number;
  data: Record<string, any>;
  items: SmartNotaInvoiceItem[];
}

export interface UpdateInvoiceRequest extends CreateInvoiceRequest {}

export interface SmartNotaApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

// Smart Nota API Service
class SmartNotaApiService {
  private baseUrl = SMART_NOTA_BASE_URL;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const headers = createSmartNotaHeaders();
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Smart Nota API Error:', error);
      throw error;
    }
  }

  // Get all invoices with pagination
  async getInvoices(params: {
    page?: number;
    per_page?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<PaginatedResponse<SmartNotaInvoice>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.order) searchParams.append('order', params.order);
    if (params.search) searchParams.append('search', params.search);
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);

    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `${SMART_NOTA_ENDPOINTS.INVOICES}?${queryString}`
      : SMART_NOTA_ENDPOINTS.INVOICES;

    return this.makeRequest<PaginatedResponse<SmartNotaInvoice>>(endpoint);
  }

  // Get invoice by ID
  async getInvoice(id: string | number): Promise<SmartNotaInvoice> {
    return this.makeRequest<SmartNotaInvoice>(SMART_NOTA_ENDPOINTS.INVOICE_BY_ID(id));
  }

  // Create new invoice
  async createInvoice(data: CreateInvoiceRequest): Promise<SmartNotaInvoice> {
    return this.makeRequest<SmartNotaInvoice>(SMART_NOTA_ENDPOINTS.INVOICES, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update invoice
  async updateInvoice(id: string | number, data: UpdateInvoiceRequest): Promise<SmartNotaInvoice> {
    return this.makeRequest<SmartNotaInvoice>(SMART_NOTA_ENDPOINTS.INVOICE_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete invoice
  async deleteInvoice(id: string | number): Promise<void> {
    return this.makeRequest<void>(SMART_NOTA_ENDPOINTS.INVOICE_BY_ID(id), {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const smartNotaApi = new SmartNotaApiService(); 