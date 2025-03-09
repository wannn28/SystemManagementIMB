import React, { useState } from 'react';
import { SalaryDetail, Kasbon } from '../types/BasicTypes';

interface SalaryDetailsTableProps {
  type: 'salary' | 'kasbon';
  data: Array<SalaryDetail | Kasbon>;
  onAdd: (newData: any) => void;
  onEdit: (id: string, updatedData: any) => void;
  onDelete: (id: string) => void;

}

export const SalaryDetailsTable: React.FC<SalaryDetailsTableProps> = ({
  type,
  data,
  onAdd,
  onEdit,
  onDelete
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEdit(editingId, formData);
    } else {
      onAdd(formData);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({});
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {type === 'salary' ? 'Rincian Gaji Harian' : 'Kasbon'}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-blue-600 hover:text-blue-800"
        >
          {showForm ? 'Sembunyikan' : 'Tampilkan'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 bg-gray-50 p-4 rounded-lg">
          {type === 'salary' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  required
                  placeholder="Tanggal"
                  value={formData.tanggal ? formData.tanggal.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  required
                  placeholder="Jam/Trip"
                  value={formData.jam_trip || ''}
                  onChange={(e) => setFormData({ ...formData, jam_trip: Number(e.target.value) })}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  required
                  placeholder="Harga per Jam/Trip"
                  value={formData.harga_per_jam || ''}
                  onChange={(e) => setFormData({ ...formData, harga_per_jam: Number(e.target.value) })}
                  className="p-2 border rounded"
                />
                <input
                  placeholder="Keterangan"
                  value={formData.keterangan || ''}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="p-2 border rounded"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  required
                  placeholder="Tanggal"
                  value={formData.tanggal ? formData.tanggal.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  required
                  placeholder="Jumlah"
                  value={formData.jumlah || ''}
                  onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                  className="p-2 border rounded"
                />
                <input
                  placeholder="Keterangan"
                  value={formData.keterangan || ''}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="p-2 border rounded"
                />
              </div>
            </>
          )}
          <div className="mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            >
              {editingId ? 'Simpan Perubahan' : 'Tambah Data'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {showForm && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">No</th>
                {type === 'salary' ? (
                  <>
                    <th className="py-2 px-4 border-b">Tanggal</th>
                    <th className="py-2 px-4 border-b">Jam/Trip</th>
                    <th className="py-2 px-4 border-b">Harga</th>
                    <th className="py-2 px-4 border-b">Jumlah</th>
                    <th className="py-2 px-4 border-b">Keterangan</th>
                  </>
                ) : (
                  <>
                    <th className="py-2 px-4 border-b">Tanggal</th>
                    <th className="py-2 px-4 border-b">Jumlah</th>
                    <th className="py-2 px-4 border-b">Keterangan</th>
                  </>
                )}
                <th className="py-2 px-4 border-b">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.id}>
                  <td className="py-2 px-4 border-b text-center">{index + 1}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(item.tanggal).toLocaleDateString()}
                  </td>
                  {type === 'salary' && (
                    <>
                      <td className="py-2 px-4 border-b text-center">
                        {(item as SalaryDetail).jam_trip}
                      </td>
                      <td className="py-2 px-4 border-b">
                        Rp{(item as SalaryDetail).harga_per_jam.toLocaleString()}
                      </td>
                      <td className="py-2 px-4 border-b">
                        Rp{((item as SalaryDetail).jam_trip *
                          (item as SalaryDetail).harga_per_jam).toLocaleString()}
                      </td>
                    </>
                  )}
                  {type === 'kasbon' && (
                    <td className="py-2 px-4 border-b">
                      Rp{(item as Kasbon).jumlah.toLocaleString()}
                    </td>
                  )}
                  <td className="py-2 px-4 border-b">{item.keterangan}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setFormData(item);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};