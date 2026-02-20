import React, { useState, useEffect, useCallback, useRef } from 'react';
import { invoiceApi } from '../api/invoice';
import { customerApi } from '../api/customer';
import { equipmentApi } from '../api/equipment';
import type {
  Invoice,
  InvoiceTemplate,
  CreateInvoiceRequest,
} from '../types/invoice';
import type { Customer } from '../types/customer';
import { FiFileText, FiPlus, FiTrash2, FiEdit2, FiEye, FiList, FiFile, FiGrid, FiCalendar, FiUsers } from 'react-icons/fi';
import InvoicePDFExportButton from '../component/InvoicePDFExportButton';
import { Modal } from '../component/Modal';

interface InvoicesProps {
  isCollapsed: boolean;
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const formatDateToId = (isoDate: string) => {
  if (!isoDate) return '';
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

const Invoices: React.FC<InvoicesProps> = ({ isCollapsed }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'templates' | 'customers'>('list');

  // List state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0, has_next: false, has_prev: false });
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

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
    quantity: number;
    price: number;
    row_date?: string;
    days?: number;
    bbm_quantity?: number;
    bbm_unit_price?: number;
    equipment_group?: string;
  };
  const [items, setItems] = useState<FormItem[]>([
    { item_name: '', description: '', quantity: 1, price: 0, row_date: '', days: 0, bbm_quantity: 0, bbm_unit_price: 0 },
  ]);
  const [itemColumnLabel, setItemColumnLabel] = useState('Keterangan');
  const [taxPercent, setTaxPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [includeBbmNote, setIncludeBbmNote] = useState(false);
  const [useBbmColumns, setUseBbmColumns] = useState(false);
  const [quantityUnit, setQuantityUnit] = useState<'hari' | 'jam' | 'unit' | 'jerigen'>('hari');
  const [priceUnitLabel, setPriceUnitLabel] = useState('Harga/Hari');
  const [location, setLocation] = useState('Batam');
  const [subject, setSubject] = useState('Invoice');
  const [equipmentNames, setEquipmentNames] = useState<string[]>([]);
  const [equipmentList, setEquipmentList] = useState<{ id: number; name: string; type: string }[]>([]);
  const [newEquipmentInput, setNewEquipmentInput] = useState('');
  const [includeDumpTruck, setIncludeDumpTruck] = useState(false);
  const [dumpTruckRoda, setDumpTruckRoda] = useState('6');

  const formatEquipmentNamesForParagraph = (arr: string[]) => {
    if (arr.length === 0) return '';
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(', ') + ' dan ' + arr[arr.length - 1];
  };
  const equipmentNamesForKeterangan = [...equipmentNames, includeDumpTruck ? `Dump Truck ${dumpTruckRoda} Roda` : null].filter(Boolean) as string[];

  const getEquipmentNameForPayload = () => {
    const dumpPart = includeDumpTruck ? `Dump Truck Roda ${dumpTruckRoda}` : '';
    // Jika sertakan dump truck: alat berat dipisah koma, lalu " dan Dump Truck ..."
    if (equipmentNames.length > 0 && dumpPart) {
      return `Alat berat berupa ${equipmentNames.join(', ')} dan ${dumpPart}`;
    }
    const alatPart = formatEquipmentNamesForParagraph(equipmentNames);
    if (alatPart) return alatPart;
    if (dumpPart) return dumpPart;
    return '';
  };
  const [introParagraph, setIntroParagraph] = useState('');
  const [bankAccount, setBankAccount] = useState('1090021332523 (PT INDIRA MAJU BERSAMA) Bank Mandiri');
  const [terbilangCustom, setTerbilangCustom] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preview
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Template CRUD
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', layout: 'standard' });
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<number | string | null>(null);
  const dateInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fetchInvoices = useCallback(async () => {
    setListLoading(true);
    try {
      const filterParts: string[] = [];
      if (filterStatus) filterParts.push(`status:${filterStatus}`);
      if (filterStartDate) filterParts.push(`start_date:${filterStartDate}`);
      if (filterEndDate) filterParts.push(`end_date:${filterEndDate}`);
      const res = await invoiceApi.getInvoices({
        page: pagination.page,
        limit: pagination.limit,
        search: filterSearch || undefined,
        sort: 'created_at',
        order: 'desc',
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
  }, [pagination.page, pagination.limit, filterSearch, filterStatus, filterStartDate, filterEndDate]);

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
    equipmentApi.getList(undefined, 'alat_berat').then((list) => setEquipmentList(list.map((e) => ({ id: e.id, name: e.name, type: e.type })))).catch(() => setEquipmentList([]));
  }, [step]);

  const handleSelectTemplate = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setStep('fill-form');
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
    setStep('pick-template');
    setEditInvoiceId(null);
    setQuantityUnit('hari');
    setPriceUnitLabel('Harga/Hari');
    setEquipmentNames([]);
    setIncludeDumpTruck(false);
    setDumpTruckRoda('6');
    setItemColumnLabel('Keterangan');
    setTerbilangCustom('');
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
        ? inv.items.map((i) => ({
            item_name: i.item_name,
            description: i.description || '',
            quantity: i.quantity ?? 1,
            price: i.price ?? 0,
            row_date: i.row_date || '',
            days: i.days ?? 0,
            bbm_quantity: i.bbm_quantity ?? 0,
            bbm_unit_price: i.bbm_unit_price ?? 0,
            equipment_group: i.equipment_group || '',
          }))
        : [{ item_name: '', description: '', quantity: 1, price: 0, row_date: '', days: 0, bbm_quantity: 0, bbm_unit_price: 0 }]
    );
    setItemColumnLabel(inv.item_column_label || 'Keterangan');
    setTaxPercent(inv.tax_percent ?? 0);
    setNotes(inv.notes || '');
    setIncludeBbmNote(inv.include_bbm_note ?? false);
    setUseBbmColumns(inv.use_bbm_columns ?? false);
    setLocation(inv.location || 'Batam');
    setSubject(inv.subject || 'Invoice');
    const eqName = (inv.equipment_name || '').trim();
    const dumpMatch = eqName.match(/\s+dan\s+Dump Truck\s+(?:Roda\s+)?(\d+)(?:\s+Roda)?$/i)
      || eqName.match(/^Dump Truck\s+(?:Roda\s+)?(\d+)(?:\s+Roda)?$/i)
      || eqName.match(/Dump Truck\s+(\d+)\s+Roda/i);
    if (dumpMatch) {
      setDumpTruckRoda(dumpMatch[1] || '6');
      setIncludeDumpTruck(true);
    } else {
      setIncludeDumpTruck(false);
    }
    const withoutDump = eqName
      .replace(/\s+dan\s+Dump Truck\s+(?:Roda\s+)?\d+(?:\s+Roda)?$/i, '')
      .replace(/^Dump Truck\s+(?:Roda\s+)?\d+(?:\s+Roda)?$/i, '')
      .replace(/^Alat berat berupa\s+/i, '')
      .trim();
    if (withoutDump) {
      const prefix = 'Alat berat berupa ';
      const str = withoutDump.startsWith(prefix) ? withoutDump.slice(prefix.length) : withoutDump;
      const danSplit = str.split(/\s+dan\s+/);
      const arr = danSplit.length >= 2
        ? (() => {
            const last = danSplit.pop()?.trim() ?? '';
            const rest = danSplit.join(' dan ').split(',').map((s) => s.trim()).filter(Boolean);
            return [...rest, last].filter(Boolean);
          })()
        : (str ? str.split(',').map((s) => s.trim()).filter(Boolean) : []);
      setEquipmentNames(arr.length > 0 ? arr : (str ? [str] : []));
    }
    if (!eqName) setEquipmentNames([]);
    setIntroParagraph(inv.intro_paragraph || '');
    setBankAccount(inv.bank_account || '');
    setTerbilangCustom(inv.terbilang_custom || '');
    const qu = (inv.quantity_unit as 'hari' | 'jam' | 'unit' | 'jerigen') || 'hari';
    setQuantityUnit(qu);
    setPriceUnitLabel(inv.price_unit_label || (qu === 'jam' ? 'Harga/Jam' : qu === 'unit' ? 'Harga/Unit' : qu === 'jerigen' ? 'Harga/Jerigen' : 'Harga/Hari'));
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
    const newRow: FormItem = { ...emptyFormItem(defaultItemName), equipment_group: groupKey === '__default__' ? '' : groupKey };
    setItems((prev) => [...prev.slice(0, insertAfter + 1), newRow, ...prev.slice(insertAfter + 1)]);
  };
  const addItemCopyFromAboveForGroup = (groupKey: string) => {
    const indices = groupIndices[groupKey] || [];
    if (indices.length === 0) {
      addItemEmptyForGroup(groupKey);
      return;
    }
    const lastIdx = indices[indices.length - 1];
    const last = items[lastIdx];
    const copy: FormItem = {
      ...last,
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
        return { ...r, equipment_group: groupKey === '__default__' ? val : val, item_name: newItemName };
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
    setItems((prev) => [...prev, { ...emptyFormItem(newGroup), equipment_group: newGroup }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
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
      items: items.map((r) => ({
        item_name: r.item_name,
        description: r.description,
        quantity: r.quantity,
        price: r.price,
        row_date: r.row_date,
        days: r.days,
        bbm_quantity: r.bbm_quantity,
        bbm_unit_price: r.bbm_unit_price,
        equipment_group: (r.equipment_group || '').trim() || undefined,
      })),
      tax_percent: taxPercent || undefined,
      notes: notes.trim() || undefined,
      include_bbm_note: includeBbmNote,
      use_bbm_columns: useBbmColumns,
      location: location.trim() || undefined,
      subject: subject.trim() || 'Invoice',
      equipment_name: getEquipmentNameForPayload().trim() || undefined,
      intro_paragraph: introParagraph.trim() || undefined,
      bank_account: bankAccount.trim() || undefined,
      terbilang_custom: terbilangCustom.trim() || undefined,
      quantity_unit: quantityUnit,
      price_unit_label: priceUnitLabel,
      item_column_label: (itemColumnLabel || 'Keterangan').trim() || undefined,
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
    } catch {
      setMessage({ type: 'error', text: 'Gagal menyimpan invoice.' });
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
      fetchInvoices();
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const openTemplateModal = (template?: InvoiceTemplate) => {
    if (template) {
      setEditingTemplateId(Number(template.id));
      setTemplateForm({ name: template.name, description: template.description || '', layout: template.layout || 'standard' });
    } else {
      setEditingTemplateId(null);
      setTemplateForm({ name: '', description: '', layout: 'standard' });
    }
    setShowTemplateModal(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) return;
    try {
      if (editingTemplateId) {
        await invoiceApi.updateTemplate(editingTemplateId, templateForm);
      } else {
        await invoiceApi.createTemplate(templateForm);
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
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
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
              />
              <span className="text-gray-400">–</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => fetchInvoices()}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
              >
                Refresh
              </button>
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{inv.invoice_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{inv.invoice_date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{inv.customer_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatRupiah(Number(inv.total ?? 0))}</td>
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3 flex flex-wrap gap-2">
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

            {pagination.total_pages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <button
                  type="button"
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={!pagination.has_prev}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <span className="text-gray-600">
                  Halaman {pagination.page} dari {pagination.total_pages} ({pagination.total} data)
                </span>
                <button
                  type="button"
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={!pagination.has_next}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              </div>
            )}
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
                <div className="flex items-center justify-between">
                  <button type="button" onClick={handleBackToTemplates} className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                    ← Ganti template
                  </button>
                  <span className="text-sm text-gray-500">
                    Template: <strong>{selectedTemplate.name}</strong>
                    {editInvoiceId && ' (Edit)'}
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Informasi Invoice</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Invoice</label>
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
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Opsi BBM & Format (sewa alat berat)</h3>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Satuan quantity & harga</label>
                    <select
                      value={quantityUnit}
                      onChange={(e) => {
                        const v = e.target.value as 'hari' | 'jam' | 'unit' | 'jerigen';
                        setQuantityUnit(v);
                        setPriceUnitLabel(v === 'jam' ? 'Harga/Jam' : v === 'unit' ? 'Harga/Unit' : v === 'jerigen' ? 'Harga/Jerigen' : 'Harga/Hari');
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="hari">Hari (Harga/Hari)</option>
                      <option value="jam">Jam (Harga/Jam)</option>
                      <option value="unit">Unit (Harga/Unit)</option>
                      <option value="jerigen">Jerigen (Harga/Jerigen)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Alat berat / kendaraan (untuk kalimat pembuka otomatis)</label>
                    <div className="space-y-3 w-full max-w-xl">
                      <div>
                        <span className="text-sm font-medium text-gray-600 block mb-1">Alat berat</span>
                        <div className="flex flex-wrap gap-2">
                          {equipmentNames.map((name, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg text-sm">
                              {name}
                              <button type="button" onClick={() => setEquipmentNames((prev) => prev.filter((_, j) => j !== i))} className="text-orange-600 hover:text-orange-800" aria-label="Hapus">×</button>
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
                            {equipmentList.filter((e) => e.type === 'alat_berat' && !equipmentNames.includes(e.name)).map((e) => (
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
                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={includeDumpTruck} onChange={(e) => setIncludeDumpTruck(e.target.checked)} className="rounded border-gray-300" />
                          <span className="text-sm font-medium text-gray-600">Sertakan Dump Truck</span>
                        </label>
                        {includeDumpTruck && (
                          <>
                            <span className="text-sm text-gray-500">Roda:</span>
                            <select value={dumpTruckRoda} onChange={(e) => setDumpTruckRoda(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500">
                              {[6, 8, 10, 12].map((n) => (
                                <option key={n} value={n}>{n} Roda</option>
                              ))}
                            </select>
                            <span className="text-sm text-gray-500">→ Dump Truck Roda {dumpTruckRoda}</span>
                          </>
                        )}
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
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Paragraf pembuka (opsional, override)</label>
                      <textarea value={introParagraph} onChange={(e) => setIntroParagraph(e.target.value)} rows={2} placeholder="Kosongkan agar pakai kalimat otomatis: Dengan Hormat, Bersama surat ini kami dari PT Indira Maju Bersama ingin mengajukan tagihan sewa alat berat berupa [nama alat] dilokasi [lokasi] dengan rincian sebagai berikut:" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">No Rekening & Bank</label>
                      <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="1090021332523 (PT INDIRA MAJU BERSAMA) Bank Mandiri" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Terbilang (opsional, custom)</label>
                      <textarea value={terbilangCustom} onChange={(e) => setTerbilangCustom(e.target.value)} rows={2} placeholder="Kosongkan untuk pakai terbilang otomatis dari total. Isi manual jika nominal tidak bisa di-generate (contoh: Sembilan Ratus Miliar ... Rupiah)" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 border-b pb-2">
                    <h3 className="font-semibold text-gray-800">Item / Jasa</h3>
                    <label className="text-sm text-gray-600">Label kolom:</label>
                    <input type="text" value={itemColumnLabel} onChange={(e) => setItemColumnLabel(e.target.value)} placeholder="Keterangan" className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500" />
                  </div>
                  {orderedGroupKeys.map((groupKey, groupIdx) => {
                    const indices = groupIndices[groupKey] || [];
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
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => addItemEmptyForGroup(groupKey, displayName)} className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm font-medium border border-gray-300 rounded px-2 py-1">
                              <FiPlus /> Tambah baris kosong
                            </button>
                            <button type="button" onClick={() => addItemCopyFromAboveForGroup(groupKey)} className="flex items-center gap-1 text-orange-600 hover:text-orange-700 text-sm font-medium border border-orange-300 rounded px-2 py-1">
                              <FiPlus /> Copy dari baris atas
                            </button>
                            {isLastGroup && (
                              <button type="button" onClick={addDifferentUnit} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                                <FiPlus /> Tambah Unit Berbeda
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-left text-sm text-gray-600 border-b">
                                <th className="pb-2 pr-2 w-10">No</th>
                                <th className="pb-2 pr-2">Tanggal</th>
                                {useBbmColumns ? (
                                  <>
                                    <th className="pb-2 pr-2">Keterangan</th>
                                    <th className="pb-2 pr-2 w-20">{quantityUnit === 'jam' ? 'Jam' : quantityUnit === 'unit' ? 'Unit' : quantityUnit === 'jerigen' ? 'Jerigen' : 'Hari'}</th>
                                    <th className="pb-2 pr-2 w-28">{priceUnitLabel}</th>
                                    <th className="pb-2 pr-2 w-20">Bbm (Jerigen)</th>
                                    <th className="pb-2 pr-2 w-28">Harga/Bbm</th>
                                    <th className="pb-2 pr-2 w-28">Jumlah</th>
                                  </>
                                ) : (
                                  <>
                                    <th className="pb-2 pr-2">{(itemColumnLabel || 'Keterangan').trim() || 'Keterangan'} *</th>
                                    <th className="pb-2 pr-2 w-24">{quantityUnit === 'jam' ? 'Jam' : quantityUnit === 'unit' ? 'Unit' : quantityUnit === 'jerigen' ? 'Jerigen' : 'Hari'}</th>
                                    <th className="pb-2 pr-2 w-32">{priceUnitLabel}</th>
                                    <th className="pb-2 pr-2 w-28">Jumlah</th>
                                  </>
                                )}
                                <th className="pb-2 w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {indices.map((_, rowNum) => {
                          const index = indices[rowNum];
                          const row = items[index];
                          if (!row) return null;
                          const days = row.days ?? 0;
                          const price = row.price ?? 0;
                          const bbmQty = row.bbm_quantity ?? 0;
                          const bbmPrice = row.bbm_unit_price ?? 0;
                          const isFixedRow = useBbmColumns && days === 0 && price === 0 && bbmQty === 0;
                          const lineTotal = useBbmColumns
                            ? (days * price + bbmQty * bbmPrice) || (isFixedRow ? row.price || 0 : 0)
                            : (row.quantity || 0) * (row.price || 0);
                          return (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-2 pr-2 text-center text-gray-600">{rowNum + 1}</td>
                              <td className="py-2 pr-2">
                                <div className="flex items-center gap-1 relative">
                                  <input
                                    type="text"
                                    value={row.row_date || ''}
                                    onChange={(e) => updateItem(index, 'row_date', e.target.value)}
                                    placeholder="Klik 📅 atau ketik"
                                    className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500"
                                  />
                                  <input
                                    type="date"
                                    ref={(el) => { dateInputRefs.current[index] = el; }}
                                    className="absolute left-0 opacity-0 w-0 h-0 overflow-hidden"
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      if (v) updateItem(index, 'row_date', formatDateToId(v));
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const inp = dateInputRefs.current[index];
                                      if (inp) (typeof (inp as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function' ? (inp as HTMLInputElement & { showPicker?: () => void }).showPicker!() : inp.click());
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-orange-600 rounded shrink-0"
                                    title="Pilih tanggal"
                                  >
                                    <FiCalendar className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-2 pr-2">
                                {(() => {
                                  const inList = equipmentNamesForKeterangan.includes(row.item_name);
                                  const isCustom = (row.item_name || '') && !inList;
                                  return (
                                    <div className="flex flex-col gap-1">
                                      <select
                                        value={inList ? row.item_name : (isCustom ? '__custom__' : '')}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          if (v === '__custom__') {
                                            const alreadyCustom = row.item_name && !equipmentNamesForKeterangan.includes(row.item_name);
                                            updateItem(index, 'item_name', alreadyCustom ? row.item_name : ' ');
                                          } else {
                                            updateItem(index, 'item_name', v);
                                          }
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
                                      >
                                        <option value="">— Pilih keterangan —</option>
                                        {equipmentNamesForKeterangan.map((name, i) => (
                                          <option key={i} value={name}>{name}</option>
                                        ))}
                                        <option value="__custom__">— Lainnya (ketik manual) —</option>
                                      </select>
                                      {isCustom && (
                                        <input
                                          type="text"
                                          value={row.item_name}
                                          onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                                          placeholder="Ketik keterangan"
                                          className="w-full border border-orange-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 bg-orange-50/50"
                                        />
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              {useBbmColumns ? (
                                <>
                                  <td className="py-2 pr-2">
                                    <input type="number" min={0} step="any" value={days || ''} onChange={(e) => updateItem(index, 'days', parseFloat(e.target.value.replace(',', '.')) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                  </td>
                                  <td className="py-2 pr-2">
                                    <input type="number" min={0} value={price || ''} onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                  </td>
                                  <td className="py-2 pr-2">
                                    <input type="number" min={0} value={bbmQty || ''} onChange={(e) => updateItem(index, 'bbm_quantity', parseFloat(e.target.value) || 0)} placeholder="-" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                  </td>
                                  <td className="py-2 pr-2">
                                    <input type="number" min={0} value={bbmPrice || ''} onChange={(e) => updateItem(index, 'bbm_unit_price', parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                  </td>
                                  <td className="py-2 pr-2">
                                    {isFixedRow ? (
                                      <input type="number" min={0} value={row.price || ''} onChange={(e) => { updateItem(index, 'price', parseFloat(e.target.value) || 0); updateItem(index, 'quantity', 1); }} placeholder="Jumlah tetap" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                    ) : (
                                      <span className="text-sm text-gray-700">{formatRupiah(lineTotal)}</span>
                                    )}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-2 pr-2">
                                    <input type="number" min={0} step="any" value={row.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(String(e.target.value).replace(',', '.')) >= 0 ? parseFloat(String(e.target.value).replace(',', '.')) : 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                  </td>
                                  <td className="py-2 pr-2">
                                    <input type="number" min={0} value={row.price || ''} onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" />
                                  </td>
                                  <td className="py-2 pr-2 text-sm text-gray-700">{formatRupiah(lineTotal)}</td>
                                </>
                              )}
                              <td className="py-2">
                                <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1} className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-40">
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                              })}
                            </tbody>
                          </table>
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
                    {t.description && <span className="text-sm text-gray-500 mt-1">{t.description}</span>}
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => openTemplateModal(t)} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                        <FiEdit2 /> Edit
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
          <Modal onClose={() => setShowTemplateModal(false)} title={editingTemplateId ? 'Edit Template' : 'Tambah Template'}>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
                <select value={templateForm.layout} onChange={(e) => setTemplateForm((f) => ({ ...f, layout: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="standard">Standard</option>
                  <option value="minimal">Minimal</option>
                  <option value="professional">Professional</option>
                </select>
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
                const intro = eq && loc
                  ? <>Dengan Hormat,<br /><br />Bersama surat ini kami dari PT Indira Maju Bersama ingin mengajukan tagihan sewa alat berat berupa <strong>{eq}</strong> dilokasi <strong>{loc}</strong> dengan rincian sebagai berikut:</>
                  : previewInvoice.intro_paragraph;
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
                              {groupItems.map((item, i) => (
                                <tr key={i}>
                                  <td className="border border-black px-3 py-2 text-center">{i + 1}</td>
                                  <td className="border border-black px-3 py-2">
                                    {(item.row_date || '').trim() || '-'}
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
      </div>
    </div>
  );
};

export default Invoices;
