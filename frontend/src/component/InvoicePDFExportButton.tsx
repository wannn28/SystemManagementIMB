import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { invoiceApi } from '../api/invoice';
import type { Invoice, InvoiceTemplate, TemplateItemColumn } from '../types/invoice';
import { replaceIntroPlaceholders } from '../utils/introPlaceholders';
import { evaluateFormula, getComputedFormulaValues } from '../utils/invoiceFormula';

interface InvoicePDFExportButtonProps {
  invoice: Invoice;
  fileName?: string;
  className?: string;
  children?: React.ReactNode;
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const formatNumberWithThousand = (n: number): string => {
  const str = String(n);
  const [intPart, decPart] = str.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart ? `${formattedInt},${decPart}` : formattedInt;
};

const formatLabelWithSubscript = (label: string): string => {
  return label
    .replace(/M3/g, 'M³')
    .replace(/m3/g, 'm³')
    .replace(/M2/g, 'M²')
    .replace(/m2/g, 'm²');
};

const ANGKA = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];

function joinParts(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export function terbilang(n: number): string {
  if (!Number.isFinite(n)) return '';
  if (!Number.isInteger(n)) return 'Hanya mendukung bilangan bulat'; // atau kamu bikin versi desimal

  if (n === 0) return 'Nol';
  if (n < 0) return joinParts('Minus', terbilang(-n));

  if (n < 10) return ANGKA[n];
  if (n === 10) return 'Sepuluh';
  if (n === 11) return 'Sebelas';
  if (n < 20) return joinParts(ANGKA[n - 10], 'Belas');
  if (n < 100) return joinParts(ANGKA[Math.floor(n / 10)], 'Puluh', n % 10 ? ANGKA[n % 10] : '');
  if (n < 200) return joinParts('Seratus', n % 100 ? terbilang(n % 100) : '');
  if (n < 1000) return joinParts(ANGKA[Math.floor(n / 100)], 'Ratus', n % 100 ? terbilang(n % 100) : '');
  if (n < 2000) return joinParts('Seribu', n % 1000 ? terbilang(n % 1000) : '');
  if (n < 1e6) return joinParts(terbilang(Math.floor(n / 1000)), 'Ribu', n % 1000 ? terbilang(n % 1000) : '');
  if (n < 1e9) return joinParts(terbilang(Math.floor(n / 1e6)), 'Juta', n % 1e6 ? terbilang(n % 1e6) : '');
  if (n < 1e12) return joinParts(terbilang(Math.floor(n / 1e9)), 'Miliar', n % 1e9 ? terbilang(n % 1e9) : '');
  if (n < 1e15) return joinParts(terbilang(Math.floor(n / 1e12)), 'Triliun', n % 1e12 ? terbilang(n % 1e12) : '');

  return 'Terlalu besar untuk tipe number (gunakan BigInt)';
}
function formatDateOnly(d: string): string {
  if (!d) return '';
  const x = d.split('T')[0];
  if (!x) return d;
  const [y, m, day] = x.split('-');
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const mi = parseInt(m || '1', 10) - 1;
  return `${day} ${months[mi]} ${y}`;
}

const KOP_SURAT_URL = '/kopsurathd.png';
const TTD_SIGNATURE_URL = '/ttd.png';
const PAGE_WIDTH_MM = 210;

function getTemplateItemColumns(template: InvoiceTemplate | undefined): TemplateItemColumn[] | null {
  if (!template?.options) return null;
  const opt = template.options;
  const parsed =
    typeof opt === 'string'
      ? (() => {
          try {
            return JSON.parse(opt) as { item_columns?: TemplateItemColumn[] };
          } catch {
            return {};
          }
        })()
      : (opt as { item_columns?: TemplateItemColumn[] });
  if (parsed?.item_columns?.length) return parsed.item_columns;
  return null;
}

type TemplateDisplayOptions = {
  show_no: boolean;
  show_date: boolean;
  show_total: boolean;
  show_grand_total: boolean;
  show_bank_account: boolean;
  show_kop_next_page: boolean;
  use_bbm_columns: boolean;
  include_bbm_note: boolean;
  quantity_unit: string;
  price_unit_label: string;
  item_column_label: string;
  item_row_height: 'very_compact' | 'compact' | 'normal' | 'relaxed';
};

function getTemplateDisplayOptions(template: InvoiceTemplate | undefined): TemplateDisplayOptions | null {
  if (!template?.options) return null;
  const opt = template.options;
  const parsed =
    typeof opt === 'string'
      ? (() => {
          try {
            return JSON.parse(opt) as Partial<TemplateDisplayOptions>;
          } catch {
            return {};
          }
        })()
      : (template.options as Partial<TemplateDisplayOptions>);
  const rowHeight = (parsed as { item_row_height?: 'very_compact' | 'compact' | 'normal' | 'relaxed' })?.item_row_height || 'compact';
  const docType = (template.document_type || 'invoice').toLowerCase();
  const defaultShowGrandTotal = docType === 'penawaran' ? false : true;
  return {
    show_no: parsed?.show_no !== false,
    show_date: parsed?.show_date !== false,
    show_total: parsed?.show_total !== false,
    show_grand_total: parsed?.show_grand_total ?? defaultShowGrandTotal,
    show_bank_account: parsed?.show_bank_account !== false,
    show_kop_next_page: parsed?.show_kop_next_page === true,
    use_bbm_columns: !!parsed?.use_bbm_columns,
    include_bbm_note: !!parsed?.include_bbm_note,
    quantity_unit: parsed?.quantity_unit || 'hari',
    price_unit_label: parsed?.price_unit_label || 'Harga/Hari',
    item_column_label: parsed?.item_column_label || 'Keterangan',
    item_row_height:
      rowHeight === 'very_compact' || rowHeight === 'compact' || rowHeight === 'relaxed'
        ? rowHeight
        : 'normal',
  };
}

function getItemCellValue(
  item: Invoice['items'][0],
  column: TemplateItemColumn,
  allColumns: TemplateItemColumn[],
  columnIndex: number,
  formatRupiahFn: (n: number) => string,
  formatDateOnlyFn: (d: string) => string,
  rowIndex?: number
): string {
  const showDashForEmptyPrice = Number(item.price ?? 0) === 0;
  if (column.key === 'no') {
    return String((rowIndex ?? 0) + 1);
  }
  if (column.formula) {
    if (column.editable && Number.isFinite(Number(item.total))) {
      const manual = Number(item.total);
      const fmt = column.format ?? 'rupiah';
      if (fmt === 'rupiah') return formatRupiahFn(manual);
      if (fmt === 'percent') return `${manual} %`;
      return formatNumberWithThousand(manual);
    }
    const customFields = Object.keys(item as unknown as Record<string, unknown>).filter((k) => k.startsWith('custom_num_')).reduce((acc, k) => ({ ...acc, [k]: (item as unknown as Record<string, unknown>)[k] }), {});
    const row: Parameters<typeof getComputedFormulaValues>[0] = {
      quantity: item.quantity ?? 0,
      days: item.days ?? item.quantity ?? 0,
      price: item.price ?? 0,
      bbm_quantity: item.bbm_quantity ?? 0,
      bbm_unit_price: item.bbm_unit_price ?? 0,
      ...customFields,
    };
    const computed = getComputedFormulaValues(row, allColumns);
    const val = columnIndex >= 0 ? (computed[columnIndex] ?? NaN) : evaluateFormula(column.formula, row);
    if (!Number.isFinite(val)) return '-';
    const fmt = column.format ?? 'rupiah';
    if (fmt === 'rupiah') return formatRupiahFn(val);
    if (fmt === 'percent') return `${val} %`;
    return formatNumberWithThousand(val);
  }
  const key = column.key;
  switch (key) {
    case 'item_name':
      return ((item as { item_display_name?: string }).item_display_name || item.item_name || '-').trim() || '-';
    case 'description':
      return (item.description || '-').trim() || '-';
    case 'quantity':
      return String(item.quantity ?? item.days ?? 0);
    case 'days':
      return String(item.days ?? item.quantity ?? 0);
    case 'price':
      return showDashForEmptyPrice ? '-' : formatRupiahFn(Number(item.price ?? 0));
    case 'bbm_quantity':
      return (item.bbm_quantity ?? 0) > 0 ? String(item.bbm_quantity) : '-';
    case 'bbm_unit_price':
      return (item.bbm_quantity ?? 0) > 0 ? formatRupiahFn(Number(item.bbm_unit_price ?? 0)) : '-';
    case 'total':
      return formatRupiahFn(Number(item.total ?? 0));
    case 'row_date':
      return (item.row_date || '').trim() ? formatDateOnlyFn(String(item.row_date)) : '-';
    case 'number': {
      const fieldKey = `custom_num_${columnIndex}`;
      const val = (item as unknown as Record<string, unknown>)[fieldKey];
      const num = val != null && val !== '' ? Number(val) : NaN;
      if (!Number.isFinite(num)) return '-';
      const fmt = column.format ?? 'number';
      if (fmt === 'rupiah') return num === 0 && (column.label || '').toLowerCase().includes('harga') ? '-' : formatRupiahFn(num);
      if (fmt === 'percent') return `${num} %`;
      return formatNumberWithThousand(num);
    }
    default:
      return (item as unknown as Record<string, unknown>)[key] != null ? String((item as unknown as Record<string, unknown>)[key]) : '-';
  }
}

/** Nilai numerik untuk perhitungan total baris (hanya kolom number/formula). */
function getItemCellNumericValue(
  item: Invoice['items'][0],
  column: TemplateItemColumn,
  allColumns: TemplateItemColumn[],
  columnIndex: number
): number {
  if (column.key === 'number') {
    const fieldKey = `custom_num_${columnIndex}`;
    const val = (item as unknown as Record<string, unknown>)[fieldKey];
    const num = val != null && val !== '' ? Number(val) : NaN;
    return Number.isFinite(num) ? num : 0;
  }
  if (column.key === 'formula' && column.formula) {
    if (column.editable && Number.isFinite(Number(item.total))) {
      return Number(item.total);
    }
    const customFields = Object.keys(item as unknown as Record<string, unknown>)
      .filter((k) => k.startsWith('custom_num_'))
      .reduce((acc, k) => ({ ...acc, [k]: (item as unknown as Record<string, unknown>)[k] }), {});
    const row = {
      quantity: item.quantity ?? 0,
      days: item.days ?? item.quantity ?? 0,
      price: item.price ?? 0,
      bbm_quantity: item.bbm_quantity ?? 0,
      bbm_unit_price: item.bbm_unit_price ?? 0,
      ...customFields,
    };
    const computed = getComputedFormulaValues(row, allColumns);
    const val = columnIndex >= 0 ? (computed[columnIndex] ?? NaN) : evaluateFormula(column.formula, row);
    return Number.isFinite(val) ? val : 0;
  }
  return 0;
}

function formatColumnTotal(column: TemplateItemColumn, sum: number): string {
  const fmt = column.format ?? (column.key === 'formula' ? 'rupiah' : 'number');
  if (fmt === 'rupiah') return formatRupiah(sum);
  if (fmt === 'percent') return `${sum} %`;
  return formatNumberWithThousand(sum);
}

function loadTtdImage(): Promise<{ dataUrl: string; widthPx: number; heightPx: number } | null> {
  return fetch(TTD_SIGNATURE_URL)
    .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('TTD not found'))))
    .then(
      (blob) =>
        new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(blob);
        })
    )
    .then((dataUrl) => {
      return new Promise<{ dataUrl: string; widthPx: number; heightPx: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ dataUrl, widthPx: img.naturalWidth, heightPx: img.naturalHeight });
        img.onerror = reject;
        img.src = dataUrl;
      });
    })
    .catch(() => null);
}

