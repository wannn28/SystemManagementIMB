import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Jangan bawa sesi lama ke akun baru
    localStorage.removeItem('token');

    if (!name.trim() || !email.trim() || !password) {
      setError('Nama, email, dan password wajib diisi.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authAPI.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setSuccess(`Berhasil daftar. Status akun: ${res.status}. Silakan tunggu admin aktifkan akun Anda.`);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal daftar.';
      setError(String(msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Buat Akun</h1>
        <p className="text-sm text-gray-600 mb-6">
          Akun baru akan berstatus <span className="font-semibold">pending</span> sampai diaktifkan oleh admin.
        </p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama</label>
            <input className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" required className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input type="password" required className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Konfirmasi Password</label>
            <input type="password" required className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50"
          >
            {isLoading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-600 text-center">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-orange-600 font-semibold hover:underline">
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

