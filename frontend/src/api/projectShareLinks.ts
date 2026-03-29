import axios from 'axios';
import type { Project } from '../types/BasicTypes';

const API_BASE = import.meta.env.VITE_API_URL;

export type ShareProjectSettings = {
  showRevenue: boolean;
  showFinancial: boolean;
  showDaily: boolean;
  showWeekly: boolean;
  showMonthly: boolean;
  showWorkers: boolean;
  showEquipment: boolean;
  showRekapitulasi: boolean;
  allowEdit: boolean;
  // Progress/Volume granular toggles
  showVolumeTarget: boolean;
  showVolumeActual: boolean;
  // Smart Nota reverse-sync: when someone edits via this share link,
  // the changes are also pushed back to Smart Nota automatically.
  // destination_address and baseUrl are read from project.reports._smartNota
  // (saved automatically when admin syncs from Smart Nota).
  syncToSmartNota: boolean;   // default true
  smartNotaApiKey: string;    // Smart Nota integration API key
};

export const projectShareLinksAPI = {
  listByProject: async (projectId: number) => {
    const res: any = await axios.get(`${API_BASE}/projects/${projectId}/share-links`);
    return (res.data?.data ?? []) as Array<{
      id: number;
      project_id: number;
      token: string;
      edit_token: string;
      settings: string | Record<string, unknown>;
      created_at?: string;
      updated_at?: string;
    }>;
  },
  create: async (projectId: number, settings: Partial<ShareProjectSettings>) => {
    const res: any = await axios.post(`${API_BASE}/projects/${projectId}/share-links`, { settings });
    return res.data?.data as {
      id?: number;
      token: string;
      edit_token: string;
      settings: any;
      project_id: number;
      created_at?: string;
      updated_at?: string;
    };
  },
  deleteByProject: async (projectId: number, linkId: number) => {
    const res: any = await axios.delete(`${API_BASE}/projects/${projectId}/share-links/${linkId}`);
    return res.data?.data as { deleted: boolean };
  },
  getSharedProject: async (token: string) => {
    const res: any = await axios.get(`${API_BASE}/public/projects/shared/${token}`);
    return res.data?.data as { project: any; settings: ShareProjectSettings; token: string };
  },
  updateSettings: async (token: string, editToken: string, settings: Partial<ShareProjectSettings>) => {
    const res: any = await axios.put(`${API_BASE}/public/projects/shared/${token}?edit_token=${encodeURIComponent(editToken)}`, { settings });
    return res.data?.data as { settings: ShareProjectSettings };
  },
  /** Simpan laporan (daily/weekly/monthly). editToken opsional jika allowEdit=true di settings link. */
  updateSharedReports: async (token: string, editToken: string | undefined, reports: Project['reports']) => {
    const query = editToken ? `?edit_token=${encodeURIComponent(editToken)}` : '';
    const res: any = await axios.put(
      `${API_BASE}/public/projects/shared/${encodeURIComponent(token)}/reports${query}`,
      { reports }
    );
    return res.data?.data?.project as Project;
  },
};

