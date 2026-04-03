import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FinanceEntry } from '../types/BasicTypes';
import { uploadsAPI } from '../api/uploads';
import { equipmentApi } from '../api/equipment';
import type { Equipment } from '../types/equipment';
import { FinanceCategoryCombobox } from './FinanceCategoryCombobox';

export type FinanceFormData = Omit<Partial<FinanceEntry>, 'equipmentId'> & {
  tanggal: string;
  unit: number;
  hargaPerUnit: number;
  keterangan: string;
  category: string;
  status: 'Paid' | 'Partial' | 'Unpaid';
  /** Kosong = tidak ditautkan ke alat berat */
  equipmentId: number | '';
};

interface Props {
  entry: Partial<FinanceEntry> | null;
  type: 'income' | 'expense';
  categories: Array<{ id: number; name: string }>;
  onSave: (data: FinanceFormData) => Promise<void>;
  onClose: () => void;
  saving?: boolean;
}

const TABS = ['Dasar', 'Vendor & Bayar', 'Pajak', 'Lainnya'];

const PAYMENT_METHODS = ['Tunai', 'Transfer Bank', 'QRIS', 'Debit', 'Cek', 'Giro'];

const TAX_TYPES = [
  { value: '', label: 'Tidak Ada Pajak' },
  { value: 'PPN', label: 'PPN' },
  { value: 'PPh 21', label: 'PPh 21' },
  { value: 'PPh 23', label: 'PPh 23' },
  { value: 'PPh Final', label: 'PPh Final' },
];

const MAIN_CATEGORIES = ['Operasional', 'Pembelian', 'Aset', 'Pajak', 'Owner/Pribadi'];

/** Pilihan umum di dropdown; pengguna tetap bisa mengetik kategori lain. */
const STATIC_CATEGORY_PRESETS_EXPENSE = [
  'Operasional',
  'Pembelian',
  'Sparepart',
  'Solar / BBM',
  'Gaji & upah',
  'Sewa alat / kendaraan',
  'Material / bahan',
  'Perbaikan & servis',
  'Transport & logistik',
  'Pajak & iuran',
  'Marketing / admin',
  'Lainnya',
];

const STATIC_CATEGORY_PRESETS_INCOME = [
  'Termin proyek',
  'Progress pembayaran',
  'Sewa alat berat',
  'Jasa / konsultasi',
  'Penjualan material',
  'Operasional (refund)',
  'Lainnya',
];

const today = () => new Date().toISOString().split('T')[0];

const buildInitial = (entry: Partial<FinanceEntry> | null): FinanceFormData => ({
  tanggal: today(),
  unit: 1,
  hargaPerUnit: 0,
  keterangan: '',
  category: '',
  status: 'Unpaid',
  taxPaid: false,
  isDeductible: false,
  noBukti: '',
  vendorName: '',
  paymentMethod: '',
  kategoriUtama: '',
  jenisPajak: '',
  dpp: 0,
  ppn: 0,
  pph: 0,
  npwp: '',
  divisi: 'Batam',
  penanggungJawab: '',
  tanggalBayar: '',
  jatuhTempo: '',
  catatan: '',
  lampiranUrls: '',
  ...entry,
  equipmentId: entry?.equipmentId != null ? Number(entry.equipmentId) : '',
});

const Label: React.FC<{ text: string }> = ({ text }) => (
  <label className="text-xs font-semibold text-gray-600 block mb-1">{text}</label>
);

const inputCls = 'border border-gray-300 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

