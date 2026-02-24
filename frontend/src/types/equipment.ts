export interface Equipment {
  id: number;
  name: string;
  type: 'alat_berat' | 'dump_truck';
  price_per_day?: number;
  price_per_hour?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEquipmentRequest {
  name: string;
  type?: 'alat_berat' | 'dump_truck';
  price_per_day?: number;
  price_per_hour?: number;
}
