/**
 * Tipe data untuk fitur Invoice & Template
 * Dasar - bisa diperluas step by step
 */

export interface InvoiceItem {
  id?: string | number;
  item_name: string;
  description?: string;
  quantity: number;
  price: number;
  total: number;
  /** Tanggal (e.g. "31 Januari 2026") */
  row_date?: string;
  /** Hari (0.5, 1, ...) untuk sewa */
  days?: number;
  /** BBM (Jerigen) - jumlah */
  bbm_quantity?: number;
  /** Harga per jerigen BBM */
  bbm_unit_price?: number;
  /** Unit berbeda (dari "Tambah Unit Berbeda"), untuk grand total 2+ alat */
  equipment_group?: string;
}

export interface InvoiceTemplate {
  id: number | string;
  name: string;
  description?: string;
  layout?: string;
  options?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id?: string | number;
  template_id: number | string;
  template?: InvoiceTemplate;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  items: InvoiceItem[];
  subtotal?: number;
  tax_percent?: number;
  tax_amount?: number;
  total?: number;
  notes?: string;
  /** Note "Sudah termasuk BBM" */
  include_bbm_note?: boolean;
  /** Tampilkan kolom BBM per baris (Bbm Jerigen, Harga/Bbm) */
  use_bbm_columns?: boolean;
  location?: string;
  subject?: string;
  /** Nama alat berat / kendaraan, e.g. "Grader & Compact", "Dump Truck 6 Roda" */
  equipment_name?: string;
  intro_paragraph?: string;
  bank_account?: string;
  /** Terbilang manual (kosong = pakai otomatis dari total) */
  terbilang_custom?: string;
  /** Satuan quantity: hari, jam, unit, jerigen */
  quantity_unit?: string;
  /** Label harga: Harga/Hari, Harga/Jam, dll */
  price_unit_label?: string;
  /** Label kolom item: Item, Keterangan, dll */
  item_column_label?: string;
  created_at?: string;
  updated_at?: string;
}

/** Payload untuk buat invoice baru */
export interface CreateInvoiceRequest {
  template_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  items: Array<{
    item_name: string;
    description?: string;
    quantity: number;
    price: number;
    row_date?: string;
    days?: number;
    bbm_quantity?: number;
    bbm_unit_price?: number;
    equipment_group?: string;
  }>;
  tax_percent?: number;
  notes?: string;
  include_bbm_note?: boolean;
  use_bbm_columns?: boolean;
  location?: string;
  subject?: string;
  equipment_name?: string;
  intro_paragraph?: string;
  bank_account?: string;
  terbilang_custom?: string;
  quantity_unit?: string;
  price_unit_label?: string;
  item_column_label?: string;
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: string; // e.g. "status:draft" or "status:paid,start_date:2024-01-01,end_date:2024-12-31"
}

export interface InvoiceListResponse {
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
