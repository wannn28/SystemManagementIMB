import axios from 'axios';
import { API_BASE_URL } from './config';

const API_BASE = API_BASE_URL || '';

export const uploadsAPI = {
  /**
   * Upload a file for finance attachments.
   * Returns the public URL of the uploaded file.
   */
  uploadFile: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res: any = await axios.post(`${API_BASE}/api/uploads/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data as { url: string; filename: string };
  },
};
