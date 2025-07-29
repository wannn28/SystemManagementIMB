import React, { useState } from 'react';
import { SalaryDetail, Kasbon } from '../types/BasicTypes';
import { smartNotaApi } from '../api/smartNota';
import { hasSmartNotaApiKey } from '../utils/apiKey';

interface SalaryDetailsTableProps {
  type: 'salary' | 'kasbon';
  data: Array<SalaryDetail | Kasbon>;
  onAdd: (newData: any) => void;
  onEdit: (id: string, updatedData: any) => void;
  onDelete: (id: string) => void;

}

export const SalaryDetailsTable: React.FC<SalaryDetailsTableProps> = ({
  type,
  data = [],
  onAdd,
  onEdit,
  onDelete
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  
  // Smart Nota Import states
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFormData, setImportFormData] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    hargaPerTrip: '',
    keterangan: ''
  });
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);

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

  // Smart Nota Import functions
  const handleImportFromSmartNota = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasSmartNotaApiKey()) {
      setImportError('API Key Smart Nota belum diatur. Silakan atur di Settings.');
      return;
    }

    if (!importFormData.dateFrom || !importFormData.dateTo || !importFormData.hargaPerTrip) {
      setImportError('Mohon isi tanggal dari, tanggal sampai, dan harga per trip.');
      return;
    }

    setImportLoading(true);
    setImportError(null);

    try {
      // Fetch invoices from Smart Nota with search and date filters
      const response = await smartNotaApi.getInvoices({
        page: 1,
        per_page: 1000, // Get all invoices
        sort: 'created_at',
        order: 'asc',
        search: importFormData.search || undefined,
        date_from: importFormData.dateFrom,
        date_to: importFormData.dateTo
      });

      // Use the filtered data directly from API
      let filteredInvoices = response.data || [];
      
      // Handle case where response.data might be wrapped differently
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        console.log('Response.data is object, checking for data property');
        const responseData = response.data as any;
        if (responseData.data && Array.isArray(responseData.data)) {
          filteredInvoices = responseData.data;
          console.log('Found data.data array:', filteredInvoices);
        }
      }
      
      console.log('Import form data:', importFormData);
      console.log('API Response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Response data is array:', Array.isArray(response.data));
      console.log('Filtered invoices:', filteredInvoices);
      console.log('Filtered invoices length:', filteredInvoices.length);
      console.log('First invoice structure:', filteredInvoices[0]);
      console.log('First invoice created_at:', filteredInvoices[0]?.created_at);
      console.log('First invoice data property:', filteredInvoices[0]?.data);
      
      if (!Array.isArray(filteredInvoices)) {
        setImportError('Format data dari API tidak valid. Silakan coba lagi.');
        return;
      }
      
      if (filteredInvoices.length === 0) {
        setImportError('Tidak ada data invoice yang ditemukan untuk parameter pencarian yang diberikan.');
        return;
      }

      // Group invoices by date and count trips
      const tripsByDate: { [key: string]: number } = {};
      
      filteredInvoices.forEach((invoice: any) => {
        try {
          // Use the invoice object directly, not invoice.data
          const invoiceData = invoice;
          console.log('Processing invoice:', invoiceData);
          console.log('Invoice keys:', Object.keys(invoiceData));
          console.log('Invoice created_at:', invoiceData.created_at);
          console.log('Invoice id:', invoiceData.id);
          
          // Get created_at directly from invoice
          const createdDate = invoiceData.created_at;
          
          // Validate and parse date safely
          if (!createdDate) {
            console.warn('Invoice missing created_at:', invoiceData);
            console.log('Available keys:', Object.keys(invoiceData));
            console.log('This might be invoice.data instead of invoice object');
            return;
          }
          
          console.log('Date string:', createdDate);
          console.log('Date type:', typeof createdDate);
          console.log('Date includes +:', createdDate.includes('+'));
          console.log('Date ends with Z:', createdDate.endsWith('Z'));
          
          // Handle timezone offset properly
          let dateObj;
          if (createdDate.includes('+')) {
            // Date with timezone offset like "2025-07-28T11:53:11.956+07:00"
            dateObj = new Date(createdDate);
            console.log('Using timezone offset parsing');
          } else if (createdDate.endsWith('Z')) {
            // Date already in UTC format like "2025-07-28T11:53:11.956Z"
            dateObj = new Date(createdDate);
            console.log('Using UTC format parsing');
          } else {
            // Date without timezone, assume local timezone
            dateObj = new Date(createdDate + 'Z');
            console.log('Using Z suffix parsing');
          }
          
          console.log('Date object:', dateObj);
          console.log('Date object getTime():', dateObj.getTime());
          
          // Check if date is valid
          if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date format:', createdDate, 'for invoice:', invoiceData);
            return;
          }
          
          const date = dateObj.toISOString().split('T')[0];
          console.log('Parsed date:', date);
          
          // Check if date is within the selected range
          const fromDate = new Date(importFormData.dateFrom);
          const toDate = new Date(importFormData.dateTo);
          const invoiceDate = new Date(date);
          
          console.log('Date range check:', {
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0],
            invoiceDate: invoiceDate.toISOString().split('T')[0],
            isInRange: invoiceDate >= fromDate && invoiceDate <= toDate
          });
          
          if (invoiceDate >= fromDate && invoiceDate <= toDate) {
            tripsByDate[date] = (tripsByDate[date] || 0) + 1;
          } else {
            console.log('Invoice date outside selected range:', date);
          }
        } catch (error) {
          console.warn('Error processing invoice date:', error, 'Invoice:', invoice);
        }
      });

      // Convert to salary details format
      const salaryDetails = Object.entries(tripsByDate).map(([date, tripCount]) => ({
        tanggal: date,
        jam_trip: tripCount,
        harga_per_jam: Number(importFormData.hargaPerTrip),
        keterangan: importFormData.keterangan || `Import dari Smart Nota - ${tripCount} trip`
      }));

      console.log('Trips by date:', tripsByDate);
      console.log('Salary details:', salaryDetails);

      setImportPreview(salaryDetails);
      
      if (salaryDetails.length === 0) {
        setImportError('Tidak ada data invoice yang ditemukan untuk rentang tanggal yang dipilih.');
      }
    } catch (error) {
      console.error('Error importing from Smart Nota:', error);
      setImportError('Gagal mengambil data dari Smart Nota. Silakan cek API Key Anda.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = () => {
    importPreview.forEach((salaryDetail) => {
      onAdd(salaryDetail);
    });
    setShowImportForm(false);
    setImportPreview([]);
    setImportFormData({
      search: '',
      dateFrom: '',
      dateTo: '',
      hargaPerTrip: '',
      keterangan: ''
    });
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {type === 'salary' ? 'Rincian Gaji Harian' : 'Kasbon'}
        </h3>
        <div className="flex gap-2">
          {type === 'salary' && (
            <button
              onClick={() => setShowImportForm(!showImportForm)}
              className="text-green-600 hover:text-green-800"
            >
              {showImportForm ? 'Sembunyikan Import' : 'Import dari Smart Nota'}
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-blue-600 hover:text-blue-800"
          >
            {showForm ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </div>
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

      {/* Smart Nota Import Form */}
      {showImportForm && type === 'salary' && (
        <div className="mb-4 bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="text-lg font-semibold text-green-800 mb-4">Import dari Smart Nota Digital</h4>
          
          {!hasSmartNotaApiKey() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-700 text-sm">
                ⚠️ API Key Smart Nota belum diatur. Silakan atur di Settings terlebih dahulu.
              </p>
            </div>
          )}

          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{importError}</p>
            </div>
          )}

          <form onSubmit={handleImportFromSmartNota} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Cari (opsional) - nama customer, template, atau ID invoice"
                value={importFormData.search}
                onChange={(e) => setImportFormData({ ...importFormData, search: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="date"
                required
                placeholder="Tanggal Dari"
                value={importFormData.dateFrom}
                onChange={(e) => setImportFormData({ ...importFormData, dateFrom: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="date"
                required
                placeholder="Tanggal Sampai"
                value={importFormData.dateTo}
                onChange={(e) => setImportFormData({ ...importFormData, dateTo: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="number"
                required
                placeholder="Harga per Trip"
                value={importFormData.hargaPerTrip}
                onChange={(e) => setImportFormData({ ...importFormData, hargaPerTrip: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Keterangan (opsional)"
                value={importFormData.keterangan}
                onChange={(e) => setImportFormData({ ...importFormData, keterangan: e.target.value })}
                className="p-2 border rounded md:col-span-2"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={importLoading || !hasSmartNotaApiKey()}
                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importLoading ? 'Mengambil Data...' : 'Cari Data Smart Nota'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowImportForm(false);
                  setImportPreview([]);
                  setImportError(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Batal
              </button>
            </div>
          </form>

          {/* Preview Import Data */}
          {importPreview.length > 0 && (
            <div className="mt-6">
              <h5 className="font-semibold text-green-800 mb-3">Preview Data yang Akan Diimport:</h5>
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="py-2 px-4 border-b text-left">Tanggal</th>
                      <th className="py-2 px-4 border-b text-center">Jumlah Trip</th>
                      <th className="py-2 px-4 border-b text-center">Harga per Trip</th>
                      <th className="py-2 px-4 border-b text-center">Total</th>
                      <th className="py-2 px-4 border-b text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">
                          {new Date(item.tanggal).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          {item.jam_trip}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          Rp{item.harga_per_jam.toLocaleString()}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          Rp{(item.jam_trip * item.harga_per_jam).toLocaleString()}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {item.keterangan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleConfirmImport}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Konfirmasi Import ({importPreview.length} data)
                </button>
                <button
                  onClick={() => setImportPreview([])}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Batal Import
                </button>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-700 text-sm">
                  💡 <strong>Info:</strong> Data akan diimport berdasarkan jumlah trip per tanggal. 
                  Jika ada multiple invoice di tanggal yang sama, akan dihitung sebagai 1 entry dengan total trip.
                </p>
              </div>
            </div>
          )}
        </div>
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
                 <tr key={item.id || `temp-${index}`}>
                  <td className="py-2 px-4 border-b text-center">{index + 1}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(item.tanggal).toLocaleDateString()}
                  </td>
                  {type === 'salary' && (
                    <>
                      <td className="py-2 px-4 border-b text-center">
                        {(item as SalaryDetail).jam_trip}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        Rp{(item as SalaryDetail).harga_per_jam.toLocaleString()}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        Rp{((item as SalaryDetail).jam_trip *
                          (item as SalaryDetail).harga_per_jam).toLocaleString()}
                      </td>
                    </>
                  )}
                  {type === 'kasbon' && (
                    <td className="py-2 px-4 border-b text-center">
                      Rp{(item as Kasbon).jumlah.toLocaleString()}
                    </td>
                  )}
                  <td className="py-2 px-4 border-b text-center">{item.keterangan}</td>
                  <td className="py-2 px-4 border-b text-center">
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