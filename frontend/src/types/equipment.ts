export interface Equipment {
  id: number;
  name: string;
  type: 'alat_berat' | 'dump_truck';
  /** Plat nomor (untuk dump_truck); dipakai di kolom Keterangan saat tampilan otomatis plat/nama */
  license_plate?: string;
  price_per_day?: number;
  price_per_hour?: number;
  created_at?: string;
  updated_at?: string;
  /** Total pemasukan (Finance) yang ditautkan ke alat ini, seumur hidup data */
  total_income?: number;
  /** Total pengeluaran (Finance) yang ditautkan ke alat ini, seumur hidup data */
  total_expense?: number;
}

export interface CreateEquipmentRequest {
  name: string;
  type?: 'alat_berat' | 'dump_truck';
  license_plate?: string;
  price_per_day?: number;
  price_per_hour?: number;
}
