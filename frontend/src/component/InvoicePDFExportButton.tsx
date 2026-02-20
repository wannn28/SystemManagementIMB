import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice } from '../types/invoice';

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
    doc.text(": " + (invoice.invoice_number || '-'), tabX, y);
    doc.setFont('times', 'normal');
    doc.text(labelPerihal, margin, y + 5);
    doc.setFont('times', 'bold');
    doc.text(": " + (invoice.subject || 'Invoice'), tabX, y + 5);
    doc.setFont('times', 'normal');
    doc.text(labelKepada, margin, y + 10);
    doc.setFont('times', 'bold');
    doc.text(": " + (invoice.customer_name || '-'), tabX, y + 10);
    doc.setFont('times', 'normal');
    const locDate = ['Batam', formatDateOnly(invoice.invoice_date || '')].filter(Boolean).join(', ');
    if (locDate) doc.text(locDate, pageWidth - margin, y, { align: 'right' });
    y += 10;
    if (invoice.customer_email?.trim()) {
      doc.setFontSize(12);
      doc.text(`Email: ${invoice.customer_email.trim()}`, margin, y + 5);
      doc.setTextColor(0, 0, 0);
      y += 5;
    }
    y += 10;

    const introText = (() => {
      const customIntro = (invoice.intro_paragraph || '').trim();
      if (customIntro) return customIntro;
      const eq = (invoice.equipment_name || '').trim();
      const loc = (invoice.location || '').trim();
      if (eq && loc) {
        return `Dengan Hormat,\n\tBersama surat ini kami dari PT Indira Maju Bersama ingin mengajukan tagihan sewa alat berat berupa ${eq} dilokasi ${loc} dengan rincian sebagai berikut:`;
      }
      // Default paragraf pembuka jika equipment_name/location belum ada (tetap tampilkan "Dengan Hormat")
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

    const useBbm = invoice.use_bbm_columns;
    const qtyLabel = (invoice.quantity_unit === 'jam' ? 'Jam' : invoice.quantity_unit === 'unit' ? 'Unit' : invoice.quantity_unit === 'jerigen' ? 'Jerigen' : 'Hari');
    const priceLabel = invoice.price_unit_label || (invoice.quantity_unit === 'jam' ? 'Harga/Jam' : invoice.quantity_unit === 'unit' ? 'Harga/Unit' : invoice.quantity_unit === 'jerigen' ? 'Harga/Jerigen' : 'Harga/Hari');
    const itemsList = invoice.items || [];
    const total = invoice.total ?? itemsList.reduce((s, i) => s + (i.total ?? 0), 0);

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

    const headRow = useBbm
      ? ['No', 'Tanggal', qtyLabel, priceLabel, 'Bbm (Jerigen)', 'Harga/Bbm', 'Jumlah']
      : ['No', 'Tanggal', (invoice.item_column_label || 'Keterangan').trim() || 'Keterangan', qtyLabel, priceLabel, 'Jumlah'];

    // Ketinggian jarak (mm): jarak antar tabel unit / ke Grand Total
    const spacingAfterTable = 3;

    doc.setFontSize(12);
    const showUnitTitles = orderedGroupKeys.length >= 2;
    const numCols = useBbm ? 7 : 6;
    for (const groupKey of orderedGroupKeys) {
      ensureSpace(35);
      const groupItems = itemsList.filter((i) => getGroupKey(i) === groupKey);
      const g = groupByUnit[groupKey];
      const label = (g && g.label) ? g.label.toUpperCase() : (groupKey === '__default__' ? 'UNIT 1' : groupKey.toUpperCase());

      const tableData = groupItems.map((item, idx) => {
        const tot = Number(item.total ?? 0);
        const no = String(idx + 1);
        const tanggalBbm = (item.row_date || '').trim() || '-';
        const tanggalSimple = (item.row_date || '').trim() || '-';
        if (useBbm) {
          return [
            no,
            tanggalBbm,
            String(item.days ?? 0),
            formatRupiah(Number(item.price ?? 0)),
            (item.bbm_quantity ?? 0) > 0 ? String(item.bbm_quantity) : '-',
            (item.bbm_quantity ?? 0) > 0 ? formatRupiah(Number(item.bbm_unit_price ?? 0)) : '-',
            formatRupiah(tot),
          ];
        }
        return [no, tanggalSimple, item.item_name || '-', String(item.quantity ?? item.days ?? 0), formatRupiah(Number(item.price ?? 0)), formatRupiah(tot)];
      });
      const sumH = g ? g.days : 0;
      const sumB = g ? g.bbm : 0;
      const sumT = g ? g.total : 0;
      // Total: label di-merge ke kiri (colSpan), isi putih seperti baris data
      const totalRow = useBbm
        ? [{ content: 'Total', colSpan: 2 }, String(sumH), '', String(sumB), '', formatRupiah(sumT)]
        : [{ content: 'Total', colSpan: 3 }, String(sumH), '', formatRupiah(sumT)];
      const bodyWithTotal = [...tableData, totalRow];

      const tableHead: (string[] | { content: string; colSpan: number; styles: Record<string, unknown> }[])[] = showUnitTitles
        ? [[{ content: label, colSpan: numCols, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontSize: 11, font: 'times' } }], headRow]
        : [headRow];

      const qtyColIndex = useBbm ? 2 : 3; // kolom Hari / quantity
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
          if (data.section === 'body' && data.row.index === bodyWithTotal.length - 1) {
            data.cell.styles.fillColor = [255, 255, 255];
            data.cell.styles.textColor = [0, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + spacingAfterTable;
    }

    const jmlJenisAlat = orderedGroupKeys.length >= 2 ? orderedGroupKeys.length : 0;
    if (jmlJenisAlat >= 2) {
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
    if (invoice.include_bbm_note) {
      doc.setFontSize(12);
      doc.text('Note: Sudah termasuk BBM', margin, y);
      y += 2;
    }
    const terbilangWords = (invoice.terbilang_custom || '').trim()
      ? (invoice.terbilang_custom || '').trim()
      : `${terbilang(Math.round(total))} Rupiah`;
    const terbilangStr = `Terbilang: (${terbilangWords})`;
    const terbilangLines = doc.splitTextToSize(terbilangStr, pageWidth - 2 * margin);
    const lineHeightTerbilang = 6;
    for (const line of terbilangLines) {
      doc.text(line, margin, y);
      y += lineHeightTerbilang;
    }
    y += 4;
    if (invoice.bank_account) {
      doc.setFont('times', 'bold');
      doc.text('No Rekening: ' + invoice.bank_account, margin, y);
      doc.setFont('times', 'normal');
      y += 6;
    }
    if (invoice.notes) doc.text(invoice.notes, margin, y);
    y += 8;

    ensureSpace(60);
    doc.setFontSize(12);
    doc.text('Demikian surat tagihan ini kami sampaikan, atas kerjasamanya kami ucapkan terimakasih.', margin, y);
    y += 14;

    const colRightX = 155;
    const leftBlockX = margin;
    const sigBlockTopY = y;

    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    const ptWidth = doc.getTextWidth('PT. INDIRA MAJU BERSAMA');
    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    const hormatWidth = doc.getTextWidth('Hormat Kami,');
    const hormatX = leftBlockX + (ptWidth - hormatWidth) / 2;
    doc.text('Hormat Kami,', hormatX, y);
    y += 8;

    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text('PT. INDIRA MAJU BERSAMA', leftBlockX, y-3);
    y += 10;

    // Ruang untuk tanda tangan (dan gambar TTD jika ada)
    const ttdHeightMm = 40;
    if (ttdImg) y += ttdHeightMm + 4;
    y += 14;

    let rusliY = y;
    if (ttdImg) {
      const ttdWidthMm = ttdHeightMm * (ttdImg.widthPx / ttdImg.heightPx);
      const ttdX = leftBlockX + (ptWidth - ttdWidthMm) / 2;
      const ttdY = rusliY - ttdHeightMm - 4;
      doc.addImage(ttdImg.dataUrl, 'PNG', ttdX, ttdY-36, ttdWidthMm, ttdHeightMm);
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const rusliW = doc.getTextWidth('RUSLI');
    const rusliX = leftBlockX + (ptWidth - rusliW) / 2;
    y-= 45;
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

    doc.save(fileName);
  };

  return (
    <button type="button" onClick={generatePDF} className={className || 'text-orange-600 hover:text-orange-700 text-sm font-medium'}>
      {children ?? 'Download PDF'}
    </button>
  );
};

export default InvoicePDFExportButton;
