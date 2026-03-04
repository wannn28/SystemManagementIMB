import React, { useState, useEffect, useCallback, useRef } from 'react';
import { invoiceApi } from '../api/invoice';
import { customerApi } from '../api/customer';
import { equipmentApi } from '../api/equipment';
import type {
  Invoice,
  InvoiceTemplate,
  CreateInvoiceRequest,
  TemplateItemColumn,
} from '../types/invoice';
import type { Customer } from '../types/customer';
import type { Equipment } from '../types/equipment';
import { FiFileText, FiPlus, FiTrash2, FiEdit2, FiEye, FiList, FiFile, FiGrid, FiCalendar, FiUsers, FiImage, FiCopy } from 'react-icons/fi';
import InvoicePDFExportButton from '../component/InvoicePDFExportButton';
import { Modal } from '../component/Modal';
import { replaceIntroPlaceholders } from '../utils/introPlaceholders';
import { evaluateFormula, formulaToDisplayFormula, getComputedFormulaValues } from '../utils/invoiceFormula';

interface InvoicesProps {
  isCollapsed: boolean;
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

/** Format nilai angka menurut konfigurasi kolom (Angka / Rupiah / Persen) */
function formatNumberByColumn(col: { format?: 'number' | 'rupiah' | 'percent' }, value: number): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const fmt = col.format ?? 'number';
  if (fmt === 'rupiah') return formatRupiah(value);
  if (fmt === 'percent') return `${value} %`;
  return String(value);
}

/** Kelas Tailwind untuk perataan header kolom (default: tengah) */
function getHeaderAlignClass(col: { headerAlign?: 'left' | 'center' | 'right' }): string {
  const a = col.headerAlign ?? 'center';
  return a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left';
}

/** Kelas Tailwind untuk perataan isi sel kolom (default: tengah) */
function getContentAlignClass(col: { contentAlign?: 'left' | 'center' | 'right' }): string {
  const a = col.contentAlign ?? 'center';
  return a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left';
}

/** Nilai tampilan kolom Keterangan: dump truck → plat nomor, alat berat → nama (jika mode auto) */
function getItemNameDisplay(
  itemName: string,
  equipmentList: Equipment[],
  mode: 'name' | 'auto_plate_or_name' | undefined
): string {
  if (!itemName || mode !== 'auto_plate_or_name') return itemName;
  const eq = equipmentList.find((e) => e.name === itemName);
  if (eq?.type === 'dump_truck' && (eq?.license_plate ?? '').trim()) return (eq.license_plate ?? '').trim();
  return itemName;
}

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
/** Format YYYY-MM-DD ke tampilan Indonesia, e.g. "3 Februari 2026". */
const formatDateToIndonesian = (isoDate: string) => {
  if (!isoDate || !isoDate.trim()) return '';
  const [y, m, d] = isoDate.split('T')[0].split('-');
  const mi = parseInt(m || '1', 10) - 1;
  return `${d} ${MONTHS_ID[mi]} ${y}`;
};

const ANGKA = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
function terbilangRupiah(n: number): string {
  if (n <= 0) return 'Nol';
  if (n < 10) return ANGKA[Math.round(n)];
  if (n < 20) return n < 10 ? ANGKA[Math.round(n)] : (Math.round(n) === 10 ? 'Sepuluh' : ANGKA[Math.round(n) - 10] + ' Belas');
  const intN = Math.floor(n);
  if (intN < 100) return ANGKA[Math.floor(intN / 10)] + ' Puluh ' + (intN % 10 ? ANGKA[intN % 10] : '');
  if (intN < 200) return 'Seratus ' + terbilangRupiah(intN - 100);
  if (intN < 1000) return ANGKA[Math.floor(intN / 100)] + ' Ratus ' + (intN % 100 ? terbilangRupiah(intN % 100) : '');
  if (intN < 2000) return 'Seribu ' + (intN % 1000 ? terbilangRupiah(intN % 1000) : '');
  if (intN < 1e6) return terbilangRupiah(Math.floor(intN / 1000)) + ' Ribu ' + (intN % 1000 ? terbilangRupiah(intN % 1000) : '');
  if (intN < 1e9) return terbilangRupiah(Math.floor(intN / 1e6)) + ' Juta ' + (intN % 1e6 ? terbilangRupiah(intN % 1e6) : '');
  return terbilangRupiah(Math.floor(intN / 1e9)) + ' Miliar ' + (intN % 1e9 ? terbilangRupiah(intN % 1e9) : '');
}
const formatDateOnly = (d: string) => {
  if (!d) return '';
  const x = d.split('T')[0];
  if (!x) return d;
  const [y, m, day] = x.split('-');
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const mi = parseInt(m || '1', 10) - 1;
  return `${day} ${months[mi]} ${y}`;
};

const STATUS_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Terkirim' },
  { value: 'paid', label: 'Lunas' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'penawaran', label: 'Penawaran' },
  { value: 'pre_order', label: 'Pre Order' },
  { value: 'surat_jalan', label: 'Surat Jalan' },
  { value: 'lainnya', label: 'Lainnya' },
];

/** Tipe kolom tabel item: hanya ini yang ditawarkan. Qty/Harga/BBM dll hanya muncul di rumus kalau ada kolom Angka (rumus) yang memakainya. */
const ITEM_COLUMN_KEYS: { value: string; label: string; formula?: string }[] = [
  { value: 'item_name', label: 'Item / Keterangan' },
  { value: 'description', label: 'String/huruf' },
  { value: 'row_date', label: 'Tanggal' },
  { value: 'no', label: 'Nomor' },
  { value: 'number', label: 'Angka (no rumus)' },
  { value: 'formula', label: 'Angka (rumus)' },
];

const DEFAULT_ITEM_COLUMNS: TemplateItemColumn[] = [
  { key: 'item_name', label: 'Item/Keterangan' },
  { key: 'formula', label: 'Jumlah', formula: 'quantity*price' },
];

const INVOICE_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'created_at_desc', label: 'Terbaru dibuat' },
  { value: 'created_at_asc', label: 'Terlama dibuat' },
  { value: 'invoice_date_desc', label: 'Tanggal invoice terbaru' },
  { value: 'invoice_date_asc', label: 'Tanggal invoice terlama' },
  { value: 'customer_name_asc', label: 'Customer A–Z' },
  { value: 'customer_name_desc', label: 'Customer Z–A' },
];

