/**
 * Tipe data untuk fitur Invoice & Template
 * Dasar - bisa diperluas step by step
 */

export interface InvoiceItem {
  id?: string | number;
  item_name: string;
  /** Tampilan di kolom Keterangan: plat untuk dump truck, nama untuk alat berat (jika template pakai auto_plate_or_name) */
  item_display_name?: string;
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
  /** Urutan baris saat disimpan */
  sort_order?: number;
}

export interface InvoiceAttachment {
  image_url: string;
  caption?: string;
  file_name?: string;
}

/** Kolom tabel item yang bisa dikonfigurasi per template */
export interface TemplateItemColumn {
  key: string;
  label: string;
  /**
   * Tipe kolom:
   * - 'date': kolom tanggal
   * - 'text': kolom teks (keterangan)
   * - 'number': kolom angka (no rumus)
   * - 'formula': kolom dengan rumus
   */
  type?: 'date' | 'text' | 'number' | 'formula';
  /**
   * Rumus/relasi untuk kolom terhitung. Variabel: quantity, days, price, bbm_quantity, bbm_unit_price.
   * Operator: + - * /
   * Contoh: "quantity*price", "days*price", "bbm_quantity*bbm_unit_price", "quantity*price+bbm_quantity*bbm_unit_price"
   */
  formula?: string;
  /**
   * Sumber data untuk kolom tipe 'number' (Angka no rumus):
   * - 'manual': user isi manual (default)
   * - 'equipment_price_per_hour': otomatis dari harga per jam equipment
   * - 'equipment_price_per_day': otomatis dari harga per hari equipment
   */
  source?: 'manual' | 'equipment_price_per_hour' | 'equipment_price_per_day';
  /**
   * Format tampilan untuk kolom tipe 'number' dan 'formula':
   * - 'number': angka dengan separator ribuan (1000 → 1.000)
   * - 'rupiah': format mata uang Rp (default untuk formula)
   * - 'percent': format persen (%)
   */
  format?: 'number' | 'rupiah' | 'percent';
  /**
   * Perataan header kolom: kiri, tengah, atau kanan (default: tengah).
   */
  headerAlign?: 'left' | 'center' | 'right';
  /**
   * Perataan isi sel kolom: kiri, tengah, atau kanan (default: tengah).
   */
  contentAlign?: 'left' | 'center' | 'right';
  /**
   * Hanya untuk kolom Item/Keterangan (key item_name):
   * - 'name': tampilkan nama equipment seperti biasa
   * - 'auto_plate_or_name': dump truck → plat nomor (license_plate), alat berat → nama
   */
  item_display_mode?: 'name' | 'auto_plate_or_name';
  /**
   * Untuk kolom Angka (no rumus) dan Angka (rumus): tampilkan total (jumlah) di baris bawah tabel.
   */
  show_total_in_footer?: boolean;
  /**
   * Jika true, jumlah nilai kolom ini (per baris) dipakai sebagai total invoice (terbilang, daftar invoice).
   * Hanya satu kolom yang sebaiknya diset true (biasanya kolom Jumlah/rumus).
   */
  use_as_invoice_total?: boolean;
  /**
   * Jika true, kolom formula bisa diedit langsung di tabel (untuk kasus seperti mobilisasi PP).
   * Saat diedit, nilai disimpan di `row.total` dan override hasil rumus.
   */
  editable?: boolean;
}

export interface InvoiceTemplate {
  id: number | string;
  name: string;
  description?: string;
  layout?: string;
  /** Tipe dokumen: invoice, penawaran, pre_order, dll. */
  document_type?: string;
  /** Kalimat default pembuka */
  default_intro?: string;
  /** Jumlah TTD: 1 = kanan saja, 2 = kiri & kanan */
  signature_count?: number;
  /** Konfigurasi tambahan: item_columns, opsi BBM & format */
  options?: {
    item_columns?: TemplateItemColumn[];
    /** Tampilkan kolom tanggal di tabel */
    show_date?: boolean;
    /** Tampilkan kolom No di tabel */
    show_no?: boolean;
    /** Tampilkan kolom Jumlah/Total di tabel */
    show_total?: boolean;
    /** Tampilkan baris/section "Total Keseluruhan" */
    show_grand_total?: boolean;
    /** Tampilkan nomor rekening & bank di dokumen */
    show_bank_account?: boolean;
    /** Jika true, kop surat juga ditampilkan di halaman berikutnya (default false) */
    show_kop_next_page?: boolean;
    /** Tampilkan kolom BBM per baris */
    use_bbm_columns?: boolean;
    /** Catatan "Sudah termasuk BBM" di bawah total */
    include_bbm_note?: boolean;
    /** Satuan quantity default: hari, jam, unit, jerigen, volume */
    quantity_unit?: string;
    /** Label harga: Harga/Hari, Harga/Volume, dll */
    price_unit_label?: string;
    /** Label kolom item: Keterangan, Pekerjaan, dll */
    item_column_label?: string;
    /** Tinggi baris tabel item: very_compact (rapat), compact (normal), normal (tinggi), relaxed */
    item_row_height?: 'very_compact' | 'compact' | 'normal' | 'relaxed';
    [k: string]: unknown;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id?: string | number;
  template_id: number | string;
  customer_id?: number;
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
  /** Nama alat berat / kendaraan (gabungan), e.g. "Grader & Compact", "Dump Truck 6 Roda" */
  equipment_name?: string;
  /** Hanya alat berat dari daftar (bukan dump truck), untuk @alatberat */
  equipment_name_alat_berat?: string;
  /** Hanya dump truck dari daftar, untuk @dumptruck */
  equipment_name_dumptruck?: string;
  /** Nama alat yang ditambah manual (bukan dari daftar), untuk @manual */
  equipment_name_manual?: string;
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
  /** Konfigurasi kolom per group (JSON string: Record<groupKey, TemplateItemColumn[]>) */
  group_column_configs?: string;
  /** Lampiran foto untuk halaman setelah invoice utama */
  attachments?: InvoiceAttachment[];
  /** Judul halaman lampiran (boleh custom) */
  attachment_title?: string;
  /** Jumlah foto lampiran per halaman PDF */
  attachment_photos_per_page?: number;
  created_at?: string;
  updated_at?: string;
}

/** Payload untuk buat invoice baru */
export interface CreateInvoiceRequest {
  template_id: number;
  customer_id?: number;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  items: Array<{
    item_name: string;
    item_display_name?: string;
    description?: string;
    quantity: number;
    price: number;
    total?: number;
    row_date?: string;
    days?: number;
    bbm_quantity?: number;
    bbm_unit_price?: number;
    equipment_group?: string;
    sort_order?: number;
  }>;
  tax_percent?: number;
  notes?: string;
  include_bbm_note?: boolean;
  use_bbm_columns?: boolean;
  location?: string;
  subject?: string;
  equipment_name?: string;
  equipment_name_alat_berat?: string;
  equipment_name_dumptruck?: string;
  equipment_name_manual?: string;
  intro_paragraph?: string;
  bank_account?: string;
  terbilang_custom?: string;
  quantity_unit?: string;
  price_unit_label?: string;
  item_column_label?: string;
  group_column_configs?: string;
  attachments?: InvoiceAttachment[];
  attachment_title?: string;
  attachment_photos_per_page?: number;
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
