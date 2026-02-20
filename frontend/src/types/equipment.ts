export interface Equipment {
  id: number;
  name: string;
  type: 'alat_berat' | 'dump_truck';
  created_at?: string;
  updated_at?: string;
}

export interface CreateEquipmentRequest {
  name: string;
  type?: 'alat_berat' | 'dump_truck';
}
