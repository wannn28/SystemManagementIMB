export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}
