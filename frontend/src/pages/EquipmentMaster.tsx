import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { equipmentApi } from '../api/equipment';
import type { Equipment, CreateEquipmentRequest } from '../types/equipment';
import { Modal } from '../component/Modal';

interface EquipmentMasterProps {
  isCollapsed: boolean;
}

const EquipmentMaster: React.FC<EquipmentMasterProps> = ({ isCollapsed }) => {
  const [list, setList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateEquipmentRequest>({ name: '', type: 'alat_berat' });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await equipmentApi.getList(search || undefined, filterType || undefined);
      setList(data);
    } catch (e) {
      console.error(e);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterType]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openModal = (item?: Equipment) => {
    if (item) {
      setEditingId(item.id);
      setForm({ name: item.name, type: item.type });
    } else {
      setEditingId(null);
      setForm({ name: '', type: 'alat_berat' });
    }
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await equipmentApi.update(editingId, form);
      } else {
        await equipmentApi.create(form);
      }
      setShowModal(false);
      fetchList();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus data ini?')) return;
    setDeletingId(id);
    try {
      await equipmentApi.delete(id);
      fetchList();
    } finally {
      setDeletingId(null);
    }
  };

  const marginLeft = isCollapsed ? 'ml-20' : 'ml-64';

  return (
    <div className={`flex-1 transition-all duration-300 ${marginLeft}`}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Alat Berat & Dump Truck</h1>
            <p className="text-gray-500">Daftar alat berat dan dump truck untuk dipilih di invoice</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Cari nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-64 text-sm"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua tipe</option>
            <option value="alat_berat">Alat berat</option>
            <option value="dump_truck">Dump truck</option>
          </select>
          <button type="button" onClick={() => fetchList()} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
            Cari
          </button>
          <button type="button" onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">
            <FiPlus /> Tambah
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {list.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.type === 'dump_truck' ? 'Dump truck' : 'Alat berat'}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => openModal(item)} className="text-blue-600 hover:text-blue-700 text-sm mr-2">
                          <FiEdit2 className="inline" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                        >
                          <FiTrash2 className="inline" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && list.length === 0 && (
                <div className="text-center py-12 text-gray-500">Belum ada data. Klik &quot;Tambah&quot; untuk menambah.</div>
              )}
            </div>
          )}
        </div>

        {showModal && (
          <Modal onClose={() => setShowModal(false)} title={editingId ? 'Edit Alat' : 'Tambah Alat'}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Contoh: Grader & Compact, Excavator SK 067"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'alat_berat' | 'dump_truck' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="alat_berat">Alat berat</option>
                  <option value="dump_truck">Dump truck</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">
                  Batal
                </button>
                <button type="button" onClick={save} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  Simpan
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default EquipmentMaster;
