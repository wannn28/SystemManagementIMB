import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { companySettingsApi, CompanySettings } from '../api/companySettings';

const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

interface BrandingContextValue {
  branding: CompanySettings;
  isLoading: boolean;
  refresh: () => Promise<void>;
  updateBranding: (data: Partial<CompanySettings>) => void;
}

const DEFAULT_BRANDING: CompanySettings = {
  company_name: '',
  company_logo: '',
  primary_color: '#f97316',
  name: '',
  email: '',
};

const BrandingContext = createContext<BrandingContextValue>({
  branding: DEFAULT_BRANDING,
  isLoading: false,
  refresh: async () => {},
  updateBranding: () => {},
});

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [branding, setBranding] = useState<CompanySettings>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(false);
  const prevPathRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await companySettingsApi.getSettings();
      setBranding(data);
    } catch {
      // silently ignore if not authenticated yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Jika login lewat navigate (tanpa reload), ambil ulang branding setelah keluar dari halaman auth
  useEffect(() => {
    const cur = location.pathname;
    const prev = prevPathRef.current;
    const token = localStorage.getItem('token');
    if (prev !== null && token && AUTH_PATHS.has(prev) && !AUTH_PATHS.has(cur)) {
      void refresh();
    }
    prevPathRef.current = cur;
  }, [location.pathname, refresh]);

  const updateBranding = useCallback((data: Partial<CompanySettings>) => {
    setBranding(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refresh, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};
