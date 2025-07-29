import React, { useState, useEffect } from 'react';
import { getSmartNotaApiKey, setSmartNotaApiKey, removeSmartNotaApiKey, SMART_NOTA_BASE_URL } from '../utils/apiKey';

interface SettingsProps {
  isCollapsed: boolean;
}

const Settings: React.FC<SettingsProps> = ({ isCollapsed }) => {
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = getSmartNotaApiKey();
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSaveApiKey = async () => {
    setIsLoading(true);
    setMessage('');
    
    if (!apiKey.trim()) {
      setMessage('API Key tidak boleh kosong!');
      setIsLoading(false);
      return;
    }

    try {
      // Temporarily save the API key for validation
      const tempApiKey = apiKey.trim();
      localStorage.setItem('smartNotaApiKey', tempApiKey);
      
      // Test the API key by making a direct request
      const response = await fetch(`${SMART_NOTA_BASE_URL}/api/api-key/invoices?page=1&limit=1`, {
        headers: {
          'X-API-Key': tempApiKey,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // Remove the invalid API key
        localStorage.removeItem('smartNotaApiKey');
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // If successful, API key is already saved
      setMessage('API Key berhasil disimpan dan divalidasi!');
      setIsEditing(false);
    } catch (error) {
      console.error('API Key validation failed:', error);
      // Remove the invalid API key if not already removed
      localStorage.removeItem('smartNotaApiKey');
      setMessage('API Key tidak valid atau terjadi kesalahan koneksi. Silakan cek kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditApiKey = () => {
    setIsEditing(true);
    setMessage('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setMessage('');
    // Restore original value if editing was cancelled
    const savedApiKey = getSmartNotaApiKey();
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  };

  const handleClearApiKey = () => {
    removeSmartNotaApiKey();
    setApiKey('');
    setMessage('API Key berhasil dihapus!');
    setIsEditing(false);
  };

  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-500">Konfigurasi pengaturan aplikasi.</p>
        
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Menyimpan...
                        </>
                      ) : (
                        'Simpan & Validasi'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSmartNotaApiKey(apiKey.trim());
                        setMessage('API Key berhasil disimpan (tanpa validasi)!');
                        setIsEditing(false);
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
                    <button
                      onClick={handleEditApiKey}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {apiKey ? 'Ubah' : 'Atur'}
                    </button>
                    {apiKey && (
                      <button
                        onClick={handleClearApiKey}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('berhasil') 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Informasi API Key</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• API Key digunakan untuk mengakses Smart Nota API</li>
                <li>• Key akan disimpan secara lokal di browser Anda</li>
                <li>• Pastikan key yang dimasukkan valid dan aktif</li>
                <li>• Untuk mendapatkan API Key, hubungi administrator Smart Nota</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Endpoint Smart Nota API</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Base URL:</strong> https://smartnotaapi.indiramaju.com</p>
                <p><strong>Authentication:</strong> X-API-Key header</p>
                <p><strong>Available Endpoints:</strong></p>
                                 <ul className="ml-4 space-y-1">
                   <li>• GET /api/api-key/invoices - Daftar invoice</li>
                   <li>• POST /api/api-key/invoices - Buat invoice baru</li>
                   <li>• GET /api/api-key/invoices/&#123;id&#125; - Detail invoice</li>
                   <li>• PUT /api/api-key/invoices/&#123;id&#125; - Update invoice</li>
                   <li>• DELETE /api/api-key/invoices/&#123;id&#125; - Hapus invoice</li>
                 </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;