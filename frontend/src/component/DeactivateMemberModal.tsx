import React, { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { Member } from '../types/BasicTypes';

interface DeactivateMemberModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const DeactivateMemberModal: React.FC<DeactivateMemberModalProps> = ({
  isOpen,
  member,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Alasan harus diisi');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (err) {
      setError('Gagal menonaktifkan member. Silakan coba lagi.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason('');
      setError('');
      onClose();
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Nonaktifkan Member</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {member.fullName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Perhatian:</span> Member yang dinonaktifkan tidak akan muncul dalam daftar aktif. 
              Anda dapat mengaktifkan kembali kapan saja.
            </p>
          </div>

          {/* Reason Input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
              Alasan Penonaktifan <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Contoh: Mengundurkan diri, PHK, Pindah divisi, dll..."
              rows={4}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isLoading}
              required
            />
            {error && (
              <p className="text-sm text-red-600 mt-2 flex items-center">
                <FiAlertTriangle className="w-4 h-4 mr-1" />
                {error}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Alasan ini akan tersimpan untuk catatan dan dapat dilihat di history member.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                'Nonaktifkan Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeactivateMemberModal;

