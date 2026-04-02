import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetToken('');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email.trim());
      setMessage('Jika email terdaftar, token reset akan dibuat.');
      if (res?.reset_token) setResetToken(res.reset_token);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal memproses permintaan.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lupa Password</h1>
        <p className="text-sm text-gray-600 mb-6">Masukkan email. Sistem akan membuat token reset.</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        {message && <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm mb-4">{message}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Generate Token Reset'}
          </button>
        </form>

        {resetToken && (
          <div className="mt-5 p-3 rounded-lg border border-amber-200 bg-amber-50">
            <div className="text-sm font-semibold text-amber-800 mb-2">Token Reset (demo, tampil di UI):</div>
            <div className="flex gap-2">
              <input className="flex-1 px-3 py-2 border rounded bg-white text-sm" readOnly value={resetToken} />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(resetToken)}
                className="px-3 py-2 bg-amber-600 text-white rounded"
              >
                Copy
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`)}
              className="mt-3 w-full px-3 py-2 rounded bg-green-600 text-white font-semibold"
            >
              Lanjut Reset Password
            </button>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600 text-center">
          <Link to="/login" className="text-orange-600 font-semibold hover:underline">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