function loadKopSuratImage(): Promise<{ dataUrl: string; widthPx: number; heightPx: number }> {
  return fetch(KOP_SURAT_URL)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(blob);
        })
    )
    .then((dataUrl) => {
      return new Promise<{ dataUrl: string; widthPx: number; heightPx: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ dataUrl, widthPx: img.naturalWidth, heightPx: img.naturalHeight });
        img.onerror = reject;
        img.src = dataUrl;
      });
    });
}

function loadInlineImage(src: string): Promise<{ dataUrl: string; widthPx: number; heightPx: number } | null> {
  if (!src || !src.trim()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve({ dataUrl, widthPx: img.naturalWidth, heightPx: img.naturalHeight });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const InvoicePDFExportButton: React.FC<InvoicePDFExportButtonProps> = ({
  invoice,
  fileName = `invoice-${invoice.invoice_number || invoice.id}.pdf`,
  className = '',
  children,
}) => {
  const generatePDF = async () => {
    let invoiceToUse = invoice;
    // Ambil invoice lengkap by ID agar items punya custom_num_* (Volume, Harga/Volume, dll) dari backend
    if (invoice.id != null) {
      const full = await invoiceApi.getInvoiceById(invoice.id);
      if (full) invoiceToUse = full;
    }
    if (invoiceToUse.template_id && (!invoiceToUse.template || !getTemplateItemColumns(invoiceToUse.template))) {
      const fetched = await invoiceApi.getTemplateById(Number(invoiceToUse.template_id));
      if (fetched) invoiceToUse = { ...invoiceToUse, template: fetched };
    }

    const [kop, ttdImg] = await Promise.all([
      loadKopSuratImage().catch(() => null),
      loadTtdImage(),
    ]);

    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFont('times', 'normal');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const bottomMargin = 10;
    const topMargin = 32;
    const maxY = pageHeight - bottomMargin;
    const template = invoiceToUse.template;
    const templateOpts = getTemplateDisplayOptions(template);
    const showKopNextPage = templateOpts?.show_kop_next_page === true;
    let y = topMargin;

    let kopSuratForNewPage: { dataUrl: string; heightMm: number } | null = null;
    if (kop) {
      const kopSuratHeightMm = PAGE_WIDTH_MM * (kop.heightPx / kop.widthPx);
      doc.addImage(kop.dataUrl, 'PNG', 0, 0, PAGE_WIDTH_MM, kopSuratHeightMm);
      y = kopSuratHeightMm + 6;
      kopSuratForNewPage = { dataUrl: kop.dataUrl, heightMm: kopSuratHeightMm };
    }

    const ensureSpace = (neededMm: number) => {
      if (y + neededMm > maxY) {
        doc.addPage();
        if (kopSuratForNewPage && showKopNextPage) {
          doc.addImage(kopSuratForNewPage.dataUrl, 'PNG', 0, 0, PAGE_WIDTH_MM, kopSuratForNewPage.heightMm);
          y = kopSuratForNewPage.heightMm + 6;
        } else {
          y = topMargin;
        }
      }
    };

    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    const labelNomor = 'Nomor ';
    const labelPerihal = 'Perihal ';
    const labelKepada = 'Kepada Yth ';
    const tabX = margin + Math.max(doc.getTextWidth(labelNomor), doc.getTextWidth(labelPerihal), doc.getTextWidth(labelKepada)) + 3;
    doc.text(labelNomor, margin, y);
    doc.setFont('times', 'bold');
    doc.text(": " + (invoiceToUse.invoice_number || '-'), tabX, y);
    doc.setFont('times', 'normal');
    doc.text(labelPerihal, margin, y + 5);
    doc.setFont('times', 'bold');
    doc.text(": " + (invoiceToUse.subject || 'Invoice'), tabX, y + 5);
    doc.setFont('times', 'normal');
    doc.text(labelKepada, margin, y + 10);
    doc.setFont('times', 'bold');
    doc.text(": " + (invoiceToUse.customer_name || '-'), tabX, y + 10);
    doc.setFont('times', 'normal');
    const locDate = ['Batam', formatDateOnly(invoiceToUse.invoice_date || '')].filter(Boolean).join(', ');
    if (locDate) doc.text(locDate, pageWidth - margin, y, { align: 'right' });
    y += 10;
    if (invoiceToUse.customer_email?.trim()) {
      doc.setFontSize(12);
      doc.text(`Email: ${invoiceToUse.customer_email.trim()}`, margin, y + 5);
      doc.setTextColor(0, 0, 0);
      y += 5;
    }
    y += 10;

    const isDumpTruck = (name: string) => /dump\s*truck|dumptruck|roda\s*6/i.test(name);
    const onlyDumpTruck = (name: string) => isDumpTruck(name) && !name.includes(' dan ');
    const introText = (() => {
      const customIntro = invoiceToUse.intro_paragraph || '';
      const templateIntro = template?.default_intro || '';
      const eq = (invoiceToUse.equipment_name || '').trim();
      const loc = (invoiceToUse.location || '').trim();
      let raw = customIntro.trim() ? customIntro : (templateIntro.trim() ? templateIntro : '');
      if (raw) {
        return replaceIntroPlaceholders(
          raw,
          eq,
          loc,
          invoiceToUse.equipment_name_manual,
          invoiceToUse.equipment_name_alat_berat,
          invoiceToUse.equipment_name_dumptruck
        );
      }
      if (eq && loc) {
        if (onlyDumpTruck(eq)) {
          return `Dengan Hormat,\n\tBersama surat ini kami dari PT Indira Maju Bersama ingin mengajukan tagihan Dumptruck roda 6 dilokasi ${loc} dengan rincian sebagai berikut:`;
        }
        return `Dengan Hormat,\n\tBersama surat ini kami dari PT Indira Maju Bersama ingin mengajukan tagihan sewa alat berat berupa ${eq} dilokasi ${loc} dengan rincian sebagai berikut:`;
      }
      if (eq && onlyDumpTruck(eq)) {
        return `Dengan Hormat,\n\tBersama surat ini kami dari PT Indira Maju Bersama ingin mengajukan tagihan Dumptruck roda 6 dengan rincian sebagai berikut:`;
      }
      return 'Dengan Hormat,\n\tBersama surat ini kami dari PT Indira Maju Bersama ingin mengajukan tagihan sewa alat berat dengan rincian sebagai berikut:';
    })();
    if (introText && introText.trim()) {
      ensureSpace(25);
      doc.setFontSize(12);
      const maxTextWidth = pageWidth - 2 * margin;
      const lineHeight = 5; // jarak vertikal tiap baris (termasuk "Dengan Hormat," ke "Bersama surat ini...")
      const parts = introText.split('\n');
      for (const part of parts) {
        const withIndent = part.replace(/^(\s+)/, (m) => '\u00A0'.repeat(m.length));
        const wrapped = doc.splitTextToSize(withIndent, maxTextWidth);
        doc.text(wrapped, margin, y);
        y += wrapped.length * lineHeight;
      }
      const spacingIntroToTable = -3; // jarak dari paragraf "Bersama surat ini..." ke tabel (mm)
      y += spacingIntroToTable;
    }

    const templateColumnsRaw = getTemplateItemColumns(template);
    const showNo = templateOpts?.show_no !== false;
    const showDate = templateOpts?.show_date !== false;
    const showTotal = templateOpts?.show_total !== false;
    const showGrandTotal = templateOpts?.show_grand_total !== false;
    const docType = (template?.document_type || 'invoice').toLowerCase();
    const templateColumns =
      templateColumnsRaw?.length
        ? templateColumnsRaw.filter((c) => (c.key === 'row_date' && !showDate) || (c.key === 'total' && !showTotal) ? false : true)
        : null;
    const injectDateColumn = false;
    const useBbm = !templateColumns && (templateOpts?.use_bbm_columns ?? invoiceToUse.use_bbm_columns);
    const qtyLabel =
      (templateOpts?.quantity_unit || invoiceToUse.quantity_unit) === 'jam'
        ? 'Jam'
        : (templateOpts?.quantity_unit || invoiceToUse.quantity_unit) === 'unit'
          ? 'Unit'
          : (templateOpts?.quantity_unit || invoiceToUse.quantity_unit) === 'jerigen'
            ? 'Jerigen'
            : (templateOpts?.quantity_unit || invoiceToUse.quantity_unit) === 'volume'
              ? 'Volume'
              : 'Hari';
    const priceLabel =
      templateOpts?.price_unit_label ||
      invoiceToUse.price_unit_label ||
      (invoiceToUse.quantity_unit === 'jam' ? 'Harga/Jam' : invoiceToUse.quantity_unit === 'unit' ? 'Harga/Unit' : invoiceToUse.quantity_unit === 'jerigen' ? 'Harga/Jerigen' : invoiceToUse.quantity_unit === 'volume' ? 'Harga/Volume' : 'Harga/Hari');
    const itemsList = invoiceToUse.items || [];
    let total = invoiceToUse.total ?? itemsList.reduce((s, i) => s + (i.total ?? 0), 0);
    if (templateColumns?.length) {
      let totalColIdx = templateColumns.findIndex((c) => c.use_as_invoice_total);
      if (totalColIdx < 0) {
        totalColIdx = templateColumns.length - 1;
        while (totalColIdx >= 0 && templateColumns[totalColIdx].key !== 'formula') totalColIdx--;
      }
      if (totalColIdx >= 0) {
        const sumFromColumn = itemsList.reduce(
          (s, item) => s + getItemCellNumericValue(item, templateColumns[totalColIdx], templateColumns, totalColIdx),
          0
        );
        if (Number.isFinite(sumFromColumn)) total = sumFromColumn;
      }
    }
    const getRowTotalForSum = (item: typeof itemsList[0]): number => {
      if (!templateColumns?.length) return Number(item.total ?? 0);
      let totalColIdx = templateColumns.findIndex((c) => c.use_as_invoice_total);
      if (totalColIdx < 0) {
        totalColIdx = templateColumns.length - 1;
        while (totalColIdx >= 0 && templateColumns[totalColIdx].key !== 'formula') totalColIdx--;
      }
      if (totalColIdx >= 0) {
        return getItemCellNumericValue(item, templateColumns[totalColIdx], templateColumns, totalColIdx);
      }
      return Number(item.total ?? 0);
    };

    const getGroupKey = (item: typeof itemsList[0]) => {
      const eg = (item.equipment_group || '').trim();
      return eg || '__default__';
    };
    const orderedGroupKeys: string[] = [];
    for (const item of itemsList) {
      const k = getGroupKey(item);
      if (!orderedGroupKeys.includes(k)) orderedGroupKeys.push(k);
    }
    const groupByUnit = itemsList.reduce<Record<string, { days: number; bbm: number; total: number; label: string }>>((acc, item) => {
      const key = getGroupKey(item);
      if (!acc[key]) acc[key] = { days: 0, bbm: 0, total: 0, label: key === '__default__' ? (item.item_name || '').trim() || 'Unit 1' : (item.equipment_group || item.item_name || '').trim() || '-' };
      acc[key].days += Number(useBbm ? (item.days ?? item.quantity ?? 0) : (item.quantity ?? item.days ?? 0));
      acc[key].bbm += Number(item.bbm_quantity ?? 0);
      acc[key].total += getRowTotalForSum(item);
      if (key === '__default__' && !acc[key].label) acc[key].label = (item.item_name || '').trim() || 'Unit 1';
      return acc;
    }, {});
    Object.keys(groupByUnit).forEach((k) => { if (k === '__default__' && groupByUnit[k]) groupByUnit[k].label = groupByUnit[k].label || 'Unit 1'; });

    const itemColLabel = (templateOpts?.item_column_label || invoiceToUse.item_column_label || 'Keterangan').trim() || 'Keterangan';
    const headRow = templateColumns?.length
      ? [...(showNo ? ['No'] : []), ...(injectDateColumn ? ['Tanggal'] : []), ...templateColumns.map((c) => formatLabelWithSubscript(c.label))]
      : useBbm
        ? [...['No', ...(showDate ? ['Tanggal'] : []), qtyLabel, priceLabel, 'Bbm (Jerigen)', 'Harga/Bbm'], ...(showTotal ? ['Jumlah'] : [])]
        : [...['No', ...(showDate ? ['Tanggal'] : []), itemColLabel, qtyLabel, priceLabel], ...(showTotal ? ['Jumlah'] : [])];

    const spacingAfterTable = 3;
    doc.setFontSize(12);
    const showUnitTitles = orderedGroupKeys.length >= 2;
    const numCols = templateColumns?.length
      ? (showNo ? 1 : 0) + (injectDateColumn ? 1 : 0) + templateColumns.length
      : useBbm
        ? 5 + (showDate ? 1 : 0) + (showTotal ? 1 : 0)
        : 4 + (showDate ? 1 : 0) + (showTotal ? 1 : 0);
    const qtyColIdx = templateColumns ? templateColumns.findIndex((c) => c.key === 'quantity' || c.key === 'days') : -1;
    const qtyColIndexTemplate = templateColumns && qtyColIdx >= 0 ? (showNo ? 1 : 0) + (injectDateColumn ? 1 : 0) + qtyColIdx : -1;

    for (const groupKey of orderedGroupKeys) {
      ensureSpace(35);
      const groupItems = itemsList.filter((i) => getGroupKey(i) === groupKey);
      const groupItemsSorted = [...groupItems];
      const g = groupByUnit[groupKey];
      const label = (g && g.label) ? g.label.toUpperCase() : (groupKey === '__default__' ? 'UNIT 1' : groupKey.toUpperCase());
      const sumT = g ? g.total : 0;

      const tableData = templateColumns?.length
        ? groupItemsSorted.map((item, idx) => [
            ...(showNo ? [String(idx + 1)] : []),
            ...(injectDateColumn ? [getItemCellValue(item, { key: 'row_date', label: 'Tanggal' }, templateColumns, -1, formatRupiah, formatDateOnly, idx)] : []),
            ...(templateColumns ?? []).map((c, colIndex) => getItemCellValue(item, c, templateColumns ?? [], colIndex, formatRupiah, formatDateOnly, idx)),
          ])
        : groupItemsSorted.map((item, idx) => {
            const tot = Number(item.total ?? 0);
            const no = String(idx + 1);
            const tanggalBbm = (item.row_date || '').trim() ? formatDateOnly(String(item.row_date)) : '-';
            const tanggalSimple = (item.row_date || '').trim() ? formatDateOnly(String(item.row_date)) : '-';
            if (useBbm) {
              return [
                no,
                ...(showDate ? [tanggalBbm] : []),
                String(item.days ?? 0),
                Number(item.price ?? 0) === 0 ? '-' : formatRupiah(Number(item.price ?? 0)),
                (item.bbm_quantity ?? 0) > 0 ? String(item.bbm_quantity) : '-',
                (item.bbm_quantity ?? 0) > 0 ? formatRupiah(Number(item.bbm_unit_price ?? 0)) : '-',
                ...(showTotal ? [formatRupiah(tot)] : []),
              ];
            }
            return [...[no], ...(showDate ? [tanggalSimple] : []), item.item_name || '-', String(item.quantity ?? item.days ?? 0), Number(item.price ?? 0) === 0 ? '-' : formatRupiah(Number(item.price ?? 0)), ...(showTotal ? [formatRupiah(tot)] : [])];
          });

      const sumH = g ? g.days : 0;
      const sumB = g ? g.bbm : 0;
      const totalRow = showTotal && showGrandTotal
        ? (templateColumns?.length
            ? (() => {
                const mergeCols = (showNo ? 1 : 0) + (injectDateColumn ? 1 : 0) + 1;
                const remainingCells: (string | number)[] = [];
                const hasFooterTotals = templateColumns.some((c) => c.show_total_in_footer);
                for (let i = 1; i < templateColumns.length; i++) {
                  const col = templateColumns[i];
                  if (col.show_total_in_footer) {
                    const sum = groupItemsSorted.reduce(
                      (s, item) => s + getItemCellNumericValue(item, col, templateColumns, i),
                      0
                    );
                    remainingCells.push(formatColumnTotal(col, sum));
                  } else {
                    remainingCells.push(hasFooterTotals ? '' : (i === templateColumns.length - 1 ? formatRupiah(sumT) : ''));
                  }
                }
                return [{ content: 'Total Keseluruhan', colSpan: mergeCols, styles: { halign: 'left' as const } }, ...remainingCells];
              })()
            : useBbm
              ? [{ content: 'Total Keseluruhan', colSpan: showDate ? 2 : 1, styles: { halign: 'left' as const } }, String(sumH), '', String(sumB), ...(showDate ? ['', formatRupiah(sumT)] : [formatRupiah(sumT)])]
              : [{ content: 'Total Keseluruhan', colSpan: showDate ? 3 : 2, styles: { halign: 'left' as const } }, String(sumH), '', formatRupiah(sumT)])
        : null;
      const bodyWithTotal = totalRow ? [...tableData, totalRow] : tableData;

      const tableHead: (string[] | { content: string; colSpan: number; styles: Record<string, unknown> }[])[] = showUnitTitles
        ? [[{ content: label, colSpan: numCols, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontSize: 11, font: 'times' } }], headRow]
        : [headRow];

      const qtyColIndex = templateColumns?.length ? (qtyColIndexTemplate >= 0 ? qtyColIndexTemplate : showNo ? 1 : 0) : useBbm ? 2 : 3;
      const headColOffset = (showNo ? 1 : 0) + (injectDateColumn ? 1 : 0);
      const columnStyles: Record<number, { halign: 'left' | 'center' | 'right'; valign?: 'top' | 'middle' | 'bottom'; cellWidth?: number; cellPadding?: number }> = {};
      if (showNo) {
        columnStyles[0] = { halign: 'center', valign: 'middle', cellWidth: 15, cellPadding: 2 };
      }
      if (templateColumns?.length) {
        templateColumns.forEach((col, idx) => {
          const colIndex = headColOffset + idx;
          const align = col.contentAlign ?? 'center';
          columnStyles[colIndex] = { ...columnStyles[colIndex], halign: align };
        });
        if (qtyColIndex >= 0 && columnStyles[qtyColIndex] == null) columnStyles[qtyColIndex] = { halign: 'center' };
      } else {
        columnStyles[qtyColIndex] = { halign: 'center' };
      }
      const rowHeightMode = templateOpts?.item_row_height ?? 'compact';
      // Padding vertikal dalam sel (atas-bawah)
      const itemCellPadding =
        rowHeightMode === 'very_compact'
          ? { top: 0.5, right: 2, bottom: 0.5, left: 2 }
          : rowHeightMode === 'compact'
            ? { top: 1, right: 2, bottom: 1, left: 2 }
            : rowHeightMode === 'relaxed'
              ? { top: 5, right: 2, bottom: 5, left: 2 }
              : { top: 2.5, right: 2, bottom: 2.5, left: 2 };
      // Tinggi baris minimal (mm)
      const itemMinCellHeight =
        rowHeightMode === 'very_compact'
          ? 3.5
          : rowHeightMode === 'compact'
            ? 5
            : rowHeightMode === 'relaxed'
              ? 12
              : 8;
      autoTable(doc, {
        startY: y,
        head: tableHead as any,
        body: bodyWithTotal,
        theme: 'grid',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          font: 'times',
          fontSize: 12,
          valign: 'middle',
          cellPadding: itemCellPadding,
          minCellHeight: itemMinCellHeight,
        },
        bodyStyles: {
          font: 'times',
          fontSize: 11,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          cellPadding: itemCellPadding,
          valign: 'middle',
          minCellHeight: itemMinCellHeight,
        },
        columnStyles,
        margin: { left: margin, right: margin },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.1,
        showHead: 'everyPage',
        didParseCell: (data) => {
          // Paksa vertical middle alignment untuk semua sel
          data.cell.styles.valign = 'middle';
          // Paksa minCellHeight dan cellPadding per sel (override autoTable default)
          data.cell.styles.minCellHeight = itemMinCellHeight;
          data.cell.styles.cellPadding = itemCellPadding;
          
          if (totalRow && data.section === 'body' && data.row.index === bodyWithTotal.length - 1) {
            data.cell.styles.fillColor = [255, 255, 255];
            data.cell.styles.textColor = [0, 0, 0];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.cellPadding = { top: 3, right: 2, bottom: 3, left: 2 };
            const colIndex = (data.column as { index?: number })?.index ?? 0;
            if (colIndex === 0) data.cell.styles.halign = 'left';
          }
          const colIndex = (data.column as { index?: number })?.index ?? 0;
          if (showNo && colIndex === 0) {
            data.cell.styles.halign = 'center';
          }
          if (templateColumns?.length && data.section === 'head' && data.column) {
            const headRowIndex = tableHead.length - 1;
            if (data.row.index === headRowIndex) {
              const ti = colIndex - headColOffset;
              if (ti >= 0 && ti < templateColumns.length) {
                data.cell.styles.halign = templateColumns[ti].headerAlign ?? 'center';
              }
            }
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + spacingAfterTable;
    }

    const jmlJenisAlat = orderedGroupKeys.length >= 2 ? orderedGroupKeys.length : 0;
    if (showTotal && showGrandTotal && jmlJenisAlat >= 2) {
      ensureSpace(30);
      const grandHeadRow = useBbm ? ['No', 'Keterangan', 'Jumlah ' + qtyLabel, 'Jumlah BBM', 'Jumlah'] : ['No', 'Keterangan', 'Jumlah'];
      const grandNumCols = useBbm ? 5 : 3;
      type GrandRow = (string | { content: string; colSpan: number })[];
      const grandRows: GrandRow[] = orderedGroupKeys.map((key, i) => {
        const g = groupByUnit[key];
        if (!g) return [String(i + 1), key, '', '', formatRupiah(0)];
        return [
          String(i + 1),
          g.label,
          ...(useBbm ? [String(g.days), String(g.bbm), formatRupiah(g.total)] : [formatRupiah(g.total)]),
        ];
      });
      grandRows.push(
        useBbm
          ? [{ content: 'Total Keseluruhan', colSpan: 2 }, '', '', formatRupiah(total)]
          : [{ content: 'Total Keseluruhan', colSpan: 2 }, formatRupiah(total)]
      );
      autoTable(doc, {
        startY: y,
        head: [[{ content: 'GRAND TOTAL', colSpan: grandNumCols, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontSize: 11, font: 'times' } }], grandHeadRow] as any,
        body: grandRows as any,
        theme: 'grid',
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], font: 'times', fontSize: 12 },
        bodyStyles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
        ...(useBbm ? { columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' } } } : {}),
        margin: { left: margin, right: margin },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.1,
        showHead: 'everyPage',
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index === grandRows.length - 1) {
            data.cell.styles.fillColor = [255, 255, 255];
            data.cell.styles.textColor = [0, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      y += 2;
    }
    ensureSpace(45);
    doc.setFontSize(12);
    y += 2;
    if (templateOpts?.include_bbm_note ?? invoiceToUse.include_bbm_note) {
      doc.setFontSize(12);
      doc.text('Note: Sudah termasuk BBM', margin, y);
      y += 2;
    }
    if (showGrandTotal) {
      const terbilangWords = (invoiceToUse.terbilang_custom || '').trim()
        ? (invoiceToUse.terbilang_custom || '').trim()
        : `${terbilang(Math.round(total))} Rupiah`;
      const terbilangStr = `Terbilang: (${terbilangWords})`;
      const terbilangLines = doc.splitTextToSize(terbilangStr, pageWidth - 2 * margin);
      const lineHeightTerbilang = 6;
      for (const line of terbilangLines) {
        doc.text(line, margin, y);
        y += lineHeightTerbilang;
      }
      y += 4;
    }
    const showBankAccount = templateOpts?.show_bank_account !== false;
    if (showBankAccount && invoiceToUse.bank_account) {
      doc.setFont('times', 'bold');
      doc.text('No Rekening: ' + invoiceToUse.bank_account, margin, y);
      doc.setFont('times', 'normal');
      y += 6;
    }
    if (invoiceToUse.notes) doc.text(invoiceToUse.notes, margin, y);
    y += 8;

    ensureSpace(60);
    doc.setFontSize(12);
    const closingText = docType === 'penawaran'
      ? 'Demikian surat penawaran ini kami sampaikan, atas kerjasamanya kami ucapkan terimakasih.'
      : 'Demikian surat tagihan ini kami sampaikan, atas kerjasamanya kami ucapkan terimakasih.';
    doc.text(closingText, margin, y);
    y += 14;

    const sigCount = template?.signature_count === 1 ? 1 : 2;
    const colRightX = 145;
    const leftBlockX = margin;
    const sigBlockTopY = y;

    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    const ptWidth = doc.getTextWidth('PT. INDIRA MAJU BERSAMA');
    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    const hormatWidth = doc.getTextWidth('Hormat Kami,');

    if (sigCount === 2) {
      const hormatX = leftBlockX + (ptWidth - hormatWidth) / 2;
      doc.text('Hormat Kami,', hormatX, y);
      y += 8;
      doc.setFont('times', 'bold');
      doc.text('PT. INDIRA MAJU BERSAMA', leftBlockX, y - 3);
      y += 10;
      const ttdHeightMm = 40;
      if (ttdImg) y += ttdHeightMm + 4;
      y += 14;
      let rusliY = y;
      if (ttdImg) {
        const ttdWidthMm = ttdHeightMm * (ttdImg.widthPx / ttdImg.heightPx);
        const ttdX = leftBlockX + (ptWidth - ttdWidthMm) / 2;
        const ttdY = rusliY - ttdHeightMm - 4;
        doc.addImage(ttdImg.dataUrl, 'PNG', ttdX, ttdY - 36, ttdWidthMm, ttdHeightMm);
      }
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      const rusliW = doc.getTextWidth('RUSLI');
      const rusliX = leftBlockX + (ptWidth - rusliW) / 2;
      y -= 45;
      rusliY = y;
      doc.text('RUSLI', rusliX, rusliY);
      doc.setDrawColor(0, 0, 0);
      doc.line(rusliX - 2, rusliY + 1.5, rusliX + rusliW + 4, rusliY + 1.5);
      y += 6;
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      const direkturW = doc.getTextWidth('Direktur');
      const direkturX = leftBlockX + (ptWidth - direkturW) / 2;
      doc.text('Direktur', direkturX, y);
      doc.setFontSize(12);
      doc.text('Diterima Oleh,', colRightX + 6, sigBlockTopY);
      doc.setTextColor(0, 0, 0);
      doc.text('___________________', colRightX, sigBlockTopY + 32);
    } else {
      // 1 TTD: kanan saja — satu blok di sisi kanan
      const blockCenterX = colRightX + 25;
      doc.text('Hormat Kami,', blockCenterX, sigBlockTopY, { align: 'center' });
      y = sigBlockTopY + 8;
      doc.setFont('times', 'bold');
      doc.text('PT. INDIRA MAJU BERSAMA', blockCenterX, y - 3, { align: 'center' });
      y += 10;
      const ttdHeightMm = 40;
      if (ttdImg) y += ttdHeightMm + 4;
      y += 14;
      if (ttdImg) {
        const ttdWidthMm = ttdHeightMm * (ttdImg.widthPx / ttdImg.heightPx);
        const ttdX = blockCenterX - ttdWidthMm / 2;
        const ttdY = y - ttdHeightMm - 4;
        doc.addImage(ttdImg.dataUrl, 'PNG', ttdX, ttdY - 36, ttdWidthMm, ttdHeightMm);
      }
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      const rusliW = doc.getTextWidth('RUSLI');
      doc.text('RUSLI', blockCenterX, y - 45, { align: 'center' });
      doc.setDrawColor(0, 0, 0);
      doc.line(blockCenterX - rusliW / 2 - 2, y - 45 + 1.5, blockCenterX + rusliW / 2 + 4, y - 45 + 1.5);
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      doc.text('Direktur', blockCenterX, y - 45 + 6, { align: 'center' });
    }

    const attachments = (invoiceToUse.attachments || []).filter((a) => (a?.image_url || '').trim() !== '');
    const rawPerPage = Number(invoiceToUse.attachment_photos_per_page ?? 1);
    const photosPerPage = [1, 2, 3, 4, 6].includes(rawPerPage) ? rawPerPage : 1;
    const attachmentTitle = (() => {
      const custom = (invoiceToUse.attachment_title || '').trim();
      if (custom) return custom;
      const eq = (invoiceToUse.equipment_name || 'ALAT BERAT').trim().toUpperCase();
      const loc = (invoiceToUse.location || '').trim().toUpperCase();
      return `FOTO - FOTO KEGIATAN SEWA ALAT BERAT (${eq})${loc ? ` DI ${loc}` : ''}.`;
    })();
    const attachmentLayout = (() => {
      if (photosPerPage === 1) return { cols: 1, rows: 1 };
      if (photosPerPage === 2) return { cols: 1, rows: 2 };
      if (photosPerPage === 3) return { cols: 1, rows: 3 };
      if (photosPerPage === 4) return { cols: 2, rows: 2 };
      return { cols: 2, rows: 3 };
    })();
    for (let start = 0; start < attachments.length; start += photosPerPage) {
      const pageItems = attachments.slice(start, start + photosPerPage);
      doc.addPage();
      if (kopSuratForNewPage) {
        doc.addImage(kopSuratForNewPage.dataUrl, 'PNG', 0, 0, PAGE_WIDTH_MM, kopSuratForNewPage.heightMm);
        y = kopSuratForNewPage.heightMm + 8;
      } else {
        y = topMargin;
      }
      const boxHeight = 17;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, pageWidth - margin * 2, boxHeight);
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      const titleLines = doc.splitTextToSize(attachmentTitle, pageWidth - margin * 2 - 4);
      doc.text(titleLines.slice(0, 2), pageWidth / 2, y + 6, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`NO INV : ${invoiceToUse.invoice_number || '-'}`, pageWidth / 2, y + boxHeight - 4, { align: 'center' });
      y += boxHeight + 6;

      const cols = attachmentLayout.cols;
      const rows = attachmentLayout.rows;
      const gap = 5;
      const gridTop = y;
      const gridBottom = pageHeight - bottomMargin;
      const cellWidth = (pageWidth - margin * 2 - gap * (cols - 1)) / cols;
      const cellHeight = (gridBottom - gridTop - gap * (rows - 1)) / rows;
      doc.setFont('times', 'normal');
      doc.setFontSize(10);

      for (let idx = 0; idx < pageItems.length; idx++) {
        const att = pageItems[idx];
        const img = await loadInlineImage(att.image_url);
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const cellX = margin + col * (cellWidth + gap);
        const cellY = gridTop + row * (cellHeight + gap);
        let textY = cellY;
        if ((att.caption || '').trim()) {
          const captionLines = doc.splitTextToSize(String(att.caption).trim(), cellWidth);
          const cappedLines = captionLines.slice(0, 3);
          doc.text(cappedLines, cellX, textY);
          textY += cappedLines.length * 4 + 1;
        }
        const imageTop = textY;
        const maxW = cellWidth;
        const maxH = cellHeight - (imageTop - cellY);
        if (!img || maxH <= 0) {
          doc.text('Gambar tidak tersedia', cellX, imageTop + 3);
          continue;
        }
        const ratio = Math.min(maxW / img.widthPx, maxH / img.heightPx);
        const drawW = img.widthPx * ratio;
        const drawH = img.heightPx * ratio;
        const imgX = cellX + (maxW - drawW) / 2;
        doc.addImage(img.dataUrl, 'JPEG', imgX, imageTop, drawW, drawH);
      }
    }

    doc.save(fileName);
  };

  return (
    <button type="button" onClick={generatePDF} className={className || 'text-orange-600 hover:text-orange-700 text-sm font-medium'}>
      {children ?? 'Download PDF'}
    </button>
  );
};

export default InvoicePDFExportButton;
