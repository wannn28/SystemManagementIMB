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
}

export interface CreateEquipmentRequest {
  name: string;
  type?: 'alat_berat' | 'dump_truck';
  license_plate?: string;
  price_per_day?: number;
  price_per_hour?: number;
}
