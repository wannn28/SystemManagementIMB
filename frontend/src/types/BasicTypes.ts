export interface TableHeader {
    id: string;
    name: string;
    type: 'string' | 'integer' | 'float' | 'image';
    optional: boolean;
}

export interface TableRow {
    id: string;
    [key: string]: any;
}

export interface InventoryItem {
    id: string;
    title: string;
    description: string;
    headers: TableHeader[];
    data: TableRow[];
}
7
// Tambahkan di BasicTypes.ts
export interface SalaryRecord {
  id?: number | string;
  month: string;
  salary: number;
  loan: number;
  net_salary: number;
  gross_salary: number;
  status: string;
  documents: string[];
  details: SalaryDetail[];
  kasbons: Kasbon[];
}

// BasicTypes.ts - Sesuaikan interface dengan response backend
export interface SalaryDetail {
  id: string;
  tanggal: string;
  jam_trip: number;       // 🟢 Dari jamTrip -> jam_trip
  harga_per_jam: number;  // 🟢 Dari hargaPerJam -> harga_per_jam
  keterangan: string;
}

export interface Kasbon {
  id: string;
  tanggal: string;
  jumlah: number;
  keterangan: string;
}
  
  export interface Member {
    id: string;
    fullName: string;
    role: string;
    phoneNumber: string;
    address: string;
    joinDate: string;
    profileImage: string;
    documents: string[];  // Array nama file dokumen
    salaries: SalaryRecord[];
  }

export interface Project {
    id: number;
    name: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    maxDuration: string | number;
    totalRevenue: number;
    amountPaid: number;
    unitPrice: number;
    totalVolume: number;
    unit: string;
    reports: {
      daily: { date: string; revenue: number; paid: number; volume: number; targetVolume: number; plan: number; aktual: number}[];
      weekly: { targetPlan: number;targetAktual: number; week: string; volume: number; targetVolume: number; }[];
      monthly: { targetPlan: number;targetAktual: number;month: string;  volume: number; targetVolume: number }[];
    };
  }