const FinanceEntryModal: React.FC<Props> = ({ entry, type, categories, onSave, onClose, saving }) => {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<FinanceFormData>(() => buildInitial(entry));
  const [equipmentOptions, setEquipmentOptions] = useState<Equipment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(buildInitial(entry));
    setTab(0);
  }, [entry?.id, type]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await equipmentApi.getList();
        if (!cancelled) setEquipmentOptions(list);
      } catch {
        if (!cancelled) setEquipmentOptions([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Parse stored URL list (comma-separated)
  const attachmentUrls = (form.lampiranUrls || '').split(',').map(u => u.trim()).filter(Boolean);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setUploadError('');
    try {
      const result = await uploadsAPI.uploadFile(file);
      const existing = (form.lampiranUrls || '').split(',').map(u => u.trim()).filter(Boolean);
      set({ lampiranUrls: [...existing, result.url].join(',') });
    } catch {
      setUploadError('Gagal mengupload file. Coba lagi.');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (url: string) => {
    const updated = attachmentUrls.filter(u => u !== url);
    set({ lampiranUrls: updated.join(',') });
  };

  const set = (patch: Partial<FinanceFormData>) => setForm(f => ({ ...f, ...patch }));
  const total = Number(form.unit ?? 0) * Number(form.hargaPerUnit ?? 0);

  const categoryDatalistOptions = useMemo(() => {
    const presets = type === 'income' ? STATIC_CATEGORY_PRESETS_INCOME : STATIC_CATEGORY_PRESETS_EXPENSE;
    const seen = new Set(presets.map(s => s.toLowerCase()));
    const fromDb: string[] = [];
    for (const c of categories) {
      const n = (c.name || '').trim();
      if (!n) continue;
      const k = n.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      fromDb.push(n);
    }
    return [...presets, ...fromDb];
  }, [type, categories]);

  const handleSave = async () => {
    await onSave({ ...form, unit: Number(form.unit), hargaPerUnit: Number(form.hargaPerUnit) });
  };

  const accentBg = type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-base font-bold text-gray-800">
            {entry?.id ? 'Edit' : 'Tambah'} {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none font-bold">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50 shrink-0">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === i
                ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">

          {/* Tab 0: Dasar */}
          {tab === 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label text="Tanggal *" />
                  <input type="date" value={form.tanggal} onChange={e => set({ tanggal: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <Label text="No. Bukti Transaksi" />
                  <input type="text" value={form.noBukti || ''} onChange={e => set({ noBukti: e.target.value })} placeholder="INV/2025/001" className={inputCls} />
                </div>
              </div>
              <div>
                <Label text="Keterangan" />
                <input type="text" value={form.keterangan} onChange={e => set({ keterangan: e.target.value })} placeholder="Deskripsi transaksi" className={inputCls} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label text="Unit" />
                  <input type="number" value={form.unit} onChange={e => set({ unit: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <Label text="Harga / Unit" />
                  <input type="number" value={form.hargaPerUnit} onChange={e => set({ hargaPerUnit: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <Label text="Total" />
                  <div className="border border-gray-200 p-2 rounded-lg bg-gray-50 text-sm font-bold text-gray-800">
                    Rp {total.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label text="Kategori" />
                  <FinanceCategoryCombobox
                    value={form.category}
                    onChange={v => set({ category: v })}
                    options={categoryDatalistOptions}
                    placeholder="Ketik atau pilih dari daftar"
                    inputClassName={inputCls}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Daftar putih di bawah field; Anda tetap bisa mengetik kategori apa pun.</p>
                </div>
                <div>
                  <Label text="Status Pembayaran" />
                  <select value={form.status} onChange={e => set({ status: e.target.value as FinanceFormData['status'] })} className={inputCls}>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>
              <div>
                <Label text="Alat berat (opsional)" />
                <select
                  value={form.equipmentId === '' ? '' : String(form.equipmentId)}
                  onChange={e =>
                    set({ equipmentId: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  className={inputCls}
                >
                  <option value="">— Tidak ditautkan —</option>
                  {equipmentOptions.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                      {eq.type === 'dump_truck' ? ' (Dump truck)' : ' (Alat berat)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Pilih alat jika transaksi ini khusus unit tersebut (sparepart, solar, pendapatan sewa, dll.).
                </p>
              </div>
            </div>
          )}

          {/* Tab 1: Vendor & Bayar */}
          {tab === 1 && (
            <div className="space-y-3">
              <div>
                <Label text="Nama Vendor / Penerima" />
                <input type="text" value={form.vendorName || ''} onChange={e => set({ vendorName: e.target.value })} placeholder="Nama toko, supplier, atau karyawan" className={inputCls} />
              </div>
              <div>
                <Label text="NPWP Vendor" />
                <input type="text" value={form.npwp || ''} onChange={e => set({ npwp: e.target.value })} placeholder="Nomor NPWP vendor (opsional)" className={inputCls} />
              </div>
              <div>
                <Label text="Metode Pembayaran" />
                <select value={form.paymentMethod || ''} onChange={e => set({ paymentMethod: e.target.value })} className={inputCls}>
                  <option value="">-- Pilih Metode --</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label text="Tanggal Bayar" />
                  <input type="date" value={form.tanggalBayar || ''} onChange={e => set({ tanggalBayar: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <Label text="Jatuh Tempo" />
                  <input type="date" value={form.jatuhTempo || ''} onChange={e => set({ jatuhTempo: e.target.value })} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Pajak */}
          {tab === 2 && (
            <div className="space-y-3">
              <div>
                <Label text="Jenis Pajak" />
                <select value={form.jenisPajak || ''} onChange={e => set({ jenisPajak: e.target.value })} className={inputCls}>
                  {TAX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {form.jenisPajak && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label text="DPP" />
                    <input type="number" value={form.dpp ?? 0} onChange={e => set({ dpp: Number(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <Label text="PPN" />
                    <input type="number" value={form.ppn ?? 0} onChange={e => set({ ppn: Number(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <Label text="PPh" />
                    <input type="number" value={form.pph ?? 0} onChange={e => set({ pph: Number(e.target.value) })} className={inputCls} />
                  </div>
                </div>
              )}
              {form.jenisPajak && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  <span className="font-semibold">Total bayar: </span>
                  Rp {(total + Number(form.ppn ?? 0) - Number(form.pph ?? 0)).toLocaleString('id-ID')}
                </div>
              )}
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={!!form.taxPaid} onChange={e => set({ taxPaid: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                  Sudah bayar pajak
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={!!form.isDeductible} onChange={e => set({ isDeductible: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                  Biaya deductible (dapat mengurangi pajak)
                </label>
              </div>
            </div>
          )}

          {/* Tab 3: Lainnya */}
          {tab === 3 && (
            <div className="space-y-3">
              <div>
                <Label text="Kategori Utama" />
                <select value={form.kategoriUtama || ''} onChange={e => set({ kategoriUtama: e.target.value })} className={inputCls}>
                  <option value="">-- Pilih Kategori Utama --</option>
                  {MAIN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Pengelompokan besar untuk laporan keuangan internal.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label text="Divisi / Cabang / Lokasi" />
                  <input type="text" value={form.divisi || ''} onChange={e => set({ divisi: e.target.value })} placeholder="Contoh: Cabang Surabaya" className={inputCls} />
                </div>
                <div>
                  <Label text="Penanggung Jawab Input" />
                  <input type="text" value={form.penanggungJawab || ''} onChange={e => set({ penanggungJawab: e.target.value })} placeholder="Nama PIC" className={inputCls} />
                </div>
              </div>
              <div>
                <Label text="Catatan Khusus" />
                <textarea value={form.catatan || ''} onChange={e => set({ catatan: e.target.value })} rows={2} placeholder="Catatan tambahan..." className={`${inputCls} resize-none`} />
              </div>

              {/* File Attachments */}
              <div>
                <Label text="Lampiran Bukti" />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="fin-attachment-input"
                  />
                  <label htmlFor="fin-attachment-input" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      {uploadingFile ? (
                        <div className="flex items-center gap-2 text-blue-600 text-sm">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                          Mengupload...
                        </div>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-sm text-blue-600 font-medium">Klik untuk upload file</span>
                          <span className="text-xs text-gray-400">JPG, PNG, PDF, Word, Excel (maks 10MB)</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}

                {/* Attached files list */}
                {attachmentUrls.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {attachmentUrls.map((url, i) => {
                      const fname = url.split('/').pop() || url;
                      const isPdf = fname.toLowerCase().endsWith('.pdf');
                      const isImg = /\.(jpg|jpeg|png|gif)$/i.test(fname);
                      return (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                          <span className="text-lg">{isPdf ? '📄' : isImg ? '🖼️' : '📎'}</span>
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 text-xs text-blue-600 hover:underline truncate">
                            {fname}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeAttachment(url)}
                            className="text-gray-400 hover:text-red-500 text-xs font-bold ml-1 shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50 rounded-b-2xl shrink-0">
          <div className="flex gap-2">
            {tab > 0 && (
              <button onClick={() => setTab(t => t - 1)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100">← Sebelumnya</button>
            )}
            {tab < TABS.length - 1 && (
              <button onClick={() => setTab(t => t + 1)} className="px-3 py-1.5 text-xs border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50">Selanjutnya →</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100">Batal</button>
            <button onClick={handleSave} disabled={saving} className={`px-4 py-2 text-sm rounded-lg text-white font-semibold ${accentBg} disabled:opacity-50`}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceEntryModal;
