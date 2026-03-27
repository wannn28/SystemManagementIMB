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
  syncToSmartNota: boolean;          // default true
  smartNotaApiKey: string;           // Smart Nota integration API key
  smartNotaBaseUrl: string;          // Smart Nota server base URL
  smartNotaDestination: string;      // destination_address in Smart Nota (identifies the project)
};

export const projectShareLinksAPI = {
  create: async (projectId: number, settings: Partial<ShareProjectSettings>) => {
    const res: any = await axios.post(`${API_BASE}/projects/${projectId}/share-links`, { settings });
    return res.data?.data as { token: string; edit_token: string; settings: any; project_id: number };
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

