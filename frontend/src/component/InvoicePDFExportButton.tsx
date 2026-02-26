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
  show_bank_account: boolean;
  use_bbm_columns: boolean;
  include_bbm_note: boolean;
  quantity_unit: string;
  price_unit_label: string;
  item_column_label: string;
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
  return {
    show_no: parsed?.show_no !== false,
    show_date: parsed?.show_date !== false,
    show_total: parsed?.show_total !== false,
    show_bank_account: parsed?.show_bank_account !== false,
    use_bbm_columns: !!parsed?.use_bbm_columns,
    include_bbm_note: !!parsed?.include_bbm_note,
    quantity_unit: parsed?.quantity_unit || 'hari',
    price_unit_label: parsed?.price_unit_label || 'Harga/Hari',
    item_column_label: parsed?.item_column_label || 'Keterangan',
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
  if (column.key === 'no') {
    return String((rowIndex ?? 0) + 1);
  }
  if (column.formula) {
    const row: Parameters<typeof getComputedFormulaValues>[0] = {
      quantity: item.quantity ?? 0,
      days: item.days ?? item.quantity ?? 0,
      price: item.price ?? 0,
      bbm_quantity: item.bbm_quantity ?? 0,
      bbm_unit_price: item.bbm_unit_price ?? 0,
    };
    const computed = getComputedFormulaValues(row, allColumns);
    const val = columnIndex >= 0 ? (computed[columnIndex] ?? NaN) : evaluateFormula(column.formula, row);
    return Number.isFinite(val) ? formatRupiahFn(val) : '-';
  }
  const key = column.key;
  switch (key) {
    case 'item_name':
      return (item.item_name || '-').trim() || '-';
    case 'description':
      return (item.description || '-').trim() || '-';
    case 'quantity':
      return String(item.quantity ?? item.days ?? 0);
    case 'days':
      return String(item.days ?? item.quantity ?? 0);
    case 'price':
      return formatRupiahFn(Number(item.price ?? 0));
    case 'bbm_quantity':
      return (item.bbm_quantity ?? 0) > 0 ? String(item.bbm_quantity) : '-';
    case 'bbm_unit_price':
      return (item.bbm_quantity ?? 0) > 0 ? formatRupiahFn(Number(item.bbm_unit_price ?? 0)) : '-';
    case 'total':
      return formatRupiahFn(Number(item.total ?? 0));
    case 'row_date':
      return (item.row_date || '').trim() ? formatDateOnlyFn(String(item.row_date)) : '-';
    default:
      return (item as unknown as Record<string, unknown>)[key] != null ? String((item as unknown as Record<string, unknown>)[key]) : '-';
  }
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

const InvoicePDFExportButton: React.FC<InvoicePDFExportButtonProps> = ({
  invoice,
  fileName = `invoice-${invoice.invoice_number || invoice.id}.pdf`,
  className = '',
  children,
}) => {
  const generatePDF = async () => {
    let invoiceToUse = invoice;
    if (invoice.template_id && (!invoice.template || !getTemplateItemColumns(invoice.template))) {
      const fetched = await invoiceApi.getTemplateById(Number(invoice.template_id));
      if (fetched) invoiceToUse = { ...invoice, template: fetched };
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
        if (kopSuratForNewPage) {
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

    const template = invoiceToUse.template;
    const isDumpTruck = (name: string) => /dump\s*truck|dumptruck|roda\s*6/i.test(name);
    const onlyDumpTruck = (name: string) => isDumpTruck(name) && !name.includes(' dan ');
    const introText = (() => {
      const customIntro = (invoiceToUse.intro_paragraph || '').trim();
      const templateIntro = (template?.default_intro || '').trim();
      const eq = (invoiceToUse.equipment_name || '').trim();
      const loc = (invoiceToUse.location || '').trim();
      let raw = customIntro || templateIntro;
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
    if (introText) {
      ensureSpace(25);
      doc.setFontSize(12);
      const maxTextWidth = pageWidth - 2 * margin;
      const lineHeight = 5; // jarak vertikal tiap baris (termasuk "Dengan Hormat," ke "Bersama surat ini...")
      const parts = introText.split('\n');
      for (const part of parts) {
        const wrapped = doc.splitTextToSize(part, maxTextWidth);
        doc.text(wrapped, margin, y);
        y += wrapped.length * lineHeight;
      }
      const spacingIntroToTable = -3; // jarak dari paragraf "Bersama surat ini..." ke tabel (mm)
      y += spacingIntroToTable;
    }

    const templateOpts = getTemplateDisplayOptions(template);
    const templateColumnsRaw = getTemplateItemColumns(template);
    const showNo = templateOpts?.show_no !== false;
    const showDate = templateOpts?.show_date !== false;
    const showTotal = templateOpts?.show_total !== false;
    const templateColumns =
      templateColumnsRaw?.length
        ? templateColumnsRaw.filter((c) => (c.key === 'row_date' && !showDate) || (c.key === 'total' && !showTotal) ? false : true)
        : null;
    const hasRowDateInTemplate = templateColumns?.some((c) => c.key === 'row_date');
    const injectDateColumn = !!templateColumns?.length && showDate && !hasRowDateInTemplate;
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
    const total = invoiceToUse.total ?? itemsList.reduce((s, i) => s + (i.total ?? 0), 0);

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
      acc[key].total += Number(item.total ?? 0);
      if (key === '__default__' && !acc[key].label) acc[key].label = (item.item_name || '').trim() || 'Unit 1';
      return acc;
    }, {});
    Object.keys(groupByUnit).forEach((k) => { if (k === '__default__' && groupByUnit[k]) groupByUnit[k].label = groupByUnit[k].label || 'Unit 1'; });

    const itemColLabel = (templateOpts?.item_column_label || invoiceToUse.item_column_label || 'Keterangan').trim() || 'Keterangan';
    const headRow = templateColumns?.length
      ? [...(showNo ? ['No'] : []), ...(injectDateColumn ? ['Tanggal'] : []), ...templateColumns.map((c) => c.label)]
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
      const groupItemsSorted = [...groupItems].sort((a, b) => {
        const da = (a.row_date || '').trim();
        const db = (b.row_date || '').trim();
        if (!da) return 1;
        if (!db) return -1;
        return da < db ? -1 : da > db ? 1 : 0;
      });
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
                formatRupiah(Number(item.price ?? 0)),
                (item.bbm_quantity ?? 0) > 0 ? String(item.bbm_quantity) : '-',
                (item.bbm_quantity ?? 0) > 0 ? formatRupiah(Number(item.bbm_unit_price ?? 0)) : '-',
                ...(showTotal ? [formatRupiah(tot)] : []),
              ];
            }
            return [...[no], ...(showDate ? [tanggalSimple] : []), item.item_name || '-', String(item.quantity ?? item.days ?? 0), formatRupiah(Number(item.price ?? 0)), ...(showTotal ? [formatRupiah(tot)] : [])];
          });

      const sumH = g ? g.days : 0;
      const sumB = g ? g.bbm : 0;
      const totalRow = showTotal
        ? (templateColumns?.length
            ? [{ content: 'Total', colSpan: (showNo ? 1 : 0) + (injectDateColumn ? 1 : 0) + templateColumns.length - 1 }, formatRupiah(sumT)]
            : useBbm
              ? [{ content: 'Total', colSpan: showDate ? 2 : 1 }, String(sumH), '', String(sumB), ...(showDate ? ['', formatRupiah(sumT)] : [formatRupiah(sumT)])]
              : [{ content: 'Total', colSpan: showDate ? 3 : 2 }, String(sumH), '', formatRupiah(sumT)])
        : null;
      const bodyWithTotal = totalRow ? [...tableData, totalRow] : tableData;

      const tableHead: (string[] | { content: string; colSpan: number; styles: Record<string, unknown> }[])[] = showUnitTitles
        ? [[{ content: label, colSpan: numCols, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontSize: 11, font: 'times' } }], headRow]
        : [headRow];

      const qtyColIndex = templateColumns?.length ? (qtyColIndexTemplate >= 0 ? qtyColIndexTemplate : showNo ? 1 : 0) : useBbm ? 2 : 3;
      autoTable(doc, {
        startY: y,
        head: tableHead as any,
        body: bodyWithTotal,
        theme: 'grid',
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], font: 'times', fontSize: 12 },
        bodyStyles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
        columnStyles: { [qtyColIndex]: { halign: 'center' } },
        margin: { left: margin, right: margin },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.1,
        showHead: 'everyPage',
        didParseCell: (data) => {
          if (totalRow && data.section === 'body' && data.row.index === bodyWithTotal.length - 1) {
            data.cell.styles.fillColor = [255, 255, 255];
            data.cell.styles.textColor = [0, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + spacingAfterTable;
    }

    const jmlJenisAlat = orderedGroupKeys.length >= 2 ? orderedGroupKeys.length : 0;
    if (showTotal && jmlJenisAlat >= 2) {
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
    doc.text('Demikian surat tagihan ini kami sampaikan, atas kerjasamanya kami ucapkan terimakasih.', margin, y);
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

    doc.save(fileName);
  };

  return (
    <button type="button" onClick={generatePDF} className={className || 'text-orange-600 hover:text-orange-700 text-sm font-medium'}>
      {children ?? 'Download PDF'}
    </button>
  );
};

export default InvoicePDFExportButton;