const Invoices: React.FC<InvoicesProps> = ({ isCollapsed }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'templates' | 'customers'>('list');

  // List state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<number | string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0, has_next: false, has_prev: false });
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSortKey, setFilterSortKey] = useState('created_at_desc');

  // Create form
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [step, setStep] = useState<'pick-template' | 'fill-form'>('pick-template');
  const [editInvoiceId, setEditInvoiceId] = useState<number | string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<{ customer_name: string; customer_phone: string; customer_email: string; customer_address: string }[]>([]);
  const [loadingCustomerSuggestions, setLoadingCustomerSuggestions] = useState(false);
  // Tab Pelanggan: master data customer (bisa edit/hapus)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null);
  type FormItem = {
    item_name: string;
    description?: string;
    /** Tampilan keterangan: dari hasil AI (plat/nama dari timesheet) atau manual; diprioritaskan di form & PDF */
    item_display_name?: string;
    /** True = user memilih "Hasil AI" (pakai nilai AI bila ada); blok Hasil AI (nilai dipakai) ditampilkan */
    use_ai_display?: boolean;
    quantity: number;
    price: number;
    total?: number;
    row_date?: string;
    days?: number;
    bbm_quantity?: number;
    bbm_unit_price?: number;
    equipment_group?: string;
    quantity_unit?: 'hari' | 'jam' | 'unit' | 'jerigen' | 'volume';
    row_image?: string;
  };
  const [items, setItems] = useState<FormItem[]>([
    { item_name: '', description: '', quantity: 1, price: 0, row_date: '', days: 0, bbm_quantity: 0, bbm_unit_price: 0 },
  ]);
  const [itemColumnLabel, setItemColumnLabel] = useState('Keterangan');
  const [taxPercent, setTaxPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [includeBbmNote, setIncludeBbmNote] = useState(false);
  const [useBbmColumns, setUseBbmColumns] = useState(false);
  const [quantityUnit, setQuantityUnit] = useState<'hari' | 'jam' | 'unit' | 'jerigen' | 'volume'>('hari');
  const [priceUnitLabel, setPriceUnitLabel] = useState('Harga/Hari');
  /** Konfigurasi kolom per group (override template). Key = groupKey, Value = array kolom */
  const [groupColumnConfigs, setGroupColumnConfigs] = useState<Record<string, TemplateItemColumn[]>>({});
  /** Modal edit kolom per group */
  const [editingColumnsForGroup, setEditingColumnsForGroup] = useState<string | null>(null);
  const [groupColumnsForm, setGroupColumnsForm] = useState<TemplateItemColumn[]>([]);
  const [location, setLocation] = useState('Batam');
  const [subject, setSubject] = useState('Invoice');
  const [equipmentNames, setEquipmentNames] = useState<string[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [newEquipmentInput, setNewEquipmentInput] = useState('');
  /** Hasil pembacaan AI terakhir (satu baris) agar bisa dilihat user */
  const [lastExtractResult, setLastExtractResult] = useState<{ row_date: string; days: number; unit?: string; item_name?: string } | null>(null);
  /** Hasil pembacaan AI terakhir (banyak baris) agar bisa dilihat user */
  const [lastExtractResults, setLastExtractResults] = useState<{ row_date: string; days: number; unit?: string; item_name?: string }[] | null>(null);

  const formatEquipmentNamesForParagraph = (arr: string[]) => {
    if (arr.length === 0) return '';
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(', ') + ' dan ' + arr[arr.length - 1];
  };
  /** Daftar alat terurut: tipe Dumptruck selalu paling belakang. Dedupe agar nama tidak double di paragraf. */
  const equipmentNamesForKeterangan = (() => {
    const unique = [...new Set(equipmentNames)];
    return unique.sort((a, b) => {
      const typeA = equipmentList.find((e) => e.name === a)?.type;
      const typeB = equipmentList.find((e) => e.name === b)?.type;
      if (typeA === 'dump_truck' && typeB !== 'dump_truck') return 1;
      if (typeA !== 'dump_truck' && typeB === 'dump_truck') return -1;
      return 0;
    });
  })();

  const getEquipmentNameForPayload = () => formatEquipmentNamesForParagraph(equipmentNamesForKeterangan);
  /** Hanya alat berat dari daftar (bukan dump truck), untuk @alatberat */
  const getEquipmentNameAlatBeratForPayload = () =>
    formatEquipmentNamesForParagraph(equipmentNamesForKeterangan.filter((n) => equipmentList.find((e) => e.name === n)?.type !== 'dump_truck'));
  /** Hanya dump truck dari daftar, untuk @dumptruck */
  const getEquipmentNameDumptruckForPayload = () =>
    formatEquipmentNamesForParagraph(equipmentNamesForKeterangan.filter((n) => equipmentList.find((e) => e.name === n)?.type === 'dump_truck'));
  /** Nama alat yang ditambah manual (bukan dari daftar), untuk @alatberatmanual */
  const getEquipmentNameManualForPayload = () =>
    formatEquipmentNamesForParagraph(equipmentNames.filter((n) => !equipmentList.some((e) => e.name === n)));
  const [introParagraph, setIntroParagraph] = useState('');
  const INTRO_PLACEHOLDERS = ['@alatberat', '@alatberatmanual', '@dumptruck', '@lokasi'];
  const [showIntroSuggestions, setShowIntroSuggestions] = useState(false);
  const [introSuggestionAt, setIntroSuggestionAt] = useState(0);
  const introParagraphTextareaRef = useRef<HTMLTextAreaElement>(null);
  const introSuggestionEndRef = useRef(0);
  const [bankAccount, setBankAccount] = useState('1090021332523 (PT INDIRA MAJU BERSAMA) Bank Mandiri');
  const [terbilangCustom, setTerbilangCustom] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [extractingRowIndex, setExtractingRowIndex] = useState<number | null>(null);
  /** Unit mana yang sedang ekstrak banyak gambar (per unit, agar unit lain bisa ekstrak bersamaan). */
  const [extractingByGroup, setExtractingByGroup] = useState<Record<string, boolean>>({});
  const extractRowInputRef = useRef<HTMLInputElement>(null);
  const extractMultiRowInputRef = useRef<HTMLInputElement>(null);
  const extractMultiRowForGroupRef = useRef<string>('__default__');
  const itemsRef = useRef<FormItem[]>(items);
  itemsRef.current = items;
  useEffect(() => () => {
    itemsRef.current.forEach((i) => {
      if (i.row_image && typeof i.row_image === 'string' && i.row_image.startsWith('blob:')) URL.revokeObjectURL(i.row_image);
    });
  }, []);

  // Preview
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Template CRUD
  type TemplateFormState = {
    name: string;
    description: string;
    layout: string;
    document_type: string;
    default_intro: string;
    signature_count: number;
    options: {
      item_columns: TemplateItemColumn[];
      show_date?: boolean;
      show_no?: boolean;
      show_total?: boolean;
      show_bank_account?: boolean;
      use_bbm_columns?: boolean;
      include_bbm_note?: boolean;
      quantity_unit?: string;
      price_unit_label?: string;
      item_column_label?: string;
      default_notes?: string;
      item_row_height?: 'compact' | 'normal' | 'relaxed';
    };
  };
  const [templateForm, setTemplateForm] = useState<TemplateFormState>({
    name: '',
    description: '',
    layout: 'standard',
    document_type: 'invoice',
    default_intro: '',
    signature_count: 1,
    options: {
      item_columns: [...DEFAULT_ITEM_COLUMNS],
      show_date: true,
      show_no: true,
      show_total: true,
      show_bank_account: true,
      use_bbm_columns: false,
      include_bbm_note: false,
      quantity_unit: 'hari',
      price_unit_label: 'Harga/Hari',
      item_column_label: 'Keterangan',
      default_notes: '',
      item_row_height: 'normal',
    },
  });
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [formulaPopoverColIdx, setFormulaPopoverColIdx] = useState<number | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);
  const [duplicatingTemplateId, setDuplicatingTemplateId] = useState<number | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<number | string | null>(null);
  const dateInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /** Token menu relasi: kolom Angka (rumus) dan Angka (no rumus) di atas kolom ini + operator. Keduanya berupa angka sehingga bisa dipakai dalam rumus (×, /, +, -). */
  const getFormulaRelationTokensForCol = (colIdx: number): { token: string; label: string }[] => {
    const cols = templateForm.options.item_columns;
    const varTokens: { token: string; label: string }[] = [];
    cols.forEach((c, i) => {
      if (i >= colIdx) return;
      if (c.key !== 'formula' && c.key !== 'number') return;
      const label = (c.label || '').trim() || `Kolom ${i + 1}`;
      varTokens.push({ token: `col_${i}`, label });
    });
    const opTokens = [
      { token: '*', label: '×' },
      { token: '/', label: '/' },
      { token: '+', label: '+' },
      { token: '-', label: '-' },
    ];
    return [...varTokens, ...opTokens];
  };

  /** Saat label kolom diubah, perbarui juga referensi label tersebut di rumus kolom lain (mis. Hari → Jam maka rumus "Hari*Harga/Hari" → "Jam*Harga/Hari"). */
  const applyColumnLabelChange = (
    columns: TemplateItemColumn[],
    idx: number,
    newLabelValue: string
  ): TemplateItemColumn[] => {
    const oldLabel = (columns[idx]?.label ?? '').trim();
    const newLabel = (newLabelValue ?? '').trim();
    const cols = columns.map((c, i) => (i === idx ? { ...c, label: newLabel || c.label } : c));
    if (!oldLabel || oldLabel === newLabel) return cols;
    const labelsContainingOld = columns
      .map((c) => (c.label ?? '').trim())
      .filter((lbl, i) => i !== idx && lbl && lbl !== oldLabel && lbl.includes(oldLabel))
      .sort((a, b) => b.length - a.length);
    const placeholders = labelsContainingOld.map((_, i) => `\u200B__L${i}__\u200B`);
    return cols.map((c, i) => {
      if (i === idx) return c;
      if (!c.formula || !c.formula.trim()) return c;
      let formula = c.formula.trim();
      labelsContainingOld.forEach((lbl, pi) => {
        formula = formula.split(lbl).join(placeholders[pi]);
      });
      formula = formula.split(oldLabel).join(newLabel);
      placeholders.forEach((ph, pi) => {
        formula = formula.split(ph).join(labelsContainingOld[pi]);
      });
      return { ...c, formula };
    });
  };

  /** Auto-fill kolom 'number' yang sourcenya dari equipment saat pilih equipment */
  const applyEquipmentDataToRow = (
    row: FormItem,
    equipment: Equipment | undefined,
    columns: TemplateItemColumn[]
  ): FormItem => {
    if (!equipment) return row;
    let updated = { ...row };
    columns.forEach((col, colIdx) => {
      if (col.key !== 'number' || !col.source || col.source === 'manual') return;
      const fieldKey = `custom_num_${colIdx}`;
      if (col.source === 'equipment_price_per_hour') {
        updated = { ...updated, [fieldKey]: equipment.price_per_hour ?? 0 };
      } else if (col.source === 'equipment_price_per_day') {
        updated = { ...updated, [fieldKey]: equipment.price_per_day ?? 0 };
      }
    });
    return updated;
  };

  /** Get kolom untuk group tertentu (dari override atau template default) */
  const getColumnsForGroup = (groupKey: string): TemplateItemColumn[] => {
    if (groupColumnConfigs[groupKey]) return groupColumnConfigs[groupKey];
    return templateItemColumns || [];
  };

  /** Buka modal edit kolom untuk group */
  const openEditColumnsForGroup = (groupKey: string) => {
    const currentCols = getColumnsForGroup(groupKey);
    setGroupColumnsForm(currentCols.length > 0 ? [...currentCols] : (templateItemColumns ? [...templateItemColumns] : []));
    setEditingColumnsForGroup(groupKey);
  };

  /** Simpan konfigurasi kolom group */
  const saveGroupColumns = () => {
    if (!editingColumnsForGroup) return;
    setGroupColumnConfigs((prev) => ({ ...prev, [editingColumnsForGroup]: groupColumnsForm }));
    setEditingColumnsForGroup(null);
  };

  /** Handle pilih item_name: isi price + custom number columns dari equipment; hapus hasil AI (nilai dipakai) saat pilih alat berat/dumptruck */
  const handleSelectItemName = (index: number, itemName: string) => {
    setItems((prev) => prev.map((r, i) => {
      if (i !== index) return r;
      const eq = equipmentList.find((e) => e.name === itemName);
      if (!eq) return { ...r, item_name: itemName, item_display_name: '', use_ai_display: false };
      const rowUnit = r.quantity_unit ?? quantityUnit;
      const p = rowUnit === 'jam' ? (eq.price_per_hour ?? 0) : (eq.price_per_day ?? 0);
      let updated: FormItem = { ...r, item_name: itemName, item_display_name: '', use_ai_display: false };
      if (p > 0) updated = { ...updated, price: p };
      const groupKey = getGroupKey(r);
      const groupCols = getColumnsForGroup(groupKey);
      if (groupCols.length > 0) {
        updated = applyEquipmentDataToRow(updated, eq, groupCols);
      }
      return { ...updated, item_display_name: '', use_ai_display: false };
    }));
  };

  const fetchInvoices = useCallback(async () => {
    setListLoading(true);
    try {
      const filterParts: string[] = [];
      if (filterStatus) filterParts.push(`status:${filterStatus}`);
      if (filterStartDate) filterParts.push(`start_date:${filterStartDate}`);
      if (filterEndDate) filterParts.push(`end_date:${filterEndDate}`);
      const sortOrderMatch = filterSortKey.match(/^(.+)_(asc|desc)$/);
      const sortField = sortOrderMatch ? sortOrderMatch[1] : 'created_at';
      const sortOrder = (sortOrderMatch ? sortOrderMatch[2] : 'desc') as 'asc' | 'desc';
      const res = await invoiceApi.getInvoices({
        page: pagination.page,
        limit: pagination.limit,
        search: filterSearch || undefined,
        sort: sortField,
        order: sortOrder,
        filter: filterParts.length ? filterParts.join(',') : undefined,
      });
      setInvoices(res.data);
      setPagination((prev) => ({
        ...prev,
        total: res.pagination.total,
        total_pages: res.pagination.total_pages,
        has_next: res.pagination.has_next,
        has_prev: res.pagination.has_prev,
      }));
    } catch {
      setInvoices([]);
    } finally {
      setListLoading(false);
    }
  }, [pagination.page, pagination.limit, filterSearch, filterStatus, filterStartDate, filterEndDate, filterSortKey]);

  useEffect(() => {
    if (activeTab === 'list') fetchInvoices();
  }, [activeTab, fetchInvoices]);

  useEffect(() => {
    invoiceApi.getTemplates().then((data) => {
      setTemplates(data);
      setLoadingTemplates(false);
    });
  }, [activeTab]);

  const fetchCustomers = useCallback(() => {
    setLoadingCustomers(true);
    customerApi.getList(customerSearch).then(setCustomers).finally(() => setLoadingCustomers(false));
  }, [customerSearch]);
  useEffect(() => {
    if (activeTab === 'customers') fetchCustomers();
  }, [activeTab, fetchCustomers]);

  useEffect(() => {
    if (step !== 'fill-form') return;
    setLoadingCustomerSuggestions(true);
    customerApi.getList().then((list) => {
      setCustomerSuggestions(list.map((c) => ({
        customer_name: c.name,
        customer_phone: c.phone || '',
        customer_email: c.email || '',
        customer_address: c.address || '',
      })));
      setLoadingCustomerSuggestions(false);
    }).catch(() => setLoadingCustomerSuggestions(false));
  }, [step]);

  useEffect(() => {
    if (step !== 'fill-form') return;
    equipmentApi.getList(undefined, undefined).then((list) => setEquipmentList(list)).catch(() => setEquipmentList([]));
  }, [step]);

  // Isi harga otomatis untuk baris yang sudah punya item_name dari alat tapi harga masih 0 (mis. setelah equipmentList selesai dimuat atau dari load invoice).
  useEffect(() => {
    if (equipmentList.length === 0 || step !== 'fill-form') return;
    setItems((prev) =>
      prev.map((row) => {
        if (!(row.item_name || '').trim() || (row.price ?? 0) > 0) return row;
        const eq = equipmentList.find((e) => e.name === row.item_name);
        if (!eq) return row;
        const rowUnit = (row.quantity_unit ?? quantityUnit) as 'hari' | 'jam' | 'unit' | 'jerigen';
        const p = rowUnit === 'jam' ? (eq.price_per_hour ?? 0) : (eq.price_per_day ?? 0);
        if (p <= 0) return row;
        return { ...row, price: p };
      })
    );
  }, [equipmentList, quantityUnit, step]);

  const handleSelectTemplate = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setStep('fill-form');
    setGroupColumnConfigs({});
    const rawOpt = template.options;
    const opts =
      rawOpt == null
        ? {}
        : typeof rawOpt === 'string'
          ? (() => {
              try {
                return (JSON.parse(rawOpt) as Record<string, unknown>) || {};
              } catch {
                return {};
              }
            })()
          : (rawOpt as Record<string, unknown>);
    const itemCols = (opts.item_columns as unknown as { label?: string }[] | undefined) || [];
    setUseBbmColumns((itemCols?.length ?? 0) === 0 && !!opts.use_bbm_columns);
    setIncludeBbmNote(!!opts.include_bbm_note);
    const qu = (opts.quantity_unit as string) || 'hari';
    setQuantityUnit(qu === 'jam' ? 'jam' : qu === 'unit' ? 'unit' : qu === 'jerigen' ? 'jerigen' : qu === 'volume' ? 'volume' : 'hari');
    setPriceUnitLabel((opts.price_unit_label as string) || (qu === 'jam' ? 'Harga/Jam' : qu === 'volume' ? 'Harga/Volume' : qu === 'unit' ? 'Harga/Unit' : qu === 'jerigen' ? 'Harga/Jerigen' : 'Harga/Hari'));
    setItemColumnLabel((opts.item_column_label as string) || itemCols[0]?.label || 'Keterangan');
    const docLabel =
      (template.document_type || 'invoice')
        .replace('_', ' ')
        .replace(/^\w/, (c) => c.toUpperCase());
    setSubject(docLabel);
    setIntroParagraph(template.default_intro || '');
    setNotes((opts.default_notes as string) || '');
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
    setStep('pick-template');
    setEditInvoiceId(null);
    setQuantityUnit('hari');
    setPriceUnitLabel('Harga/Hari');
    setEquipmentNames([]);
    setItemColumnLabel('Keterangan');
    setTerbilangCustom('');
    setGroupColumnConfigs({});
  };

  const loadInvoiceForEdit = async (id: number | string) => {
    const inv = await invoiceApi.getInvoiceById(id);
    if (!inv) return;
    setEditInvoiceId(id);
    setInvoiceNumber(inv.invoice_number);
    setInvoiceDate(inv.invoice_date);
    setDueDate(inv.due_date || '');
    setCustomerName(inv.customer_name);
    setCustomerPhone(inv.customer_phone || '');
    setCustomerEmail(inv.customer_email || '');
    setCustomerAddress(inv.customer_address || '');
    setItems(
      (inv.items && inv.items.length) > 0
        ? inv.items.map((i) => {
            const iRec = i as unknown as Record<string, unknown>;
            const customFields = Object.keys(iRec).filter((k) => k.startsWith('custom_num_')).reduce((acc, k) => ({ ...acc, [k]: iRec[k] }), {});
            const itemDisplayName = (i as { item_display_name?: string }).item_display_name || undefined;
            return {
              item_name: i.item_name,
              description: i.description || '',
              item_display_name: itemDisplayName,
              use_ai_display: !!(itemDisplayName && itemDisplayName.trim()),
              quantity: i.quantity ?? 1,
              price: i.price ?? 0,
              row_date: i.row_date || '',
              days: i.days ?? 0,
              bbm_quantity: i.bbm_quantity ?? 0,
              bbm_unit_price: i.bbm_unit_price ?? 0,
              equipment_group: i.equipment_group || '',
              ...customFields,
            };
          })
        : [{ item_name: '', description: '', quantity: 1, price: 0, row_date: '', days: 0, bbm_quantity: 0, bbm_unit_price: 0 }]
    );
    setItemColumnLabel(inv.item_column_label || 'Keterangan');
    setTaxPercent(inv.tax_percent ?? 0);
    setNotes(inv.notes || '');
    setIncludeBbmNote(inv.include_bbm_note ?? false);
    setUseBbmColumns(inv.use_bbm_columns ?? false);
    setLocation(inv.location || 'Batam');
    setSubject(inv.subject || 'Invoice');
    const eqName = (inv.equipment_name || '').replace(/^Alat berat berupa\s+/i, '').trim();
    if (eqName) {
      const arr = eqName.split(/\s+dan\s+|,/).map((s) => s.trim()).filter(Boolean);
      setEquipmentNames(arr);
    } else {
      setEquipmentNames([]);
    }
    setIntroParagraph(inv.intro_paragraph || '');
    setBankAccount(inv.bank_account || '');
    setTerbilangCustom(inv.terbilang_custom || '');
    const qu = (inv.quantity_unit as 'hari' | 'jam' | 'unit' | 'jerigen' | 'volume') || 'hari';
    setQuantityUnit(qu);
    setPriceUnitLabel(inv.price_unit_label || (qu === 'jam' ? 'Harga/Jam' : qu === 'unit' ? 'Harga/Unit' : qu === 'jerigen' ? 'Harga/Jerigen' : qu === 'volume' ? 'Harga/Volume' : 'Harga/Hari'));
    if (inv.group_column_configs) {
      try {
        const parsed = JSON.parse(inv.group_column_configs) as Record<string, TemplateItemColumn[]>;
        setGroupColumnConfigs(parsed);
      } catch {
        setGroupColumnConfigs({});
      }
    } else {
      setGroupColumnConfigs({});
    }
    const t = templates.find((x) => Number(x.id) === Number(inv.template_id));
    if (t) setSelectedTemplate(t);
    setStep('fill-form');
    setActiveTab('create');
  };

  const getGroupKey = (r: FormItem) => (r.equipment_group || '').trim() || '__default__';
  const groupIndices: Record<string, number[]> = {};
  items.forEach((r, i) => {
    const k = getGroupKey(r);
    if (!groupIndices[k]) groupIndices[k] = [];
    groupIndices[k].push(i);
  });
  const orderedGroupKeys = ((): string[] => {
    if (items.length === 0) return ['__default__'];
    const keys: string[] = [];
    for (const r of items) {
      const k = getGroupKey(r);
      if (!keys.includes(k)) keys.push(k);
    }
    const nonEmpty = keys.filter((k) => (groupIndices[k]?.length ?? 0) > 0);
    return nonEmpty.length > 0 ? nonEmpty : ['__default__'];
  })();
  const { templateShowNo, templateShowDate, templateShowTotal, templateShowBankAccount, templateHasBbm } = (() => {
    const raw = selectedTemplate?.options;
    const opts = raw != null
      ? (typeof raw === 'string' ? (() => { try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; } })() : (raw as Record<string, unknown>))
      : {};
    return {
      templateShowNo: opts.show_no !== false,
      templateShowDate: opts.show_date !== false,
      templateShowTotal: opts.show_total !== false,
      templateShowBankAccount: opts.show_bank_account !== false,
      templateHasBbm: !!(opts.use_bbm_columns || opts.include_bbm_note),
    };
  })();
  /** Kolom item dari template: dipakai untuk form & PDF. BBM hanya lewat kolom ini, bukan opsi terpisah. */
  const templateItemColumns: TemplateItemColumn[] | null = (() => {
    const raw = selectedTemplate?.options;
    if (!raw) return null;
    const opts = typeof raw === 'string' ? (() => { try { return JSON.parse(raw) as { item_columns?: TemplateItemColumn[] }; } catch { return {}; } })() : (raw as { item_columns?: TemplateItemColumn[] });
    const cols = opts?.item_columns;
    return cols?.length ? cols : null;
  })();
  /** Kolom yang ditampilkan di tabel (filter row_date/total sesuai opsi template). */
  /** Tanggal tidak lagi pakai box centang: kolom Tanggal bisa banyak (2+). Hanya total yang di-filter oleh show_total. */
  const displayItemColumns = templateItemColumns
    ? templateItemColumns.filter((c) => !(c.key === 'total' && !templateShowTotal))
    : [];
  const useTemplateColumns = displayItemColumns.length > 0;
  const documentTypeLabel = selectedTemplate?.document_type
    ? selectedTemplate.document_type.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())
    : 'Invoice';
  const emptyFormItem = (defaultItemName?: string): FormItem => ({
    item_name: defaultItemName ?? '',
    description: '',
    quantity: 1,
    price: 0,
    row_date: '',
    days: 0,
    bbm_quantity: 0,
    bbm_unit_price: 0,
  });
  const addItemEmptyForGroup = (groupKey: string, defaultItemName?: string) => {
    const indices = groupIndices[groupKey] || [];
    const insertAfter = indices.length > 0 ? Math.max(...indices) : -1;
    setItems((prev) => {
      const refRow = insertAfter >= 0 ? (prev[insertAfter] as FormItem) : null;
      const followName = refRow?.item_name || defaultItemName;
      const followUseAi = refRow?.use_ai_display ?? false;
      let newRow: FormItem = { ...emptyFormItem(followName), equipment_group: groupKey === '__default__' ? '' : groupKey, use_ai_display: followUseAi };
      if (followName) {
        const eq = equipmentList.find((e) => e.name === followName);
        if (eq) {
          const p = quantityUnit === 'jam' ? (eq.price_per_hour ?? 0) : (eq.price_per_day ?? 0);
          if (p > 0) newRow = { ...newRow, price: p };
          const groupCols = getColumnsForGroup(groupKey);
          if (groupCols.length > 0) newRow = applyEquipmentDataToRow(newRow, eq, groupCols);
        }
      }
      if (templateShowDate) newRow = { ...newRow, row_date: new Date().toISOString().slice(0, 10) };
      return [...prev.slice(0, insertAfter + 1), newRow, ...prev.slice(insertAfter + 1)];
    });
  };
  const addItemCopyFromAboveForGroup = (groupKey: string) => {
    const indices = groupIndices[groupKey] || [];
    if (indices.length === 0) {
      addItemEmptyForGroup(groupKey);
      return;
    }
    const lastIdx = indices[indices.length - 1];
    const last = items[lastIdx];
    const { row_image: _dropped, ...rest } = last;
    const copy: FormItem = {
      ...rest,
      equipment_group: groupKey === '__default__' ? '' : groupKey,
    };
    setItems((prev) => [...prev.slice(0, lastIdx + 1), copy, ...prev.slice(lastIdx + 1)]);
  };
  const updateGroupName = (groupKey: string, newName: string) => {
    const val = newName.trim();
    const indicesInGroup = groupIndices[groupKey] || [];
    const moreThanOneRow = indicesInGroup.length > 1;
    setItems((prev) =>
      prev.map((r) => {
        if (getGroupKey(r) !== groupKey) return r;
        const dateFilled = (r.row_date || '').trim() !== '';
        const priceFilled = Number(r.price ?? 0) > 0;
        const skipUpdate = moreThanOneRow || dateFilled || priceFilled;
        const newItemName = skipUpdate ? r.item_name : val;
        let next = { ...r, equipment_group: groupKey === '__default__' ? val : val, item_name: newItemName };
        if (newItemName && !skipUpdate) {
          const eq = equipmentList.find((e) => e.name === newItemName);
          if (eq) {
            const rowUnit = (r.quantity_unit ?? quantityUnit) as 'hari' | 'jam' | 'unit' | 'jerigen';
            const p = rowUnit === 'jam' ? (eq.price_per_hour ?? 0) : (eq.price_per_day ?? 0);
            if (p > 0) next = { ...next, price: p };
            const groupCols = getColumnsForGroup(groupKey);
            if (groupCols.length > 0) {
              next = applyEquipmentDataToRow(next, eq, groupCols) as typeof next;
            }
          }
        }
        return next;
      })
    );
  };
  const addDifferentUnit = () => {
    const usedNames = new Set<string>();
    orderedGroupKeys.forEach((gk) => {
      const d = gk === '__default__' ? (items.find((r) => getGroupKey(r) === '__default__')?.equipment_group ?? '') || 'Unit 1' : gk;
      if (d) usedNames.add(d);
    });
    const firstUnused = equipmentNamesForKeterangan.find((n) => !usedNames.has(n));
    const newGroup = firstUnused || `Unit ${usedNames.size + 1}`;
    let newRow: FormItem = { ...emptyFormItem(newGroup), equipment_group: newGroup };
    const eq = equipmentList.find((e) => e.name === newGroup);
    if (eq) {
      const p = quantityUnit === 'jam' ? (eq.price_per_hour ?? 0) : (eq.price_per_day ?? 0);
      if (p > 0) newRow = { ...newRow, price: p };
      const groupCols = getColumnsForGroup(newGroup);
      if (groupCols.length > 0) {
        newRow = applyEquipmentDataToRow(newRow, eq, groupCols);
      }
    }
    if (templateShowDate) newRow = { ...newRow, row_date: new Date().toISOString().slice(0, 10) };
    setItems((prev) => [...prev, newRow]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      const removed = prev[index];
      if (removed?.row_image && removed.row_image.startsWith('blob:')) URL.revokeObjectURL(removed.row_image);
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) return [{ item_name: '', description: '', quantity: 1, price: 0, row_date: '', days: 0, bbm_quantity: 0, bbm_unit_price: 0 }];
      return next;
    });
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleExtractRowFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const idx = extractingRowIndex;
    if (!file || idx == null) {
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      setExtractingRowIndex(null);
      e.target.value = '';
      return;
    }
    try {
      const prevRow = items[idx];
      const groupKey = getGroupKey(prevRow);
      const cols = getColumnsForGroup(groupKey);
      const columnDescriptions = cols
        .map((col) => {
          if (col.key === 'row_date' || col.key === 'date' || col.type === 'date') return 'Tanggal';
          if (col.key === 'item_name' || col.key === 'description' || col.type === 'text') {
            const label = col.label || 'Keterangan';
            if (col.key === 'item_name' && col.item_display_mode === 'auto_plate_or_name')
              return `${label} (dump truck: plat nomor contoh BP 8814 EO; bedakan 8/0 dan O/Q di tulisan tangan)`;
            return label;
          }
          if (col.key === 'number' || col.type === 'number') return col.label || 'Angka';
          return null;
        })
        .filter(Boolean);
      const data = await invoiceApi.extractRowFromImage(file, quantityUnit, columnDescriptions as string[]);
      if (prevRow?.row_image && prevRow.row_image.startsWith('blob:')) URL.revokeObjectURL(prevRow.row_image);
      const newUrl = URL.createObjectURL(file);
      const quantityColIndex = cols.findIndex((col) => {
        const lbl = (col.label || '').toLowerCase().trim();
        const isNumberCol = col.key === 'number' || col.type === 'number';
        if (!isNumberCol) return false;
        if (lbl.includes('harga')) return false;
        return lbl === 'jam' || lbl === 'hari' || lbl === 'qty' || lbl === 'quantity' || lbl.includes('jam') || lbl.includes('hari');
      });
      const aiKeterangan = (data.item_name || '').trim();
      setItems((prev) => prev.map((row, i) => {
        if (i !== idx) return row;
        const updated: any = { ...row, row_date: data.row_date || '', days: data.days ?? 0, row_image: newUrl };
        if (quantityColIndex >= 0) {
          updated[`custom_num_${quantityColIndex}`] = data.days ?? 0;
        }
        if (aiKeterangan && (row as FormItem).use_ai_display) {
          updated.item_display_name = aiKeterangan;
          updated.use_ai_display = true;
        }
        return updated;
      }));
      setLastExtractResults(null);
      setLastExtractResult({ row_date: data.row_date || '', days: data.days ?? 0, unit: data.unit, item_name: aiKeterangan || undefined });
      const msgLine = aiKeterangan
        ? `Tanggal dan jam diisi dari gambar. Hasil pembacaan AI: Tanggal ${data.row_date || '-'}, ${data.days ?? 0} ${quantityUnit}, Keterangan: ${aiKeterangan}`
        : 'Tanggal dan hari/jam berhasil diisi dari gambar.';
      setMessage({ type: 'success', text: msgLine });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || err?.message || 'Gagal ekstrak baris.' });
    } finally {
      setExtractingRowIndex(null);
      e.target.value = '';
    }
  };

  const handleExtractMultiRowsFromImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) {
      e.target.value = '';
      return;
    }
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      setMessage({ type: 'error', text: 'Pilih minimal satu file gambar.' });
      e.target.value = '';
      return;
    }
    const groupKey = extractMultiRowForGroupRef.current ?? '__default__';
    const cols = getColumnsForGroup(groupKey);
    const columnDescriptions = cols
      .map((col) => {
        if (col.key === 'row_date' || col.key === 'date' || col.type === 'date') return 'Tanggal';
        if (col.key === 'item_name' || col.key === 'description' || col.type === 'text') {
          const label = col.label || 'Keterangan';
          if (col.key === 'item_name' && col.item_display_mode === 'auto_plate_or_name')
            return `${label} (dump truck: plat nomor contoh BP 8814 EO; bedakan 8/0 dan O/Q di tulisan tangan)`;
          return label;
        }
        if (col.key === 'number' || col.type === 'number') return col.label || 'Angka';
        return null;
      })
      .filter(Boolean);
    setExtractingByGroup((prev) => ({ ...prev, [groupKey]: true }));
    setMessage(null);
    try {
      const results = await invoiceApi.extractRowsFromImages(
        files,
        quantityUnit,
        columnDescriptions as string[],
        (current, total) => setMessage({ type: 'info', text: `[${groupKey}] Mengolah gambar ${current}/${total}...` })
      );
      setItems((prev) => {
        const groupIndicesHere: Record<string, number[]> = {};
        prev.forEach((r, i) => {
          const k = getGroupKey(r);
          if (!groupIndicesHere[k]) groupIndicesHere[k] = [];
          groupIndicesHere[k].push(i);
        });
        const indicesInGroup = groupIndicesHere[groupKey] || [];
        const emptyIndices = indicesInGroup
          .filter((i) => (prev[i].row_date ?? '').trim() === '' && (prev[i].days ?? 0) === 0)
          .sort((a, b) => a - b);
        const displayName = groupKey === '__default__'
          ? (prev.find((r) => getGroupKey(r) === '__default__')?.equipment_group ?? '') || 'Unit 1'
          : groupKey;
        const defaultItemName = equipmentNames.includes(displayName) ? displayName : (equipmentNames[0] || displayName);
        const defaultEq = equipmentList.find((eq) => eq.name === defaultItemName);
        const defaultPrice = defaultEq
          ? quantityUnit === 'jam'
            ? (defaultEq.price_per_hour ?? 0)
            : (defaultEq.price_per_day ?? 0)
          : 0;
        const groupCols = getColumnsForGroup(groupKey);
        const quantityColIndex = groupCols.findIndex((col) => {
          const lbl = (col.label || '').toLowerCase().trim();
          const isNumberCol = col.key === 'number' || col.type === 'number';
          if (!isNumberCol) return false;
          if (lbl.includes('harga')) return false;
          return lbl === 'jam' || lbl === 'hari' || lbl === 'qty' || lbl === 'quantity' || lbl.includes('jam') || lbl.includes('hari');
        });
        let next = [...prev];
        let resultIdx = 0;
        for (const idx of emptyIndices) {
          if (resultIdx >= results.length) break;
          const res = results[resultIdx];
          const file = files[resultIdx];
          const rowImageUrl = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
          const aiKeterangan = (res.item_name || '').trim();
          const existingRow = next[idx] as FormItem;
          const rowWasUseAi = !!existingRow.use_ai_display;
          let updatedRow = { ...existingRow, row_date: res.row_date || '', days: res.days ?? 0, row_image: rowImageUrl } as FormItem;
          if (rowWasUseAi) {
            updatedRow.item_name = defaultItemName;
            updatedRow.price = defaultPrice;
            if (aiKeterangan) { updatedRow.item_display_name = aiKeterangan; updatedRow.use_ai_display = true; }
            if (defaultEq && groupCols.length > 0) updatedRow = applyEquipmentDataToRow(updatedRow, defaultEq, groupCols) as typeof updatedRow;
          } else {
            updatedRow.item_name = existingRow.item_name || defaultItemName;
            updatedRow.price = existingRow.price ?? defaultPrice;
            if (existingRow.item_name && groupCols.length > 0) {
              const eqForRow = equipmentList.find((e) => e.name === existingRow.item_name);
              if (eqForRow) updatedRow = applyEquipmentDataToRow(updatedRow, eqForRow, groupCols) as typeof updatedRow;
            } else if (defaultEq && groupCols.length > 0) updatedRow = applyEquipmentDataToRow(updatedRow, defaultEq, groupCols) as typeof updatedRow;
          }
          if (quantityColIndex >= 0) {
            (updatedRow as any)[`custom_num_${quantityColIndex}`] = res.days ?? 0;
          }
          next[idx] = updatedRow;
          resultIdx += 1;
        }
        let insertAfter = indicesInGroup.length > 0 ? Math.max(...indicesInGroup) : -1;
        while (resultIdx < results.length) {
          const res = results[resultIdx];
          const file = files[resultIdx];
          const rowImageUrl = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
          const aiKeterangan = (res.item_name || '').trim();
          const rowAbove = insertAfter >= 0 ? (next[insertAfter] as FormItem) : null;
          const followName = rowAbove?.item_name || defaultItemName;
          const followUseAi = rowAbove?.use_ai_display ?? false;
          const eqForNew = equipmentList.find((e) => e.name === followName);
          const priceForNew = eqForNew ? (quantityUnit === 'jam' ? (eqForNew.price_per_hour ?? 0) : (eqForNew.price_per_day ?? 0)) : defaultPrice;
          let newRow: FormItem = {
            ...emptyFormItem(followName),
            equipment_group: groupKey === '__default__' ? '' : groupKey,
            row_date: res.row_date || '',
            days: res.days ?? 0,
            price: priceForNew,
            row_image: rowImageUrl,
            use_ai_display: followUseAi,
          };
          if (followUseAi && aiKeterangan) {
            newRow.item_display_name = aiKeterangan;
          }
          if (quantityColIndex >= 0) {
            (newRow as any)[`custom_num_${quantityColIndex}`] = res.days ?? 0;
          }
          if (eqForNew && groupCols.length > 0) {
            newRow = applyEquipmentDataToRow(newRow, eqForNew, groupCols) as typeof newRow;
          } else if (defaultEq && groupCols.length > 0 && !eqForNew) {
            newRow = applyEquipmentDataToRow(newRow, defaultEq, groupCols) as typeof newRow;
          }
          next = [...next.slice(0, insertAfter + 1), newRow, ...next.slice(insertAfter + 1)];
          insertAfter += 1;
          resultIdx += 1;
        }
        return next;
      });
      setLastExtractResult(null);
      setLastExtractResults(results);
      setMessage({ type: 'success', text: `${results.length} baris diisi dari ${files.length} gambar. Hasil pembacaan AI bisa dilihat di bawah.` });
    } catch (err: any) {
      const msg = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')
        ? 'Ekstrak timeout (backend/Ollama lama). Coba lagi atau periksa backend.'
        : (err?.response?.data?.message || err?.message || 'Gagal ekstrak dari gambar.');
      setMessage({ type: 'error', text: msg });
    } finally {
      setExtractingByGroup((prev) => ({ ...prev, [groupKey]: false }));
      e.target.value = '';
    }
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setSaving(true);
    setMessage(null);
    const payload: CreateInvoiceRequest = {
      template_id: Number(selectedTemplate.id),
      invoice_number: invoiceNumber.trim() || `INV-${Date.now()}`,
      invoice_date: invoiceDate,
      due_date: dueDate || undefined,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || undefined,
      customer_email: customerEmail.trim() || undefined,
      customer_address: customerAddress.trim() || undefined,
      items: items.map((r) => {
        const customFields = Object.keys(r).filter((k) => k.startsWith('custom_num_')).reduce((acc, k) => ({ ...acc, [k]: (r as Record<string, unknown>)[k] }), {});
        const groupKey = getGroupKey(r);
        const groupCols = getColumnsForGroup(groupKey);
        const itemNameCol = groupCols.find((c) => c.key === 'item_name');
        const displayMode = itemNameCol?.item_display_mode ?? 'name';
        const item_display_name = (r as FormItem).item_display_name ?? (displayMode === 'auto_plate_or_name' ? getItemNameDisplay(r.item_name, equipmentList, 'auto_plate_or_name') : undefined);
        let rowTotal: number | undefined;
        if (groupCols.length > 0) {
          let totalColIdx = groupCols.findIndex((c) => c.use_as_invoice_total);
          if (totalColIdx < 0) {
            totalColIdx = groupCols.length - 1;
            while (totalColIdx >= 0 && groupCols[totalColIdx].key !== 'formula') totalColIdx--;
          }
          if (totalColIdx >= 0) {
            const computed = getComputedFormulaValues(r, groupCols);
            const val = computed[totalColIdx];
            if (val != null && Number.isFinite(val)) rowTotal = val;
          }
        }
        if (rowTotal == null && Number.isFinite(r.total)) rowTotal = r.total;
        return {
          item_name: r.item_name,
          ...(item_display_name !== undefined && item_display_name !== '' ? { item_display_name } : {}),
          description: r.description,
          quantity: r.quantity,
          price: r.price,
          ...(rowTotal != null ? { total: rowTotal } : {}),
          row_date: r.row_date,
          days: r.days,
          bbm_quantity: r.bbm_quantity,
          bbm_unit_price: r.bbm_unit_price,
          equipment_group: (r.equipment_group || '').trim() || undefined,
          ...customFields,
        };
      }),
      tax_percent: taxPercent || undefined,
      notes: notes.trim() || undefined,
      include_bbm_note: includeBbmNote,
      use_bbm_columns: useBbmColumns,
      location: location.trim() || undefined,
      subject: subject.trim() || 'Invoice',
      equipment_name: getEquipmentNameForPayload().trim() || undefined,
      equipment_name_alat_berat: getEquipmentNameAlatBeratForPayload().trim() || undefined,
      equipment_name_dumptruck: getEquipmentNameDumptruckForPayload().trim() || undefined,
      equipment_name_manual: getEquipmentNameManualForPayload().trim() || undefined,
      intro_paragraph: introParagraph.trim() || undefined,
      bank_account: bankAccount.trim() || undefined,
      terbilang_custom: terbilangCustom.trim() || undefined,
      quantity_unit: quantityUnit,
      price_unit_label: priceUnitLabel,
      item_column_label: (itemColumnLabel || 'Keterangan').trim() || undefined,
      group_column_configs: Object.keys(groupColumnConfigs).length > 0 ? JSON.stringify(groupColumnConfigs) : undefined,
    };
    try {
      if (editInvoiceId) {
        await invoiceApi.updateInvoice(editInvoiceId, payload);
        setMessage({ type: 'success', text: 'Invoice berhasil diperbarui.' });
      } else {
        await invoiceApi.createInvoice(payload);
        setMessage({ type: 'success', text: 'Invoice berhasil dibuat.' });
      }
      setEditInvoiceId(null);
      setActiveTab('list');
      fetchInvoices();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Gagal menyimpan invoice.';
      console.error('Error saving invoice:', err?.response?.data || err);
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvoice = async (id: number | string) => {
    if (!confirm('Hapus invoice ini?')) return;
    setDeletingInvoiceId(id);
    try {
      await invoiceApi.deleteInvoice(id);
      setDeletingInvoiceId(null);
      setPreviewInvoice(null);
      setSelectedInvoiceIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      fetchInvoices();
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const handleBulkDeleteInvoices = async () => {
    const ids = Array.from(selectedInvoiceIds);
    if (ids.length === 0) return;
    if (!confirm(`Hapus ${ids.length} invoice terpilih?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(ids.map((id) => invoiceApi.deleteInvoice(id)));
      setSelectedInvoiceIds(new Set());
      setPreviewInvoice(null);
      setMessage({ type: 'success', text: `${ids.length} invoice berhasil dihapus.` });
      fetchInvoices();
    } catch (e: unknown) {
      setMessage({ type: 'error', text: (e as Error)?.message || 'Gagal menghapus sebagian invoice.' });
      fetchInvoices();
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelectInvoice = (id: number | string) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllInvoices = () => {
    if (selectedInvoiceIds.size === invoices.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(invoices.map((inv) => inv.id!).filter((id): id is number | string => id != null)));
    }
  };

  const openTemplateModal = (template?: InvoiceTemplate) => {
    type TemplateOpts = {
      item_columns?: TemplateItemColumn[];
      show_date?: boolean;
      show_no?: boolean;
      show_total?: boolean;
      show_bank_account?: boolean;
      use_bbm_columns?: boolean;
      include_bbm_note?: boolean;
      quantity_unit?: string;
      price_unit_label?: string;
      item_column_label?: string;
      default_notes?: string;
      item_row_height?: 'compact' | 'normal' | 'relaxed';
    };
    if (template) {
      setEditingTemplateId(Number(template.id));
      let itemColumns = DEFAULT_ITEM_COLUMNS;
      const rawOpt = template.options;
      let opts: TemplateOpts = {};
      if (rawOpt != null) {
        const parsed =
          typeof rawOpt === 'string'
            ? (() => {
                try {
                  return JSON.parse(rawOpt) as TemplateOpts;
                } catch {
                  return {};
                }
              })()
            : (rawOpt as TemplateOpts);
        if (parsed?.item_columns?.length) itemColumns = parsed.item_columns;
        opts = parsed;
      }
      setTemplateForm({
        name: template.name,
        description: template.description || '',
        layout: template.layout || 'standard',
        document_type: template.document_type || 'invoice',
        default_intro: template.default_intro || '',
        signature_count: template.signature_count === 2 ? 2 : 1,
        options: {
          item_columns: itemColumns,
          show_date: opts.show_date !== false,
          show_no: opts.show_no !== false,
          show_total: opts.show_total !== false,
          show_bank_account: opts.show_bank_account !== false,
          use_bbm_columns: opts.use_bbm_columns ?? false,
          include_bbm_note: opts.include_bbm_note ?? false,
          quantity_unit: opts.quantity_unit || 'hari',
          price_unit_label: opts.price_unit_label || 'Harga/Hari',
          item_column_label: opts.item_column_label || (opts.item_columns && opts.item_columns[0]?.label) || 'Keterangan',
          default_notes: (opts.default_notes as string) || '',
          item_row_height: opts.item_row_height || 'normal',
        },
      });
    } else {
      setEditingTemplateId(null);
      setTemplateForm({
        name: '',
        description: '',
        layout: 'standard',
        document_type: 'invoice',
        default_intro: '',
        signature_count: 1,
        options: {
          item_columns: [...DEFAULT_ITEM_COLUMNS],
          show_date: true,
          show_no: true,
          show_total: true,
          show_bank_account: true,
          use_bbm_columns: false,
          include_bbm_note: false,
          quantity_unit: 'hari',
          price_unit_label: 'Harga/Hari',
          item_column_label: 'Keterangan',
          default_notes: '',
          item_row_height: 'normal',
        },
      });
    }
    setShowTemplateModal(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) return;
    try {
      const payload = {
        name: templateForm.name,
        description: templateForm.description,
        layout: templateForm.layout,
        document_type: templateForm.document_type,
        default_intro: templateForm.default_intro,
        signature_count: templateForm.signature_count,
        options: templateForm.options,
      };
      if (editingTemplateId) {
        await invoiceApi.updateTemplate(editingTemplateId, payload);
      } else {
        await invoiceApi.createTemplate(payload);
      }
      setShowTemplateModal(false);
      invoiceApi.getTemplates().then(setTemplates);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Hapus template ini?')) return;
    setDeletingTemplateId(id);
    try {
      await invoiceApi.deleteTemplate(id);
      invoiceApi.getTemplates().then(setTemplates);
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handleDuplicateTemplate = async (t: InvoiceTemplate) => {
    const id = Number(t.id);
    setDuplicatingTemplateId(id);
    try {
      const rawOpt = t.options;
      const optionsObj =
        rawOpt == null
          ? undefined
          : typeof rawOpt === 'string'
            ? (() => {
                try {
                  return JSON.parse(rawOpt) as Record<string, unknown>;
                } catch {
                  return undefined;
                }
              })()
            : (rawOpt as Record<string, unknown>);
      await invoiceApi.createTemplate({
        name: `Salinan ${t.name}`,
        description: t.description,
        layout: t.layout,
        document_type: t.document_type,
        default_intro: t.default_intro,
        signature_count: t.signature_count,
        options: optionsObj,
      });
      invoiceApi.getTemplates().then(setTemplates);
    } catch (e) {
      console.error(e);
    } finally {
      setDuplicatingTemplateId(null);
    }
  };

  const openCustomerModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomerId(customer.id);
      setCustomerForm({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
      });
    } else {
      setEditingCustomerId(null);
      setCustomerForm({ name: '', phone: '', email: '', address: '' });
    }
    setShowCustomerModal(true);
  };

  const saveCustomer = async () => {
    if (!customerForm.name.trim()) return;
    try {
      if (editingCustomerId) {
        await customerApi.update(editingCustomerId, customerForm);
      } else {
        await customerApi.create(customerForm);
      }
      setShowCustomerModal(false);
      fetchCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm('Hapus data pelanggan ini?')) return;
    setDeletingCustomerId(id);
    try {
      await customerApi.delete(id);
      fetchCustomers();
    } finally {
      setDeletingCustomerId(null);
    }
  };

  const marginLeft = isCollapsed ? 'ml-20' : 'ml-64';

  return (
    <div className={`flex-1 transition-all duration-300 ${marginLeft}`}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Invoice</h1>
            <p className="text-gray-500">Buat, kelola template, dan cetak invoice</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { id: 'list', label: 'Daftar Invoice', icon: <FiList /> },
            { id: 'create', label: 'Buat Invoice', icon: <FiPlus /> },
            { id: 'templates', label: 'Kelola Template', icon: <FiGrid /> },
            { id: 'customers', label: 'Data Pelanggan', icon: <FiUsers /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.type === 'info'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {(lastExtractResult || (lastExtractResults && lastExtractResults.length > 0)) && (
          <div className="mb-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-800">
            <div className="font-medium text-sm mb-2">Hasil pembacaan AI (dari API)</div>
            {lastExtractResult && (
              <pre className="text-xs overflow-x-auto bg-white p-3 rounded border border-slate-200">
                {JSON.stringify({ row_date: lastExtractResult.row_date, days: lastExtractResult.days, unit: lastExtractResult.unit || 'hari', item_name: lastExtractResult.item_name || '(kosong)' }, null, 2)}
              </pre>
            )}
            {lastExtractResults && lastExtractResults.length > 0 && (
              <pre className="text-xs overflow-x-auto bg-white p-3 rounded border border-slate-200 max-h-48 overflow-y-auto">
                {JSON.stringify(lastExtractResults.map((r) => ({ row_date: r.row_date, days: r.days, unit: r.unit || 'hari', item_name: r.item_name || '(kosong)' })), null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Tab: Daftar Invoice */}
        {activeTab === 'list' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
              <input
                type="text"
                placeholder="Cari nomor / customer..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-48 text-sm"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                title="Tanggal mulai"
              />
              <span className="text-gray-400">–</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                title="Tanggal akhir"
              />
              <select
                value={filterSortKey}
                onChange={(e) => {
                  setFilterSortKey(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                title="Urutkan"
              >
                {INVOICE_SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => { setPagination((p) => ({ ...p, page: 1 })); fetchInvoices(); }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
              >
                Terapkan
              </button>
              {selectedInvoiceIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDeleteInvoices}
                  disabled={bulkDeleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <FiTrash2 /> Hapus terpilih ({selectedInvoiceIds.size})
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {listLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={invoices.length > 0 && selectedInvoiceIds.size === invoices.length}
                            onChange={toggleSelectAllInvoices}
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            title="Pilih semua"
                          />
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28">No</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Template</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50">
                          <td className="px-2 py-3 text-center">
                            {inv.id != null && (
                              <input
                                type="checkbox"
                                checked={selectedInvoiceIds.has(inv.id)}
                                onChange={() => toggleSelectInvoice(inv.id!)}
                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                              />
                            )}
                          </td>
                          <td className="px-2 py-3 text-sm text-gray-900 w-28 min-w-0 truncate max-w-[7rem]" title={inv.invoice_number}>{inv.invoice_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{formatDateOnly(inv.invoice_date || '')}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{inv.customer_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{inv.template?.name ?? templates.find((t) => Number(t.id) === Number(inv.template_id))?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                                inv.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                inv.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-wrap gap-2 justify-center">
                            <button
                              type="button"
                              onClick={async () => {
                                const id = inv.id;
                                if (id == null) { setPreviewInvoice(inv); return; }
                                const full = await invoiceApi.getInvoiceById(id);
                                setPreviewInvoice(full || inv);
                              }}
                              className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1"
                            >
                              <FiEye /> Preview
                            </button>
                            <InvoicePDFExportButton invoice={inv} className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1" />
                            <button
                              type="button"
                              onClick={() => loadInvoiceForEdit(Number(inv.id))}
                              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                            >
                              <FiEdit2 /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoice(Number(inv.id))}
                              disabled={deletingInvoiceId === inv.id}
                              className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1 disabled:opacity-50"
                            >
                              <FiTrash2 /> Hapus
                            </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!listLoading && invoices.length === 0 && (
                <div className="text-center py-12 text-gray-500">Belum ada invoice.</div>
              )}
            </div>

            <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={!pagination.has_prev}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
              >
                Sebelumnya
              </button>
              <span className="text-gray-600 text-sm">
                Halaman {pagination.page} dari {pagination.total_pages} ({pagination.total} data)
              </span>
              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={!pagination.has_next}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
              >
                Selanjutnya
              </button>
            </div>
          </>
        )}

        {/* Tab: Buat Invoice */}
        {activeTab === 'create' && (
          <>
            {step === 'pick-template' && (
              <>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Pilih Template</h2>
                {loadingTemplates ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTemplate(t)}
                        className="flex flex-col items-start p-5 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-400 hover:shadow-md transition-all text-left"
                      >
                        <div className="p-3 rounded-lg bg-orange-50 text-orange-600 mb-3">
                          <FiFileText className="w-8 h-8" />
                        </div>
                        <span className="font-semibold text-gray-800">{t.name}</span>
                        {t.description && <span className="text-sm text-gray-500 mt-1">{t.description}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 'fill-form' && selectedTemplate && (
              <form onSubmit={handleSubmitInvoice} className="space-y-6">
                <input ref={extractRowInputRef} type="file" accept="image/*" className="hidden" onChange={handleExtractRowFromImage} />
                <input ref={extractMultiRowInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleExtractMultiRowsFromImages} />
                <div className="flex items-center justify-between">
                  <button type="button" onClick={handleBackToTemplates} className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                    ← Ganti template
                  </button>
                  <span className="text-sm text-gray-500">
                    Template: <strong>{selectedTemplate.name}</strong>
                    {editInvoiceId && ' (Edit)'}
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Untuk isi data dari nota menggunakan AI: gunakan ikon 📷 di kolom Tanggal per baris, atau tombol <strong>Upload banyak gambar</strong> di tiap unit. AI akan otomatis mendeteksi kolom apa saja yang ada (misalnya: Tanggal, Jam, Harga/Jam atau Tanggal, Hari, Harga/Hari) dan mengekstrak data sesuai kolom tersebut. Baris kosong unit akan diisi; ganti unit lalu upload lagi untuk unit lain. Harga &amp; keterangan dari Nama unit (bisa diedit per baris). Jika pakai Gemini (free tier), ada jeda antargambar agar tidak kena rate limit; untuk banyak gambar tanpa batas gunakan Ollama (<code className="text-xs bg-gray-100 px-1">EXTRACT_PROVIDER=deepseek</code> di backend).</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Informasi {documentTypeLabel}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nomor {documentTypeLabel}</label>
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="INV-001"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                      <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo (opsional)</label>
                      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Data Customer</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pilih pelanggan (dari data sebelumnya)</label>
                      <select
                        value=""
                        onChange={(e) => {
                          const idx = e.target.value === '' ? -1 : parseInt(e.target.value, 10);
                          if (idx >= 0 && customerSuggestions[idx]) {
                            const c = customerSuggestions[idx];
                            setCustomerName(c.customer_name || '');
                            setCustomerPhone(c.customer_phone || '');
                            setCustomerEmail(c.customer_email || '');
                            setCustomerAddress(c.customer_address || '');
                          }
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 bg-white"
                      >
                        <option value="">— Ketik manual / pelanggan baru —</option>
                        {customerSuggestions.map((c, i) => (
                          <option key={i} value={i}>{c.customer_name}{c.customer_phone ? ` (${c.customer_phone})` : ''}</option>
                        ))}
                        {loadingCustomerSuggestions && <option disabled>Memuat...</option>}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        placeholder="Nama pelanggan"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                      <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email (opsional)</label>
                      <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@example.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                      <textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} rows={2} placeholder="Alamat lengkap" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Opsi BBM & Format (sesuai template)</h3>
                  <p className="text-xs text-gray-500">Format dan opsi berikut mengikuti template &quot;{selectedTemplate.name}&quot;. Bisa diubah untuk dokumen ini jika perlu.</p>
                  {templateHasBbm ? (
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={includeBbmNote} onChange={(e) => setIncludeBbmNote(e.target.checked)} className="rounded border-gray-300" />
                        <span className="text-sm">Sudah termasuk BBM (catatan di bawah total)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={useBbmColumns} onChange={(e) => setUseBbmColumns(e.target.checked)} className="rounded border-gray-300" />
                        <span className="text-sm">Tampilkan kolom BBM per baris (Bbm Jerigen, Harga/Bbm)</span>
                      </label>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Template ini tidak menggunakan BBM.</p>
                  )}
                  {!useTemplateColumns && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Satuan quantity & harga</label>
                    <select
                      value={quantityUnit}
                      onChange={(e) => {
                        const v = e.target.value as 'hari' | 'jam' | 'unit' | 'jerigen' | 'volume';
                        setQuantityUnit(v);
                        setPriceUnitLabel(v === 'jam' ? 'Harga/Jam' : v === 'unit' ? 'Harga/Unit' : v === 'jerigen' ? 'Harga/Jerigen' : v === 'volume' ? 'Harga/Volume' : 'Harga/Hari');
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="hari">Hari (Harga/Hari)</option>
                      <option value="jam">Jam (Harga/Jam)</option>
                      <option value="unit">Unit (Harga/Unit)</option>
                      <option value="jerigen">Jerigen (Harga/Jerigen)</option>
                      <option value="volume">Volume (Harga/Volume)</option>
                    </select>
                  </div>
                  )}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Alat berat / kendaraan (untuk kalimat pembuka otomatis)</label>
                    <div className="space-y-3 w-full max-w-xl">
                      <div>
                        <span className="text-sm font-medium text-gray-600 block mb-1">Alat berat</span>
                        <div className="flex flex-wrap gap-2">
                          {equipmentNamesForKeterangan.map((name) => (
                            <span key={name} className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg text-sm">
                              {name}
                              <button type="button" onClick={() => setEquipmentNames((prev) => prev.filter((n) => n !== name))} className="text-orange-600 hover:text-orange-800" aria-label="Hapus">×</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 items-center mt-2">
                          <select
                            value=""
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v && !equipmentNames.includes(v)) setEquipmentNames((prev) => [...prev, v]);
                              e.target.value = '';
                            }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">+ Pilih dari daftar</option>
                            {equipmentList.filter((e) => (e.type === 'alat_berat' || e.type === 'dump_truck') && !equipmentNames.includes(e.name)).map((e) => (
                              <option key={e.id} value={e.name}>{e.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={newEquipmentInput}
                            onChange={(e) => setNewEquipmentInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = newEquipmentInput.trim(); if (v && !equipmentNames.includes(v)) { setEquipmentNames((prev) => [...prev, v]); setNewEquipmentInput(''); } } }}
                            placeholder="Ketik lalu Enter atau Tambah"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const v = newEquipmentInput.trim();
                              if (v && !equipmentNames.includes(v)) { setEquipmentNames((prev) => [...prev, v]); setNewEquipmentInput(''); }
                            }}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                          >
                            Tambah
                          </button>
                        </div>
                      </div>
                      {getEquipmentNameForPayload() && (
                        <p className="text-xs text-gray-500">Kalimat pembuka: &quot;...berupa {getEquipmentNameForPayload()} dilokasi...&quot;</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi (untuk kalimat pembuka)</label>
                      <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Navia Avenue, Nongsa" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Perihal</label>
                      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Invoice" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">No Rekening & Bank</label>
                      <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="1090021332523 (PT INDIRA MAJU BERSAMA) Bank Mandiri" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="sm:col-span-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Paragraf pembuka (opsional, override)</label>
                      <div className="relative">
                        <textarea
                          ref={introParagraphTextareaRef}
                          value={introParagraph}
                          onChange={(e) => {
                            const v = e.target.value;
                            const start = e.target.selectionStart ?? 0;
                            setIntroParagraph(v);
                            const textBefore = v.slice(0, start);
                            const lastAt = textBefore.lastIndexOf('@');
                            if (lastAt !== -1) {
                              const word = textBefore.slice(lastAt);
                              if (word === '@' || /^@[a-z]*$/i.test(word)) {
                                setShowIntroSuggestions(true);
                                setIntroSuggestionAt(lastAt);
                                introSuggestionEndRef.current = start;
                              } else setShowIntroSuggestions(false);
                            } else setShowIntroSuggestions(false);
                          }}
                          onBlur={() => setTimeout(() => setShowIntroSuggestions(false), 150)}
                          rows={2}
                          placeholder="Kosongkan agar pakai kalimat otomatis. Ketik @ untuk pilih: @alatberat, @alatberatmanual, @dumptruck, @lokasi"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                        />
                        {showIntroSuggestions && (() => {
                          const end = introSuggestionEndRef.current ?? introSuggestionAt + 1;
                          const word = introParagraph.slice(introSuggestionAt, end);
                          const list = word === '@' ? INTRO_PLACEHOLDERS : INTRO_PLACEHOLDERS.filter((p) => p.toLowerCase().startsWith(word.toLowerCase()));
                          return (
                            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                              {list.map((ph) => (
                                <button
                                  key={ph}
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
                                  onMouseDown={(ev) => {
                                    ev.preventDefault();
                                    const endPos = introSuggestionEndRef.current ?? introSuggestionAt + 1;
                                    const newVal = introParagraph.slice(0, introSuggestionAt) + ph + introParagraph.slice(endPos);
                                    setIntroParagraph(newVal);
                                    setShowIntroSuggestions(false);
                                    setTimeout(() => {
                                      introParagraphTextareaRef.current?.focus();
                                      introParagraphTextareaRef.current?.setSelectionRange(introSuggestionAt + ph.length, introSuggestionAt + ph.length);
                                    }, 0);
                                  }}
                                >
                                  {ph}
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    {templateShowBankAccount && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">No Rekening & Bank</label>
                        <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="1090021332523 (PT INDIRA MAJU BERSAMA) Bank Mandiri" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Terbilang (opsional, custom)</label>
                      <textarea value={terbilangCustom} onChange={(e) => setTerbilangCustom(e.target.value)} rows={2} placeholder="Kosongkan untuk pakai terbilang otomatis dari total. Isi manual jika nominal tidak bisa di-generate (contoh: Sembilan Ratus Miliar ... Rupiah)" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 border-b pb-2">
                    <h3 className="font-semibold text-gray-800">Item / Jasa</h3>
                    {!useTemplateColumns && (
                      <>
                        <label className="text-sm text-gray-600">Label kolom:</label>
                        <input type="text" value={itemColumnLabel} onChange={(e) => setItemColumnLabel(e.target.value)} placeholder="Keterangan" className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500" />
                      </>
                    )}
                  </div>
                  {orderedGroupKeys.map((groupKey, groupIdx) => {
                    const indices = groupIndices[groupKey] || [];
                    const sortedIndices = [...indices].sort((a, b) => {
                      const da = (items[a].row_date || '').trim();
                      const db = (items[b].row_date || '').trim();
                      if (!da) return 1;
                      if (!db) return -1;
                      return da < db ? -1 : da > db ? 1 : 0;
                    });
                    const isLastGroup = groupIdx === orderedGroupKeys.length - 1;
                    const displayName = groupKey === '__default__' ? (items.find((r) => getGroupKey(r) === '__default__')?.equipment_group ?? '') || 'Unit 1' : groupKey;
                    return (
                      <div key={groupIdx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-sm font-medium text-gray-700">Nama unit:</label>
                          <select
                            value={equipmentNamesForKeterangan.includes(displayName) ? displayName : ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v) updateGroupName(groupKey, v);
                              else updateGroupName(groupKey, ' ');
                            }}
                            className="min-w-[12rem] border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
                          >
                            <option value="">— Lainnya (ketik manual) —</option>
                            {equipmentNamesForKeterangan.map((name, i) => (
                              <option key={i} value={name}>{name}</option>
                            ))}
                          </select>
                          {equipmentNamesForKeterangan.length === 0 && (
                            <span className="text-xs text-amber-600">Pilih alat di atas dulu</span>
                          )}
                          {!equipmentNamesForKeterangan.includes(displayName) && (
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) => updateGroupName(groupKey, e.target.value)}
                              placeholder="Ketik nama unit"
                              className="min-w-[10rem] border border-orange-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 bg-orange-50/50"
                            />
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => addItemEmptyForGroup(groupKey)} className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm font-medium border border-gray-300 rounded px-2 py-1">
                              <FiPlus /> Tambah baris kosong
                            </button>
                            <button type="button" onClick={() => addItemCopyFromAboveForGroup(groupKey)} className="flex items-center gap-1 text-orange-600 hover:text-orange-700 text-sm font-medium border border-orange-300 rounded px-2 py-1">
                              <FiPlus /> Copy dari baris atas
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                extractMultiRowForGroupRef.current = groupKey;
                                extractMultiRowInputRef.current?.click();
                              }}
                              disabled={!!extractingByGroup[groupKey]}
                              className="flex items-center gap-1 text-orange-600 hover:text-orange-700 text-sm font-medium border border-orange-300 rounded px-2 py-1 disabled:opacity-50"
                            >
                              {extractingByGroup[groupKey] ? 'Memproses...' : (
                                <>📷 Upload banyak gambar (isi baris kosong unit ini)</>
                              )}
                            </button>
                            {useTemplateColumns && (
                              <button
                                type="button"
                                onClick={() => openEditColumnsForGroup(groupKey)}
                                className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium border border-purple-300 rounded px-2 py-1"
                                title="Edit nama kolom dan rumus untuk unit ini"
                              >
                                <FiEdit2 /> Edit Kolom Unit Ini
                              </button>
                            )}
                            {isLastGroup && (
                              <button type="button" onClick={addDifferentUnit} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                                <FiPlus /> Tambah Unit Berbeda
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          {(() => {
                            const groupColumns = getColumnsForGroup(groupKey);
                            const displayGroupColumns = groupColumns.filter((c) => !(c.key === 'total' && !templateShowTotal));
                            const useGroupTemplateColumns = displayGroupColumns.length > 0;
                            const itemRowPad = selectedTemplate?.options?.item_row_height === 'compact' ? 'py-1' : selectedTemplate?.options?.item_row_height === 'relaxed' ? 'py-3' : 'py-2';
                            return (
                          <table className="w-full">
                            <thead>
                              <tr className="text-left text-sm text-gray-600 border-b">
                                {templateShowNo && <th className="pb-2 pr-2 w-10">No</th>}
                                <th className="pb-2 pr-2 w-16">Gambar</th>
                                {templateShowDate && !useGroupTemplateColumns && <th className="pb-2 pr-2">Tanggal</th>}
                                {useGroupTemplateColumns ? (
                                  displayGroupColumns.map((col, colIdx) => (
                                    <th key={`item-col-${colIdx}`} className={`pb-2 pr-2 ${getHeaderAlignClass(col)}`}>{(col.label || '').trim() || col.key}{col.key === 'item_name' ? ' *' : ''}</th>
                                  ))
                                ) : useBbmColumns ? (
                                  <>
                                    <th className="pb-2 pr-2">Keterangan</th>
                                    <th className="pb-2 pr-2 w-20">{quantityUnit === 'jam' ? 'Jam' : quantityUnit === 'unit' ? 'Unit' : quantityUnit === 'jerigen' ? 'Jerigen' : 'Hari'}</th>
                                    <th className="pb-2 pr-2 w-28">{priceUnitLabel}</th>
                                    <th className="pb-2 pr-2 w-20">Bbm (Jerigen)</th>
                                    <th className="pb-2 pr-2 w-28">Harga/Bbm</th>
                                    {templateShowTotal && <th className="pb-2 pr-2 w-28">Jumlah</th>}
                                  </>
                                ) : (
                                  <>
                                    <th className="pb-2 pr-2">{(itemColumnLabel || 'Keterangan').trim() || 'Keterangan'} *</th>
                                    <th className="pb-2 pr-2 w-28">Satuan / Jumlah</th>
                                    <th className="pb-2 pr-2 w-32">Harga</th>
                                    {templateShowTotal && <th className="pb-2 pr-2 w-28">Jumlah</th>}
                                  </>
                                )}
                                <th className="pb-2 w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedIndices.map((_, rowNum) => {
                          const index = sortedIndices[rowNum];
                          const row = items[index];
                          if (!row) return null;
                          const days = row.days ?? 0;
                          const price = row.price ?? 0;
                          const bbmQty = row.bbm_quantity ?? 0;
                          const bbmPrice = row.bbm_unit_price ?? 0;
                          const isFixedRow = useBbmColumns && days === 0 && price === 0 && bbmQty === 0;
                          const lineTotal = useGroupTemplateColumns
                            ? (row.quantity ?? row.days ?? 0) * (row.price ?? 0) + (row.bbm_quantity ?? 0) * (row.bbm_unit_price ?? 0)
                            : useBbmColumns
                              ? (days * price + bbmQty * bbmPrice) || (isFixedRow ? row.price || 0 : 0)
                              : (row.quantity || 0) * (row.price || 0);
                          const itemCols = groupColumns || [];
                          const rowComputed = useGroupTemplateColumns && itemCols.length > 0 ? getComputedFormulaValues(row, itemCols) : {};
                          return (
                            <tr key={index} className="border-b border-gray-100">
                              {templateShowNo && <td className={`${itemRowPad} pr-2 text-center text-gray-600`}>{rowNum + 1}</td>}
                              <td className={`${itemRowPad} pr-2 align-top`}>
                                {row.row_image ? (
                                  <a href={row.row_image} target="_blank" rel="noopener noreferrer" className="inline-block rounded border border-gray-200 overflow-hidden bg-gray-100" title="Lihat gambar nota">
                                    <img src={row.row_image} alt="" className="w-12 h-12 object-cover" />
                                  </a>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </td>
                              {useGroupTemplateColumns ? (
                                displayGroupColumns.map((col, colIdx) => {
                                  const k = col.key;
                                  const cellKey = `item-col-${colIdx}`;
                                  const cellAlign = getContentAlignClass(col);
                                  if (k === 'no') {
                                    return (<td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign} text-gray-600`}>{rowNum + 1}</td>);
                                  }
                                  if (k === 'formula') {
                                    const f = (col.formula || '').trim();
                                    const singleVar = /^(quantity|days|price|bbm_quantity|bbm_unit_price)$/.test(f);
                                    const labelTrim = (col.label || '').trim();
                                    const selfRefOrEmpty = f === '' || f === labelTrim;
                                    const lbl = labelTrim.toLowerCase().replace(/\s+/g, '');
                                    const isBbmCol = lbl === 'bbm';
                                    const isHargaBbmCol = /harga\s*\/\s*bbm/.test(lbl) || lbl === 'harga/bbm';
                                    const isQuantityLikeCol = lbl === 'hari' || lbl === 'days' || lbl === 'qty' || lbl === 'quantity' || lbl === 'jam' || lbl === 'unit' || lbl === 'jerigen' || lbl === 'volume';
                                    const isPriceCol = (lbl.includes('harga') || lbl.includes('price')) && !isHargaBbmCol;
                                    if (singleVar || (selfRefOrEmpty && (isBbmCol || isHargaBbmCol || isQuantityLikeCol || isPriceCol))) {
                                      if (f === 'quantity' || f === 'days' || (selfRefOrEmpty && !isBbmCol && !isHargaBbmCol && isQuantityLikeCol)) {
                                        const isDays = f === 'days' || lbl === 'hari' || lbl === 'days';
                                        return (
                                          <td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}>
                                            <input type="number" min={0} step="any" value={isDays ? (row.days ?? '') : (row.quantity ?? '')} onChange={(e) => { const v = parseFloat(String(e.target.value).replace(',', '.')); const num = Number.isFinite(v) && v >= 0 ? v : 0; updateItem(index, isDays ? 'days' : 'quantity', num); updateItem(index, isDays ? 'quantity' : 'days', num); }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                          </td>
                                        );
                                      }
                                      if (f === 'price' || (selfRefOrEmpty && isPriceCol)) {
                                        return (<td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}><input type="number" min={0} step="any" value={row.price ?? ''} onChange={(e) => updateItem(index, 'price', parseFloat(String(e.target.value).replace(',', '.')) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" placeholder={priceUnitLabel} /></td>);
                                      }
                                      if (f === 'bbm_quantity' || (selfRefOrEmpty && isBbmCol)) {
                                        return (<td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}><input type="number" min={0} step="any" value={row.bbm_quantity ?? ''} onChange={(e) => updateItem(index, 'bbm_quantity', parseFloat(String(e.target.value).replace(',', '.')) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" placeholder="BBM" /></td>);
                                      }
                                      if (f === 'bbm_unit_price' || (selfRefOrEmpty && isHargaBbmCol)) {
                                        return (<td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}><input type="number" min={0} step="any" value={row.bbm_unit_price ?? ''} onChange={(e) => updateItem(index, 'bbm_unit_price', parseFloat(String(e.target.value).replace(',', '.')) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" placeholder="Harga/BBM" /></td>);
                                      }
                                    }
                                    if (!col.formula && !(selfRefOrEmpty && (isBbmCol || isHargaBbmCol))) return <td key={cellKey} className={`${itemRowPad} pr-2 text-gray-400 ${cellAlign}`}>—</td>;
                                    const sourceIndex = itemCols.findIndex((c) => c === col);
                                    const val = sourceIndex >= 0 ? (rowComputed[sourceIndex] ?? NaN) : evaluateFormula(col.formula, row);
                                    const formulaFmt = col.format ?? 'rupiah';
                                    return (<td key={cellKey} className={`${itemRowPad} pr-2 text-sm text-gray-700 bg-gray-50/50 ${cellAlign}`}>{Number.isFinite(val) ? formatNumberByColumn({ format: formulaFmt }, val) : '—'}</td>);
                                  }
                                  if (k === 'row_date') {
                                    return (
                                      <td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}>
                                        <div className="flex items-center gap-1 relative">
                                          <input type="text" value={row.row_date ? formatDateToIndonesian(row.row_date) : ''} readOnly placeholder="Klik 📅 untuk pilih tanggal" className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 bg-gray-50/80" />
                                          <input type="date" value={row.row_date || ''} ref={(el) => { dateInputRefs.current[index] = el; }} className="absolute left-0 opacity-0 w-0 h-0 overflow-hidden" onChange={(e) => { const v = e.target.value; if (v) updateItem(index, 'row_date', v); }} />
                                          <button type="button" onClick={() => { const inp = dateInputRefs.current[index]; if (inp) (typeof (inp as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function' ? (inp as HTMLInputElement & { showPicker?: () => void }).showPicker!() : inp.click()); }} className="p-1.5 text-gray-500 hover:text-orange-600 rounded shrink-0" title="Pilih tanggal"><FiCalendar className="w-4 h-4" /></button>
                                        </div>
                                      </td>
                                    );
                                  }
                                  if (k === 'item_name') {
                                    const inList = equipmentNamesForKeterangan.includes(row.item_name);
                                    const isCustom = (row.item_name || '') && !inList;
                                    const hasAiResult = !!(row as FormItem).item_display_name;
                                    const useAiDisplay = !!(row as FormItem).use_ai_display;
                                    const displayMode = col.item_display_mode ?? 'name';
                                    const selectValue = useAiDisplay ? '__ai__' : (inList ? row.item_name : (isCustom ? '__custom__' : ''));
                                    const showHasilAiBlock = useAiDisplay;
                                    return (
                                      <td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}>
                                        <div className="flex flex-col gap-1">
                                          <select
                                            value={selectValue}
                                            onChange={(e) => {
                                              const v = e.target.value;
                                              if (v === '__custom__') {
                                                const alreadyCustom = row.item_name && !equipmentNamesForKeterangan.includes(row.item_name);
                                                setItems((prev) => prev.map((r, i) => i !== index ? r : { ...r, item_name: alreadyCustom ? row.item_name : ' ', item_display_name: '', use_ai_display: false }));
                                              } else if (v === '__ai__') {
                                                setItems((prev) => prev.map((r, i) => i !== index ? r : { ...r, item_name: equipmentNamesForKeterangan[0] || r.item_name, use_ai_display: true }));
                                              } else {
                                                handleSelectItemName(index, v);
                                              }
                                            }}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
                                          >
                                            <option value="">— Pilih keterangan —</option>
                                            <option value="__ai__">{hasAiResult ? `${(row as FormItem).item_display_name} (Hasil AI)` : '— Hasil AI (pakai bila ada hasil) —'}</option>
                                            {equipmentNamesForKeterangan.map((name, i) => (<option key={i} value={name}>{getItemNameDisplay(name, equipmentList, displayMode)}</option>))}
                                            <option value="__custom__">— Lainnya (ketik manual) —</option>
                                          </select>
                                          {isCustom && <input type="text" value={row.item_name} onChange={(e) => updateItem(index, 'item_name', e.target.value)} placeholder="Ketik keterangan" className="w-full border border-orange-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 bg-orange-50/50" />}
                                          {showHasilAiBlock && (
                                            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1" title="Nilai ini yang dipakai untuk Keterangan (dari AI atau diedit)">
                                              <span className="block mb-0.5">Hasil AI (nilai dipakai):</span>
                                              <div className="flex gap-1 items-center">
                                                <input
                                                  type="text"
                                                  value={(row as FormItem).item_display_name ?? ''}
                                                  onChange={(e) => setItems((prev) => prev.map((r, i) => i !== index ? r : { ...r, item_display_name: e.target.value }))}
                                                  placeholder="Upload gambar atau ketik (mis. BP 8814 EO)"
                                                  className="flex-1 min-w-0 text-sm border border-emerald-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-emerald-500"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setItems((prev) => prev.map((r, i) => i !== index ? r : { ...r, item_display_name: undefined })); }}
                                                  title="Batal pakai hasil AI (kosongkan)"
                                                  className="shrink-0 text-xs px-2 py-1 rounded border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100"
                                                >
                                                  Batal AI
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  }
                                  if (k === 'description') {
                                    return (<td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}><input type="text" value={row.description ?? ''} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="String/huruf" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" /></td>);
                                  }
                                  if (k === 'quantity' || k === 'days') {
                                    return (
                                      <td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}>
                                        <div className="flex gap-1 items-center">
                                          <select value={row.quantity_unit ?? quantityUnit} onChange={(e) => updateItem(index, 'quantity_unit', e.target.value as 'hari' | 'jam' | 'unit' | 'jerigen' | 'volume')} className="shrink-0 w-16 border border-gray-300 rounded px-1.5 py-1.5 text-xs focus:ring-2 focus:ring-orange-500">
                                            <option value="hari">Hari</option><option value="jam">Jam</option><option value="unit">Unit</option><option value="jerigen">Jerigen</option><option value="volume">Volume</option>
                                          </select>
                                          <input type="number" min={0} step="any" value={k === 'days' ? (row.days ?? '') : (row.quantity ?? '')} onChange={(e) => { const v = parseFloat(String(e.target.value).replace(',', '.')) >= 0 ? parseFloat(String(e.target.value).replace(',', '.')) : 0; updateItem(index, k === 'days' ? 'days' : 'quantity', v); updateItem(index, k === 'days' ? 'quantity' : 'days', v); }} className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                        </div>
                                      </td>
                                    );
                                  }
                                  if (k === 'price') {
                                    return (<td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}><input type="number" min={0} step="any" value={row.price ?? ''} onChange={(e) => updateItem(index, 'price', parseFloat(String(e.target.value).replace(',', '.')) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" placeholder={priceUnitLabel} /></td>);
                                  }
                                  if (k === 'bbm_quantity') {
                                    return (<td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}><input type="number" min={0} step="any" value={row.bbm_quantity ?? ''} onChange={(e) => updateItem(index, 'bbm_quantity', parseFloat(String(e.target.value).replace(',', '.')) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" placeholder="BBM" /></td>);
                                  }
                                  if (k === 'bbm_unit_price') {
                                    return (<td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}><input type="number" min={0} step="any" value={row.bbm_unit_price ?? ''} onChange={(e) => updateItem(index, 'bbm_unit_price', parseFloat(String(e.target.value).replace(',', '.')) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" placeholder="Harga/BBM" /></td>);
                                  }
                                  if (k === 'number') {
                                    const fieldKey = `custom_num_${colIdx}`;
                                    const val = (row as Record<string, unknown>)[fieldKey];
                                    const isAuto = col.source && col.source !== 'manual';
                                    const numVal = val != null && val !== '' ? Number(val) : NaN;
                                    const fmt = col.format ?? 'number';
                                    return (
                                      <td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}>
                                        {isAuto ? (
                                          <span className="text-sm text-gray-700">{formatNumberByColumn(col, numVal)}</span>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            {fmt === 'rupiah' && <span className="text-gray-500 text-sm shrink-0">Rp</span>}
                                            <input
                                              type="number"
                                              min={0}
                                              step="any"
                                              value={val != null && val !== '' ? String(val) : ''}
                                              onChange={(e) => {
                                                const v = String(e.target.value).replace(',', '.');
                                                const num = v ? parseFloat(v) : 0;
                                                setItems((prev) => prev.map((r, i) => i === index ? { ...r, [fieldKey]: Number.isFinite(num) && num >= 0 ? num : 0 } as typeof r : r));
                                              }}
                                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500"
                                              placeholder={col.label || 'Angka'}
                                            />
                                            {fmt === 'percent' && <span className="text-gray-500 text-sm shrink-0">%</span>}
                                          </div>
                                        )}
                                      </td>
                                    );
                                  }
                                  if (k === 'total') {
                                    const totalFmt = col.format ?? 'rupiah';
                                    return (<td key={cellKey} className={`${itemRowPad} pr-2 text-sm text-gray-700 ${cellAlign}`}>{formatNumberByColumn({ format: totalFmt }, lineTotal)}</td>);
                                  }
                                  return <td key={cellKey} className={`${itemRowPad} pr-2 ${cellAlign}`}>—</td>;
                                })
                              ) : (
                              <>
                              {templateShowDate && (
                                <td className={`${itemRowPad} pr-2`}>
                                  <div className="flex items-center gap-1 relative">
                                    <input type="text" value={row.row_date ? formatDateToIndonesian(row.row_date) : ''} readOnly placeholder="Klik 📅 untuk pilih tanggal" className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 bg-gray-50/80" />
                                    <input type="date" value={row.row_date || ''} ref={(el) => { dateInputRefs.current[index] = el; }} className="absolute left-0 opacity-0 w-0 h-0 overflow-hidden" onChange={(e) => { const v = e.target.value; if (v) updateItem(index, 'row_date', v); }} />
                                    <button type="button" onClick={() => { const inp = dateInputRefs.current[index]; if (inp) (typeof (inp as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function' ? (inp as HTMLInputElement & { showPicker?: () => void }).showPicker!() : inp.click()); }} className="p-1.5 text-gray-500 hover:text-orange-600 rounded shrink-0" title="Pilih tanggal"><FiCalendar className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => { setExtractingRowIndex(index); extractRowInputRef.current?.click(); }} disabled={extractingRowIndex !== null} className="p-1.5 text-gray-500 hover:text-orange-600 rounded shrink-0 disabled:opacity-50" title="Upload gambar nota – isi tanggal & hari/jam">{extractingRowIndex === index ? <span className="text-xs">...</span> : <FiImage className="w-4 h-4" />}</button>
                                  </div>
                                </td>
                              )}
                              <td className={`${itemRowPad} pr-2`}>
                                {(() => {
                                  const inList = equipmentNamesForKeterangan.includes(row.item_name);
                                  const isCustom = (row.item_name || '') && !inList;
                                  return (
                                    <div className="flex flex-col gap-1">
                                      <select value={inList ? row.item_name : (isCustom ? '__custom__' : '')} onChange={(e) => { const v = e.target.value; if (v === '__custom__') { const alreadyCustom = row.item_name && !equipmentNamesForKeterangan.includes(row.item_name); updateItem(index, 'item_name', alreadyCustom ? row.item_name : ' '); } else { handleSelectItemName(index, v); } }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm">
                                        <option value="">— Pilih keterangan —</option>
                                        {equipmentNamesForKeterangan.map((name, i) => (<option key={i} value={name}>{name}</option>))}
                                        <option value="__custom__">— Lainnya (ketik manual) —</option>
                                      </select>
                                      {isCustom && <input type="text" value={row.item_name} onChange={(e) => updateItem(index, 'item_name', e.target.value)} placeholder="Ketik keterangan" className="w-full border border-orange-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 bg-orange-50/50" />}
                                    </div>
                                  );
                                })()}
                              </td>
                              {useBbmColumns ? (
                                <>
                                  <td className={`${itemRowPad} pr-2`}>
                                    <div className="flex gap-1 items-center">
                                      <select value={row.quantity_unit ?? quantityUnit} onChange={(e) => updateItem(index, 'quantity_unit', e.target.value as 'hari' | 'jam' | 'unit' | 'jerigen' | 'volume')} className="shrink-0 w-16 border border-gray-300 rounded px-1.5 py-1.5 text-xs focus:ring-2 focus:ring-orange-500">
                                        <option value="hari">Hari</option>
                                        <option value="jam">Jam</option>
                                        <option value="unit">Unit</option>
                                        <option value="jerigen">Jerigen</option>
                                        <option value="volume">Volume</option>
                                      </select>
                                      <input type="number" min={0} step="any" value={days || ''} onChange={(e) => updateItem(index, 'days', parseFloat(e.target.value.replace(',', '.')) || 0)} className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                    </div>
                                  </td>
                                  <td className={`${itemRowPad} pr-2`}>
                                    <input type="number" min={0} step="any" value={price || ''} onChange={(e) => updateItem(index, 'price', parseFloat(String(e.target.value).replace(',', '.')) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                  </td>
                                  <td className={`${itemRowPad} pr-2`}>
                                    <input type="number" min={0} step="any" value={bbmQty || ''} onChange={(e) => updateItem(index, 'bbm_quantity', parseFloat(String(e.target.value).replace(',', '.')) || 0)} placeholder="-" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                  </td>
                                  <td className={`${itemRowPad} pr-2`}>
                                    <input type="number" min={0} step="any" value={bbmPrice || ''} onChange={(e) => updateItem(index, 'bbm_unit_price', parseFloat(String(e.target.value).replace(',', '.')) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                  </td>
                                  {templateShowTotal && (
                                    <td className={`${itemRowPad} pr-2`}>
                                      {isFixedRow ? (
                                        <input type="number" min={0} step="any" value={row.price || ''} onChange={(e) => { updateItem(index, 'price', parseFloat(String(e.target.value).replace(',', '.')) || 0); updateItem(index, 'quantity', 1); }} placeholder="Jumlah tetap" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                      ) : (
                                        <span className="text-sm text-gray-700">{formatRupiah(lineTotal)}</span>
                                      )}
                                    </td>
                                  )}
                                </>
                              ) : (
                                <>
                                  <td className={`${itemRowPad} pr-2`}>
                                    <div className="flex gap-1 items-center">
                                      <select value={row.quantity_unit ?? quantityUnit} onChange={(e) => updateItem(index, 'quantity_unit', e.target.value as 'hari' | 'jam' | 'unit' | 'jerigen' | 'volume')} className="shrink-0 w-16 border border-gray-300 rounded px-1.5 py-1.5 text-xs focus:ring-2 focus:ring-orange-500">
                                        <option value="hari">Hari</option>
                                        <option value="jam">Jam</option>
                                        <option value="unit">Unit</option>
                                        <option value="jerigen">Jerigen</option>
                                        <option value="volume">Volume</option>
                                      </select>
                                      <input type="number" min={0} step="any" value={row.quantity} onChange={(e) => { const v = parseFloat(String(e.target.value).replace(',', '.')) >= 0 ? parseFloat(String(e.target.value).replace(',', '.')) : 0; updateItem(index, 'quantity', v); updateItem(index, 'days', v); }} className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                    </div>
                                  </td>
                                  <td className={`${itemRowPad} pr-2`}>
                                    <input type="number" min={0} step="any" value={row.price || ''} onChange={(e) => updateItem(index, 'price', parseFloat(String(e.target.value).replace(',', '.')) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" placeholder={row.quantity_unit === 'jam' || (!row.quantity_unit && quantityUnit === 'jam') ? 'Harga/Jam' : 'Harga/Hari'} />
                                  </td>
                                  {templateShowTotal && <td className={`${itemRowPad} pr-2 text-sm text-gray-700`}>{formatRupiah(lineTotal)}</td>}
                                </>
                              )}
                              </>
                              )}
                              <td className="py-2">
                                <button type="button" onClick={() => removeItem(index)} className="p-1.5 text-gray-400 hover:text-red-600" title="Hapus baris">
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                              })}
                              {useGroupTemplateColumns && templateShowTotal && displayGroupColumns.some((c) => c.show_total_in_footer) && (() => {
                                const footerTotals: Record<number, number> = {};
                                sortedIndices.forEach((idx) => {
                                  const row = items[idx];
                                  if (!row) return;
                                  const itemCols = groupColumns || [];
                                  const computed = getComputedFormulaValues(row, itemCols);
                                  displayGroupColumns.forEach((col, colIdx) => {
                                    if (!col.show_total_in_footer) return;
                                    if (col.key === 'number') {
                                      const v = (row as Record<string, unknown>)[`custom_num_${colIdx}`];
                                      const n = v != null ? Number(v) : 0;
                                      footerTotals[colIdx] = (footerTotals[colIdx] ?? 0) + (Number.isFinite(n) ? n : 0);
                                    } else if (col.key === 'formula') {
                                      const v = computed[colIdx];
                                      footerTotals[colIdx] = (footerTotals[colIdx] ?? 0) + (Number.isFinite(v) ? v : 0);
                                    }
                                  });
                                });
                                return (
                                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-medium">
                                    {templateShowNo && <td className={`${itemRowPad} pr-2 text-center`}>Total</td>}
                                    <td className={`${itemRowPad} pr-2`} />
                                    {displayGroupColumns.map((col, colIdx) => (
                                      <td key={`footer-${colIdx}`} className={`${itemRowPad} pr-2 text-sm text-gray-800 ${getContentAlignClass(col)}`}>
                                        {col.show_total_in_footer && footerTotals[colIdx] != null
                                          ? formatNumberByColumn({ format: col.format ?? (col.key === 'formula' ? 'rupiah' : 'number') }, footerTotals[colIdx])
                                          : ''}
                                      </td>
                                    ))}
                                    <td className="py-2" />
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-end gap-4 pt-2">
                    <label className="text-sm text-gray-600">Pajak (%)</label>
                    <input type="number" min={0} max={100} step={0.01} value={taxPercent} onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)} className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Termin pembayaran, rekening, dll." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={handleBackToTemplates} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Batal
                  </button>
                  <button type="submit" disabled={saving} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium">
                    {saving ? 'Menyimpan...' : editInvoiceId ? 'Simpan Perubahan' : 'Simpan Invoice'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Tab: Kelola Template */}
        {activeTab === 'templates' && (
          <>
            <div className="flex justify-end mb-4">
              <button type="button" onClick={() => openTemplateModal()} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                <FiPlus /> Tambah Template
              </button>
            </div>
            {loadingTemplates ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((t) => (
                  <div key={t.id} className="flex flex-col p-5 rounded-xl border border-gray-200 bg-white">
                    <div className="p-3 rounded-lg bg-orange-50 text-orange-600 mb-3 w-fit">
                      <FiFile className="w-8 h-8" />
                    </div>
                    <span className="font-semibold text-gray-800">{t.name}</span>
                    {t.document_type && (
                      <span className="text-xs text-orange-600 mt-0.5 capitalize">{t.document_type.replace('_', ' ')}</span>
                    )}
                    {t.description && <span className="text-sm text-gray-500 mt-1">{t.description}</span>}
                    <div className="mt-2 text-xs text-gray-400">
                      {t.signature_count === 2 ? '2 TTD (kiri & kanan)' : '1 TTD (kanan)'}
                      {(() => {
                        const opt = t.options;
                        const parsed = typeof opt === 'string' ? (() => { try { return JSON.parse(opt) as { item_columns?: unknown[] }; } catch { return {}; } })() : (opt as { item_columns?: unknown[] } | undefined);
                        if (parsed?.item_columns?.length) return <> · {parsed.item_columns.length} kolom</>;
                        return null;
                      })()}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => openTemplateModal(t)} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                        <FiEdit2 /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateTemplate(t)}
                        disabled={duplicatingTemplateId === Number(t.id)}
                        className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 disabled:opacity-50"
                        title="Duplikat template"
                      >
                        <FiCopy /> Duplikat
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(Number(t.id))}
                        disabled={deletingTemplateId === Number(t.id)}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1 disabled:opacity-50"
                      >
                        <FiTrash2 /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab: Data Pelanggan */}
        {activeTab === 'customers' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="Cari nama / telepon / email..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-64 text-sm"
              />
              <button type="button" onClick={() => fetchCustomers()} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                Cari
              </button>
              <button type="button" onClick={() => openCustomerModal()} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">
                <FiPlus /> Tambah Pelanggan
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {loadingCustomers ? (
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telepon</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alamat</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customers.map((c, idx) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{c.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{c.email || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{c.address || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <button type="button" onClick={() => openCustomerModal(c)} className="text-blue-600 hover:text-blue-700 text-sm mr-2">
                              <FiEdit2 className="inline" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(c.id)}
                              disabled={deletingCustomerId === c.id}
                              className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                            >
                              <FiTrash2 className="inline" /> Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!loadingCustomers && customers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">Belum ada data pelanggan. Klik &quot;Tambah Pelanggan&quot; untuk menambah.</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal: Template Add/Edit */}
        {showTemplateModal && (
          <Modal onClose={() => setShowTemplateModal(false)} title={editingTemplateId ? 'Edit Template' : 'Tambah Template'} contentClassName="max-w-4xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Nama template"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea value={templateForm.description} onChange={(e) => setTemplateForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Deskripsi singkat" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe dokumen</label>
                <select
                  value={templateForm.document_type}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, document_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {DOCUMENT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Digunakan untuk Invoice, Penawaran, Pre Order, dll.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kalimat pembuka default</label>
                <textarea
                  value={templateForm.default_intro}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, default_intro: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Contoh: Dengan hormat, berikut kami sampaikan rincian..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah TTD</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="signature_count"
                      checked={templateForm.signature_count === 1}
                      onChange={() => setTemplateForm((f) => ({ ...f, signature_count: 1 }))}
                      className="text-orange-500"
                    />
                    <span>1 TTD (kanan saja)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="signature_count"
                      checked={templateForm.signature_count === 2}
                      onChange={() => setTemplateForm((f) => ({ ...f, signature_count: 2 }))}
                      className="text-orange-500"
                    />
                    <span>2 TTD (kiri & kanan)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Layout tampilan</label>
                <select value={templateForm.layout} onChange={(e) => setTemplateForm((f) => ({ ...f, layout: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="standard">Standard</option>
                  <option value="minimal">Minimal</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Opsi format & BBM</label>
                <p className="text-xs text-gray-500 mb-3">Saat buat dokumen dengan template ini, opsi berikut dipakai. Ada template yang pakai BBM, ada yang tidak.</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateForm.options.show_no !== false}
                      onChange={(e) => setTemplateForm((f) => ({ ...f, options: { ...f.options, show_no: e.target.checked } }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Tampilkan kolom No</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateForm.options.show_bank_account !== false}
                      onChange={(e) => setTemplateForm((f) => ({ ...f, options: { ...f.options, show_bank_account: e.target.checked } }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Tampilkan nomor rekening & bank</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Kolom tabel (Tanggal, Jumlah/Total, dll.) mengikuti &quot;Kolom tabel item&quot; di bawah. BBM dan Harga/BBM bisa ditambah sebagai kolom Angka (rumus) (perhitungan: BBM × Harga/BBM).</p>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tinggi baris tabel item</label>
                  <select
                    value={templateForm.options.item_row_height ?? 'normal'}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, options: { ...f.options, item_row_height: e.target.value as 'compact' | 'normal' | 'relaxed' } }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="compact">Compact (lebih rendah)</option>
                    <option value="normal">Normal (default)</option>
                    <option value="relaxed">Relaxed (lebih tinggi)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-0.5">Mengatur ketinggian baris di tabel item (form & PDF). Default: Normal.</p>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan default (bisa dikustom per dokumen)</label>
                  <textarea
                    value={templateForm.options.default_notes ?? ''}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, options: { ...f.options, default_notes: e.target.value } }))}
                    rows={2}
                    placeholder="Contoh: Termin pembayaran 7 hari, transfer ke rekening di atas."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kolom tabel item ({templateForm.options.item_columns.length} kolom)</label>
                <p className="text-xs text-gray-500 mb-2">Urutan dan label kolom yang tampil di tabel item. Kolom dengan rumus (relasi) menampilkan nilai terhitung: variabel quantity, days, price, bbm_quantity, bbm_unit_price; operator + - * /.</p>
                <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50 h-96 overflow-y-auto">
                  {templateForm.options.item_columns.map((col, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={col.key}
                        onChange={(e) =>
                          setTemplateForm((f) => {
                            const val = e.target.value;
                            const isFormula = val === 'formula';
                            return {
                              ...f,
                              options: {
                                ...f.options,
                                item_columns: f.options.item_columns.map((c, i) =>
                                  i === idx ? { ...c, key: val, formula: isFormula ? (c.formula ?? undefined) : undefined } : c
                                ),
                              },
                            };
                          })
                        }
                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                      >
                        {ITEM_COLUMN_KEYS.map((k) => (
                          <option key={k.value} value={k.value}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={col.label}
                        onChange={(e) =>
                          setTemplateForm((f) => ({
                            ...f,
                            options: {
                              ...f.options,
                              item_columns: applyColumnLabelChange(f.options.item_columns, idx, e.target.value),
                            },
                          }))
                        }
                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                        placeholder="Label kolom"
                      />
                      {col.key === 'number' && (
                        <>
                          <select
                            value={col.format ?? 'number'}
                            onChange={(e) =>
                              setTemplateForm((f) => ({
                                ...f,
                                options: {
                                  ...f.options,
                                  item_columns: f.options.item_columns.map((c, i) =>
                                    i === idx ? { ...c, format: e.target.value as 'number' | 'rupiah' | 'percent' } : c
                                  ),
                                },
                              }))
                            }
                            className="w-32 border border-gray-300 rounded px-2 py-1.5 text-xs"
                            title="Format tampilan"
                          >
                            <option value="number">Angka</option>
                            <option value="rupiah">Rupiah</option>
                            <option value="percent">Persen (%)</option>
                          </select>
                          <select
                            value={col.source ?? 'manual'}
                            onChange={(e) =>
                              setTemplateForm((f) => ({
                                ...f,
                                options: {
                                  ...f.options,
                                  item_columns: f.options.item_columns.map((c, i) =>
                                    i === idx ? { ...c, source: e.target.value as 'manual' | 'equipment_price_per_hour' | 'equipment_price_per_day' } : c
                                  ),
                                },
                              }))
                            }
                            className="w-44 border border-gray-300 rounded px-2 py-1.5 text-xs"
                            title="Sumber data kolom"
                          >
                            <option value="manual">Manual</option>
                            <option value="equipment_price_per_hour">Harga/Jam Equipment</option>
                            <option value="equipment_price_per_day">Harga/Hari Equipment</option>
                          </select>
                        </>
                      )}
                      {col.key === 'formula' && (
                        <div className="relative">
                          <input
                            type="text"
                            value={formulaToDisplayFormula(col.formula, templateForm.options.item_columns) || (col.formula ?? '')}
                            onChange={(e) =>
                              setTemplateForm((f) => ({
                                ...f,
                                options: {
                                  ...f.options,
                                  item_columns: f.options.item_columns.map((c, i) => (i === idx ? { ...c, formula: e.target.value.trim() || undefined } : c)),
                                },
                              }))
                            }
                            onFocus={() => setFormulaPopoverColIdx(idx)}
                            onBlur={() => setTimeout(() => setFormulaPopoverColIdx(null), 180)}
                            className="w-52 border border-gray-300 rounded px-2 py-1.5 text-xs font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Klik untuk pilih relasi"
                            title="Klik untuk membuka menu relasi (variabel & operator)"
                          />
                          {formulaPopoverColIdx === idx && (
                            <div className="absolute left-0 top-full z-20 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
                              <p className="text-xs text-gray-500 mb-2 px-1">Pilih kolom Angka (rumus atau no rumus) di atas kolom ini dan operator (×, /, +, -):</p>
                              {!getFormulaRelationTokensForCol(idx).some((t) => !['*', '/', '+', '-'].includes(t.token)) && (
                                <p className="text-xs text-amber-600 mb-2 px-1">Tambahkan kolom Angka (rumus atau no rumus) di atas agar bisa dipakai di rumus ini.</p>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {getFormulaRelationTokensForCol(idx).map(({ token, label }) => (
                                  <button
                                    key={token}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setTemplateForm((f) => {
                                        const cols = f.options.item_columns;
                                        const c = cols[idx];
                                        const current = (c?.formula ?? '').trim();
                                        const insert = token.startsWith('col_')
                                          ? (cols[parseInt(token.replace('col_', ''), 10)]?.label?.trim() || token)
                                          : token;
                                        const next = current ? current + insert : insert;
                                        return {
                                          ...f,
                                          options: {
                                            ...f.options,
                                            item_columns: cols.map((col, i) => (i === idx ? { ...col, formula: next } : col)),
                                          },
                                        };
                                      });
                                    }}
                                    className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-orange-100 border border-gray-200 hover:border-orange-300"
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {col.key === 'formula' && (
                        <select
                          value={col.format ?? 'rupiah'}
                          onChange={(e) =>
                            setTemplateForm((f) => ({
                              ...f,
                              options: {
                                ...f.options,
                                item_columns: f.options.item_columns.map((c, i) =>
                                  i === idx ? { ...c, format: e.target.value as 'number' | 'rupiah' | 'percent' } : c
                                ),
                              },
                            }))
                          }
                          className="w-32 border border-gray-300 rounded px-2 py-1.5 text-xs"
                          title="Format tampilan hasil rumus"
                        >
                          <option value="number">Angka</option>
                          <option value="rupiah">Rupiah</option>
                          <option value="percent">Persen (%)</option>
                        </select>
                      )}
                      {col.key === 'item_name' && (
                        <select
                          value={col.item_display_mode ?? 'name'}
                          onChange={(e) =>
                            setTemplateForm((f) => ({
                              ...f,
                              options: {
                                ...f.options,
                                item_columns: f.options.item_columns.map((c, i) =>
                                  i === idx ? { ...c, item_display_mode: e.target.value as 'name' | 'auto_plate_or_name' } : c
                                ),
                              },
                            }))
                          }
                          className="w-52 border border-gray-300 rounded px-2 py-1.5 text-xs"
                          title="Tampilan nilai: Nama selalu, atau Dump truck=plat nomor & Alat berat=nama"
                        >
                          <option value="name">Tampilan: Nama</option>
                          <option value="auto_plate_or_name">Tampilan: Dump truck=plat, Alat berat=nama</option>
                        </select>
                      )}
                      <select
                        value={col.headerAlign ?? 'center'}
                        onChange={(e) =>
                          setTemplateForm((f) => ({
                            ...f,
                            options: {
                              ...f.options,
                              item_columns: f.options.item_columns.map((c, i) =>
                                i === idx ? { ...c, headerAlign: e.target.value as 'left' | 'center' | 'right' } : c
                              ),
                            },
                          }))
                        }
                        className="w-20 border border-gray-300 rounded px-1.5 py-1 text-xs"
                        title="Perataan header"
                      >
                        <option value="left">Header: Kiri</option>
                        <option value="center">Header: Tengah</option>
                        <option value="right">Header: Kanan</option>
                      </select>
                      <select
                        value={col.contentAlign ?? 'center'}
                        onChange={(e) =>
                          setTemplateForm((f) => ({
                            ...f,
                            options: {
                              ...f.options,
                              item_columns: f.options.item_columns.map((c, i) =>
                                i === idx ? { ...c, contentAlign: e.target.value as 'left' | 'center' | 'right' } : c
                              ),
                            },
                          }))
                        }
                        className="w-20 border border-gray-300 rounded px-1.5 py-1 text-xs"
                        title="Perataan isi"
                      >
                        <option value="left">Isi: Kiri</option>
                        <option value="center">Isi: Tengah</option>
                        <option value="right">Isi: Kanan</option>
                      </select>
                      {(col.key === 'number' || col.key === 'formula') && (
                        <>
                          <label className="flex items-center gap-1.5 text-xs text-gray-700 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={col.show_total_in_footer ?? false}
                              onChange={(e) =>
                                setTemplateForm((f) => ({
                                  ...f,
                                  options: {
                                    ...f.options,
                                    item_columns: f.options.item_columns.map((c, i) =>
                                      i === idx ? { ...c, show_total_in_footer: e.target.checked } : c
                                    ),
                                  },
                                }))
                              }
                              className="rounded border-gray-300"
                            />
                            Total di baris bawah
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-orange-700 whitespace-nowrap" title="Jumlah kolom ini dipakai sebagai total invoice (terbilang & daftar)">
                            <input
                              type="checkbox"
                              checked={col.use_as_invoice_total ?? false}
                              onChange={(e) =>
                                setTemplateForm((f) => ({
                                  ...f,
                                  options: {
                                    ...f.options,
                                    item_columns: f.options.item_columns.map((c, i) =>
                                      i === idx
                                        ? { ...c, use_as_invoice_total: e.target.checked }
                                        : { ...c, use_as_invoice_total: e.target.checked ? false : c.use_as_invoice_total }
                                    ),
                                  },
                                }))
                              }
                              className="rounded border-gray-300"
                            />
                            Jadikan sebagai total invoice
                          </label>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setTemplateForm((f) => ({
                            ...f,
                            options: {
                              ...f.options,
                              item_columns: f.options.item_columns.filter((_, i) => i !== idx),
                            },
                          }))
                        }
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Hapus kolom"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTemplateForm((f) => ({
                      ...f,
                      options: {
                        ...f.options,
                        item_columns: [...f.options.item_columns, { key: 'item_name', label: 'Item' }],
                      },
                    }))
                  }
                  className="mt-2 text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <FiPlus className="w-4 h-4" /> Tambah kolom
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowTemplateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">
                  Batal
                </button>
                <button type="button" onClick={saveTemplate} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  Simpan
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal: Pelanggan Add/Edit */}
        {showCustomerModal && (
          <Modal onClose={() => setShowCustomerModal(false)} title={editingCustomerId ? 'Edit Pelanggan' : 'Tambah Pelanggan'}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Nama pelanggan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                <input
                  type="text"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="08..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm((f) => ({ ...f, address: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Alamat lengkap"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">
                  Batal
                </button>
                <button type="button" onClick={saveCustomer} disabled={!customerForm.name.trim()} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                  Simpan
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal: Preview Invoice */}
        {previewInvoice && (() => {
          const qtyLabel = previewInvoice.quantity_unit === 'jam' ? 'Jam' : previewInvoice.quantity_unit === 'unit' ? 'Unit' : previewInvoice.quantity_unit === 'jerigen' ? 'Jerigen' : 'Hari';
          const priceLabel = previewInvoice.price_unit_label || (previewInvoice.quantity_unit === 'jam' ? 'Harga/Jam' : previewInvoice.quantity_unit === 'unit' ? 'Harga/Unit' : previewInvoice.quantity_unit === 'jerigen' ? 'Harga/Jerigen' : 'Harga/Hari');
          const locDate = [previewInvoice.location, formatDateOnly(previewInvoice.invoice_date || '')].filter(Boolean).join(', ');
          return (
          <Modal onClose={() => setPreviewInvoice(null)} title={`Preview - ${previewInvoice.invoice_number}`}>
            <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg border text-sm">
              <div className="mb-4 flex justify-between">
                <div>
                  <p><strong>Nomor:</strong> {previewInvoice.invoice_number}</p>
                  <p><strong>Perihal:</strong> {previewInvoice.subject || 'Invoice'}</p>
                  <p><strong>Kepada Yth:</strong> {previewInvoice.customer_name}</p>
                  {previewInvoice.customer_email?.trim() && (
                    <p className="text-gray-600 text-xs mt-0.5">Email: {previewInvoice.customer_email.trim()}</p>
                  )}
                </div>
                {locDate && <p className="text-gray-600">{locDate}</p>}
              </div>
              {(() => {
                const eq = (previewInvoice.equipment_name || '').trim()
                  || (previewInvoice.items && previewInvoice.items[0] && (previewInvoice.items[0].item_name || '').trim());
                const loc = (previewInvoice.location || '').trim();
                const isDumpTruck = (n: string) => /dump\s*truck|dumptruck|roda\s*6/i.test(n);
                const onlyDumpTruck = (n: string) => isDumpTruck(n) && !n.includes(' dan ');
                let intro: React.ReactNode = null;
                if ((previewInvoice.intro_paragraph || '').trim()) {
                  const replaced = replaceIntroPlaceholders(
                    previewInvoice.intro_paragraph!,
                    previewInvoice.equipment_name || '',
                    loc,
                    previewInvoice.equipment_name_manual,
                    previewInvoice.equipment_name_alat_berat,
                    previewInvoice.equipment_name_dumptruck
                  );
                  intro = <span style={{ whiteSpace: 'pre-line' }}>{replaced}</span>;
                } else if (eq && loc) {
                  intro = onlyDumpTruck(eq)
                    ? <>Dengan Hormat,<br /><br />Bersama surat ini kami dari PT Indira Maju Bersama ingin mengajukan tagihan <strong>Dumptruck roda 6</strong> dilokasi <strong>{loc}</strong> dengan rincian sebagai berikut:</>
                    : <>Dengan Hormat,<br /><br />Bersama surat ini kami dari PT Indira Maju Bersama ingin mengajukan tagihan sewa alat berat berupa <strong>{eq}</strong> dilokasi <strong>{loc}</strong> dengan rincian sebagai berikut:</>;
                } else if (eq && onlyDumpTruck(eq)) {
                  intro = <>Dengan Hormat,<br /><br />Bersama surat ini kami dari PT Indira Maju Bersama ingin mengajukan tagihan <strong>Dumptruck roda 6</strong> dengan rincian sebagai berikut:</>;
                }
                return intro ? <p className="mb-4 text-gray-700 break-words max-w-full">{intro}</p> : null;
              })()}
              {(() => {
                const list = previewInvoice.items || [];
                const useBbmT = previewInvoice.use_bbm_columns;
                const getKey = (i: typeof list[0]) => (i.equipment_group || '').trim() || '__default__';
                const orderedKeys: string[] = [];
                for (const item of list) {
                  const k = getKey(item);
                  if (!orderedKeys.includes(k)) orderedKeys.push(k);
                }
                const groupByUnitPreview = list.reduce<Record<string, { days: number; bbm: number; total: number; label: string }>>((acc, item) => {
                  const key = getKey(item);
                  if (!acc[key]) acc[key] = { days: 0, bbm: 0, total: 0, label: key === '__default__' ? 'Unit 1' : (item.equipment_group || item.item_name || '').trim() || '-' };
                  acc[key].days += Number(useBbmT ? (item.days ?? item.quantity ?? 0) : (item.quantity ?? item.days ?? 0));
                  acc[key].bbm += Number(item.bbm_quantity ?? 0);
                  acc[key].total += Number(item.total ?? 0);
                  return acc;
                }, {});
                return (
                  <>
                    {orderedKeys.map((groupKey) => {
                      const groupItems = list.filter((i) => getKey(i) === groupKey);
                      const groupItemsSorted = [...groupItems].sort((a, b) => {
                        const da = (a.row_date || '').trim();
                        const db = (b.row_date || '').trim();
                        if (!da) return 1;
                        if (!db) return -1;
                        return da < db ? -1 : da > db ? 1 : 0;
                      });
                      const g = groupByUnitPreview[groupKey];
                      const label = g?.label ? g.label.toUpperCase() : (groupKey === '__default__' ? 'UNIT 1' : groupKey.toUpperCase());
                      return (
                        <div key={groupKey} className="mb-6">
                          <p className="font-semibold text-center mb-2">{label}</p>
                          <table className="w-full border-collapse border border-black mb-4">
                            <thead>
                              <tr className="bg-white text-black border-b border-black">
                                <th className="border border-black px-3 py-2 text-center w-10">No</th>
                                <th className="border border-black px-3 py-2 text-left">Tanggal</th>
                                {useBbmT ? (
                                  <>
                                    <th className="border border-black px-3 py-2 text-right">{qtyLabel}</th>
                                    <th className="border border-black px-3 py-2 text-right">{priceLabel}</th>
                                    <th className="border border-black px-3 py-2 text-right">Bbm (Jerigen)</th>
                                    <th className="border border-black px-3 py-2 text-right">Harga/Bbm</th>
                                    <th className="border border-black px-3 py-2 text-right">Jumlah</th>
                                  </>
                                ) : (
                                  <>
                                    <th className="border border-black px-3 py-2 text-left">{(previewInvoice.item_column_label || 'Keterangan').trim() || 'Keterangan'}</th>
                                    <th className="border border-black px-3 py-2 text-right">{qtyLabel}</th>
                                    <th className="border border-black px-3 py-2 text-right">{priceLabel}</th>
                                    <th className="border border-black px-3 py-2 text-right">Total</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {groupItemsSorted.map((item, i) => (
                                <tr key={i}>
                                  <td className="border border-black px-3 py-2 text-center">{i + 1}</td>
                                  <td className="border border-black px-3 py-2">
                                    {(item.row_date || '').trim() ? formatDateToIndonesian(String(item.row_date)) : '-'}
                                  </td>
                                  {useBbmT ? (
                                    <>
                                      <td className="border border-black px-3 py-2 text-right">{item.days ?? 0}</td>
                                      <td className="border border-black px-3 py-2 text-right">{formatRupiah(Number(item.price ?? 0))}</td>
                                      <td className="border border-black px-3 py-2 text-right">{(item.bbm_quantity ?? 0) > 0 ? item.bbm_quantity : '-'}</td>
                                      <td className="border border-black px-3 py-2 text-right">{(item.bbm_quantity ?? 0) > 0 ? formatRupiah(Number(item.bbm_unit_price ?? 0)) : '-'}</td>
                                      <td className="border border-black px-3 py-2 text-right">{formatRupiah(Number(item.total ?? 0))}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="border border-black px-3 py-2">{item.item_name}</td>
                                      <td className="border border-black px-3 py-2 text-right">{item.quantity ?? item.days ?? 0}</td>
                                      <td className="border border-black px-3 py-2 text-right">{formatRupiah(Number(item.price ?? 0))}</td>
                                      <td className="border border-black px-3 py-2 text-right">{formatRupiah(Number(item.total ?? 0))}</td>
                                    </>
                                  )}
                                </tr>
                              ))}
                              {g && (
                                <tr className="font-semibold bg-black text-white">
                                  <td className="border border-black px-3 py-2" colSpan={2}>Total</td>
                                  {useBbmT ? (
                                    <>
                                      <td className="border border-black px-3 py-2 text-right">{g.days}</td>
                                      <td className="border border-black px-3 py-2"></td>
                                      <td className="border border-black px-3 py-2 text-right">{g.bbm}</td>
                                      <td className="border border-black px-3 py-2"></td>
                                      <td className="border border-black px-3 py-2 text-right">{formatRupiah(g.total)}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="border border-black px-3 py-2"></td>
                                      <td className="border border-black px-3 py-2 text-right">{g.days}</td>
                                      <td className="border border-black px-3 py-2"></td>
                                      <td className="border border-black px-3 py-2 text-right">{formatRupiah(g.total)}</td>
                                    </>
                                  )}
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                    {orderedKeys.length >= 2 && (() => {
                      const useBbm = previewInvoice.use_bbm_columns;
                      return (
                        <div className="mb-4">
                          <p className="font-semibold text-center mb-2">GRAND TOTAL</p>
                          <table className="w-full border-collapse border border-black mb-4">
                            <thead>
                              <tr className="bg-white text-black border-b border-black">
                                <th className="border border-black px-3 py-2 text-center w-10">No</th>
                                <th className="border border-black px-3 py-2 text-left">Keterangan</th>
                                {useBbm && <th className="border border-black px-3 py-2 text-right">Jumlah {qtyLabel}</th>}
                                {useBbm && <th className="border border-black px-3 py-2 text-right">Jumlah BBM</th>}
                                <th className="border border-black px-3 py-2 text-right">Jumlah</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderedKeys.map((key, i) => {
                                const g = groupByUnitPreview[key];
                                if (!g) return null;
                                return (
                                  <tr key={key}>
                                    <td className="border border-black px-3 py-2 text-center">{i + 1}</td>
                                    <td className="border border-black px-3 py-2">{g.label}</td>
                                    {useBbm && <td className="border border-black px-3 py-2 text-right">{g.days}</td>}
                                    {useBbm && <td className="border border-black px-3 py-2 text-right">{g.bbm}</td>}
                                    <td className="border border-black px-3 py-2 text-right">{formatRupiah(g.total)}</td>
                                  </tr>
                                );
                              })}
                              <tr className="font-semibold bg-black text-white">
                                <td className="border border-black px-3 py-2" colSpan={useBbm ? 4 : 2}>Total Keseluruhan</td>
                                <td className="border border-black px-3 py-2 text-right">{formatRupiah(Number(previewInvoice.total ?? 0))}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
              <div className="text-right space-y-1">
                <p className="font-semibold">Total Keseluruhan: {formatRupiah(Number(previewInvoice.total ?? 0))}</p>
                {previewInvoice.include_bbm_note && <p className="text-gray-600">Note: Sudah termasuk BBM</p>}
                <p className="text-gray-700">Terbilang: ({(previewInvoice.terbilang_custom || '').trim() || `${terbilangRupiah(Math.round(Number(previewInvoice.total ?? 0)))} rupiah`})</p>
                {previewInvoice.bank_account && <p className="text-gray-600">No Rekening: {previewInvoice.bank_account}</p>}
              </div>
              {previewInvoice.notes && <p className="mt-4 text-gray-600">{previewInvoice.notes}</p>}
              <p className="mt-6 text-sm text-gray-700">Demikian surat tagihan ini kami sampaikan, atas kerjasamanya kami ucapkan terimakasih.</p>
              <div className="mt-8 flex justify-between gap-12">
                <div>
                  <p className="font-medium text-gray-800">Hormat Kami,</p>
                  <p className="font-semibold text-gray-900 mt-1">PT. INDIRA MAJU BERSAMA</p>
                  <p className="text-gray-500 text-xs mt-4">(Stempel & tanda tangan)</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Diterima Oleh,</p>
                  <p className="text-gray-400 text-xs mt-4 border-b border-gray-300 w-48 pt-8">(_________________________)</p>
                </div>
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <InvoicePDFExportButton invoice={previewInvoice} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600" />
                <button type="button" onClick={() => setPreviewInvoice(null)} className="px-4 py-2 border border-gray-300 rounded-lg">
                  Tutup
                </button>
              </div>
            </div>
          </Modal>
          );
        })()}

        {/* Modal: Edit Kolom Per Group */}
        {editingColumnsForGroup && (
          <Modal
            onClose={() => setEditingColumnsForGroup(null)}
            title={`Edit Kolom untuk ${editingColumnsForGroup === '__default__' ? 'Unit 1' : editingColumnsForGroup}`}
            contentClassName="max-w-3xl"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Konfigurasi kolom khusus untuk unit ini. Kolom dengan source equipment (Harga/Jam, Harga/Hari) hanya bisa pilih dari 2 pilihan itu.</p>
              <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-96 overflow-y-auto">
                {groupColumnsForm.map((col, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded">
                    <select
                      value={col.key}
                      onChange={(e) => {
                        const val = e.target.value;
                        const isFormula = val === 'formula';
                        setGroupColumnsForm((prev) =>
                          prev.map((c, i) =>
                            i === idx ? { ...c, key: val, formula: isFormula ? (c.formula ?? undefined) : undefined } : c
                          )
                        );
                      }}
                      className="w-32 border border-gray-300 rounded px-2 py-1.5 text-xs"
                    >
                      {ITEM_COLUMN_KEYS.map((k) => (
                        <option key={k.value} value={k.value}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={col.label}
                      onChange={(e) =>
                        setGroupColumnsForm((prev) =>
                          prev.map((c, i) => (i === idx ? { ...c, label: e.target.value } : c))
                        )
                      }
                      className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                      placeholder="Label kolom"
                    />
                    {col.key === 'number' && (
                      <>
                        <select
                          value={col.format ?? 'number'}
                          onChange={(e) =>
                            setGroupColumnsForm((prev) =>
                              prev.map((c, i) =>
                                i === idx ? { ...c, format: e.target.value as 'number' | 'rupiah' | 'percent' } : c
                              )
                            )
                          }
                          className="w-28 border border-gray-300 rounded px-2 py-1.5 text-xs"
                          title="Format tampilan"
                        >
                          <option value="number">Angka</option>
                          <option value="rupiah">Rupiah</option>
                          <option value="percent">Persen (%)</option>
                        </select>
                        {col.source && col.source !== 'manual' ? (
                          <select
                            value={col.source ?? 'manual'}
                            onChange={(e) =>
                              setGroupColumnsForm((prev) =>
                                prev.map((c, i) =>
                                  i === idx ? { ...c, source: e.target.value as typeof c.source } : c
                                )
                              )
                            }
                            className="w-40 border border-orange-300 bg-orange-50 rounded px-2 py-1.5 text-xs"
                            title="Kolom equipment hanya bisa pilih Harga/Jam atau Harga/Hari"
                          >
                            <option value="equipment_price_per_hour">Harga/Jam Equipment</option>
                            <option value="equipment_price_per_day">Harga/Hari Equipment</option>
                          </select>
                        ) : (
                          <select
                            value={col.source ?? 'manual'}
                            onChange={(e) =>
                              setGroupColumnsForm((prev) =>
                                prev.map((c, i) =>
                                  i === idx ? { ...c, source: e.target.value as typeof c.source } : c
                                )
                              )
                            }
                            className="w-40 border border-gray-300 rounded px-2 py-1.5 text-xs"
                          >
                            <option value="manual">Manual</option>
                            <option value="equipment_price_per_hour">Harga/Jam Equipment</option>
                            <option value="equipment_price_per_day">Harga/Hari Equipment</option>
                          </select>
                        )}
                      </>
                    )}
                    {col.key === 'formula' && (
                      <>
                        <input
                          type="text"
                          value={formulaToDisplayFormula(col.formula, groupColumnsForm) || (col.formula ?? '')}
                          onChange={(e) =>
                            setGroupColumnsForm((prev) =>
                              prev.map((c, i) =>
                                i === idx ? { ...c, formula: e.target.value.trim() || undefined } : c
                              )
                            )
                          }
                          className="w-40 border border-gray-300 rounded px-2 py-1.5 text-xs font-mono"
                          placeholder="Rumus"
                        />
                        <select
                          value={col.format ?? 'rupiah'}
                          onChange={(e) =>
                            setGroupColumnsForm((prev) =>
                              prev.map((c, i) =>
                                i === idx ? { ...c, format: e.target.value as 'number' | 'rupiah' | 'percent' } : c
                              )
                            )
                          }
                          className="w-28 border border-gray-300 rounded px-2 py-1.5 text-xs"
                          title="Format hasil rumus"
                        >
                          <option value="number">Angka</option>
                          <option value="rupiah">Rupiah</option>
                          <option value="percent">Persen (%)</option>
                        </select>
                      </>
                    )}
                    {col.key === 'item_name' && (
                      <select
                        value={col.item_display_mode ?? 'name'}
                        onChange={(e) =>
                          setGroupColumnsForm((prev) =>
                            prev.map((c, i) =>
                              i === idx ? { ...c, item_display_mode: e.target.value as 'name' | 'auto_plate_or_name' } : c
                            )
                          )
                        }
                        className="w-48 border border-gray-300 rounded px-2 py-1.5 text-xs"
                        title="Tampilan: Dump truck=plat, Alat berat=nama"
                      >
                        <option value="name">Tampilan: Nama</option>
                        <option value="auto_plate_or_name">Dump truck=plat, Alat berat=nama</option>
                      </select>
                    )}
                    <select
                      value={col.headerAlign ?? 'center'}
                      onChange={(e) =>
                        setGroupColumnsForm((prev) =>
                          prev.map((c, i) =>
                            i === idx ? { ...c, headerAlign: e.target.value as 'left' | 'center' | 'right' } : c
                          )
                        )
                      }
                      className="w-20 border border-gray-300 rounded px-1.5 py-1 text-xs"
                      title="Perataan header"
                    >
                      <option value="left">Header: Kiri</option>
                      <option value="center">Header: Tengah</option>
                      <option value="right">Header: Kanan</option>
                    </select>
                    <select
                      value={col.contentAlign ?? 'center'}
                      onChange={(e) =>
                        setGroupColumnsForm((prev) =>
                          prev.map((c, i) =>
                            i === idx ? { ...c, contentAlign: e.target.value as 'left' | 'center' | 'right' } : c
                          )
                        )
                      }
                      className="w-20 border border-gray-300 rounded px-1.5 py-1 text-xs"
                      title="Perataan isi"
                    >
                      <option value="left">Isi: Kiri</option>
                      <option value="center">Isi: Tengah</option>
                      <option value="right">Isi: Kanan</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setGroupColumnsForm((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="Hapus kolom"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setGroupColumnsForm((prev) => [...prev, { key: 'item_name', label: 'Item' }])
                }
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <FiPlus className="w-4 h-4" /> Tambah kolom
              </button>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingColumnsForGroup(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveGroupColumns}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Simpan Kolom
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Invoices;
