import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { companySettingsApi, CompanySettings } from '../api/companySettings';

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
  const [branding, setBranding] = useState<CompanySettings>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(false);

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
    refresh();
  }, [refresh]);

  const updateBranding = useCallback((data: Partial<CompanySettings>) => {
    setBranding(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refresh, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};
