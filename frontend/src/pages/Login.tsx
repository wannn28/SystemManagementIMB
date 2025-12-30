// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, BuildingOfficeIcon, TruckIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login(email, password);
      console.log(response);
      localStorage.setItem('token', response.token);
      // set time out 3 detik
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.log(err);
      setError('Login gagal. Silakan periksa email dan password Anda.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <BuildingOfficeIcon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">System Management</h1>
                <p className="text-orange-100 text-sm">Office Management System</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              Selamat Datang di<br />
              Sistem Manajemen Perusahaan
            </h2>
            <p className="text-lg text-orange-100 leading-relaxed">
              Platform terintegrasi untuk mengelola operasional perusahaan kontraktor, 
              sewa alat berat, dan dumptruck Anda dengan lebih efisien.
            </p>
            
            <div className="grid grid-cols-1 gap-4 mt-8">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div className="bg-white/20 p-2 rounded-lg">
                  <TruckIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Manajemen Dumptruck</p>
                  <p className="text-sm text-orange-100">Kelola armada dan operasional</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div className="bg-white/20 p-2 rounded-lg">
                  <WrenchScrewdriverIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Sewa Alat Berat</p>
                  <p className="text-sm text-orange-100">Tracking dan monitoring alat</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div className="bg-white/20 p-2 rounded-lg">
                  <BuildingOfficeIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Kontraktor Tanah</p>
                  <p className="text-sm text-orange-100">Manajemen proyek terpadu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-3 rounded-xl">
                <BuildingOfficeIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Management</h1>
                <p className="text-sm text-gray-500">Office Management System</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Masuk ke Akun Anda
              </h2>
              <p className="text-gray-600">
                Silakan masukkan kredensial Anda untuk mengakses sistem
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-gray-900 placeholder-gray-400"
                      placeholder="nama@perusahaan.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-gray-900 placeholder-gray-400"
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} System Management. Hak cipta dilindungi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;