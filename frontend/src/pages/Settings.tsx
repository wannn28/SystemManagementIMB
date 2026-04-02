import React, { useState, useEffect, useRef } from 'react';
import { apiKeyApi } from '../api/apiKey';
import { SMART_NOTA_BASE_URL } from '../utils/apiKey';
import IntegrationTokenSettings from '../component/IntegrationTokenSettings';
import { companySettingsApi, resolveLogoUrl } from '../api/companySettings';
import { useBranding } from '../context/BrandingContext';

interface SettingsProps {
  isCollapsed: boolean;
}

const Settings: React.FC<SettingsProps> = ({ isCollapsed }) => {
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Company branding state
  const { branding, refresh: refreshBranding, updateBranding } = useBranding();
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#f97316');
  const [brandingMsg, setBrandingMsg] = useState('');
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const response = await apiKeyApi.getApiKey();
        setApiKey(response.api_key);
      } catch (error: any) {
        const localApiKey = localStorage.getItem('smartNotaApiKey');
        if (localApiKey) setApiKey(localApiKey);
      }
    };
    loadApiKey();
  }, []);

  useEffect(() => {
    setCompanyName(branding.company_name || '');
    setPrimaryColor(branding.primary_color || '#f97316');
    setLogoPreview(resolveLogoUrl(branding.company_logo));
  }, [branding]);

  const handleSaveApiKey = async () => {
    setIsLoading(true);
    setMessage('');
    if (!apiKey.trim()) {
      setMessage('API Key tidak boleh kosong!');
      setIsLoading(false);
      return;
    }
    try {
      const tempApiKey = apiKey.trim();
      const response = await fetch(`${SMART_NOTA_BASE_URL}/api/api-key/invoices?page=1&limit=1`, {
        headers: { 'X-API-Key': tempApiKey, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await apiKeyApi.saveApiKey(tempApiKey);
      setMessage('API Key berhasil disimpan dan divalidasi!');
      setIsEditing(false);
    } catch (error) {
      setMessage('API Key tidak valid atau terjadi kesalahan koneksi. Silakan cek kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = async () => {
    setIsEditing(false);
    setMessage('');
    try {
      const response = await apiKeyApi.getApiKey();
      setApiKey(response.api_key);
    } catch {
      const localApiKey = localStorage.getItem('smartNotaApiKey');
      setApiKey(localApiKey || '');
    }
  };

  const handleClearApiKey = async () => {
    try {
      await apiKeyApi.deleteApiKey();
      setApiKey('');
      setMessage('API Key berhasil dihapus!');
      setIsEditing(false);
    } catch {
      setMessage('Gagal menghapus API Key!');
    }
  };

  const handleSaveBranding = async () => {
    setBrandingLoading(true);
    setBrandingMsg('');
    try {
      const updated = await companySettingsApi.updateSettings({
        company_name: companyName,
        primary_color: primaryColor,
      });
      updateBranding(updated);
      setBrandingMsg('Pengaturan perusahaan berhasil disimpan!');
    } catch {
      setBrandingMsg('Gagal menyimpan pengaturan perusahaan.');
    } finally {
      setBrandingLoading(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setLogoUploading(true);
    setBrandingMsg('');
    try {
      const result = await companySettingsApi.uploadLogo(file);
      updateBranding({ company_logo: result.company_logo });
      setLogoPreview(resolveLogoUrl(result.company_logo));
      setBrandingMsg('Logo berhasil diupload!');
    } catch {
      setBrandingMsg('Gagal mengupload logo.');
      setLogoPreview(resolveLogoUrl(branding.company_logo));
    } finally {
      setLogoUploading(false);
      await refreshBranding();
    }
  };

  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-500">Konfigurasi pengaturan aplikasi.</p>

        {/* Company Branding Section */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Branding Perusahaan</h2>
              <p className="text-gray-500">Logo, nama perusahaan, dan warna utama aplikasi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo Perusahaan</label>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={logoUploading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                  >
                    {logoUploading ? 'Mengupload...' : 'Upload Logo'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG, WebP (maks. 5MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Perusahaan</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Masukkan nama perusahaan"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Warna Utama</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer p-1"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#f97316"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <div
                  className="w-12 h-12 rounded-lg border border-gray-200 shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {['#f97316','#3b82f6','#10b981','#8b5cf6','#ef4444','#f59e0b','#06b6d4','#ec4899'].map(c => (
                  <button
                    key={c}
                    onClick={() => setPrimaryColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${primaryColor === c ? 'border-gray-800 scale-110' : 'border-gray-200'}`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview Sidebar</label>
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-900 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ boxShadow: `0 0 8px ${primaryColor}80` }}>
                  {logoPreview
                    ? <img src={logoPreview} alt="preview" className="w-full h-full object-cover" />
                    : <div className="w-full h-full rounded-lg" style={{ backgroundColor: primaryColor }} />
                  }
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{companyName || 'Nama Perusahaan'}</p>
                  <p className="text-xs font-medium" style={{ color: primaryColor }}>Management System</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSaveBranding}
              disabled={brandingLoading}
              className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              {brandingLoading ? 'Menyimpan...' : 'Simpan Branding'}
            </button>
            {brandingMsg && (
              <span className={`text-sm ${brandingMsg.includes('berhasil') ? 'text-green-600' : 'text-red-600'}`}>
                {brandingMsg}
              </span>
            )}
          </div>
        </div>

        {/* Smart Nota API Key Section */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Smart Nota API Key</h2>
              <p className="text-gray-500">Konfigurasi API Key untuk mengakses Smart Nota API</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Masukkan API Key Smart Nota"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveApiKey}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Menyimpan...
                        </>
                      ) : 'Simpan & Validasi'}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await apiKeyApi.saveApiKey(apiKey.trim());
                          setMessage('API Key berhasil disimpan (tanpa validasi)!');
                          setIsEditing(false);
                        } catch {
                          setMessage('Gagal menyimpan API Key!');
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Simpan Tanpa Validasi
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="password"
                      value={apiKey ? '••••••••••••••••••••••••••••••••' : ''}
                      disabled
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      placeholder="API Key belum diatur"
                    />
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      {apiKey ? 'Ubah' : 'Atur'}
                    </button>
                    {apiKey && (
                      <button onClick={handleClearApiKey} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${message.includes('berhasil') ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                {message}
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Informasi API Key</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• API Key digunakan untuk mengakses Smart Nota API</li>
                <li>• Key akan disimpan di database dan browser Anda</li>
                <li>• Pastikan key yang dimasukkan valid dan aktif</li>
              </ul>
            </div>
          </div>
        </div>

        <IntegrationTokenSettings />
      </div>
    </div>
  );
};

export default Settings;
