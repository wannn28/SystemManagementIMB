import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinanceEntry } from '../types/BasicTypes'; // Sesuaikan path sesuai struktur project

interface FinancePDFExportButtonProps {
  data: FinanceEntry[];
  type: 'income' | 'expense';
  total: number;
  month?: string;
  year?: string;
  searchTerm?: string;
  category?: string;
}

const FinancePDFExportButton: React.FC<FinancePDFExportButtonProps> = ({
  data,
  type,
  total,
  month,
  year,
  searchTerm,
  category,
}) => {
  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Judul Laporan
    doc.setFontSize(16);
    const title = type === 'income' ? 'LAPORAN PEMASUKAN ' : 'LAPORAN PENGELUARAN';
    doc.text(title, pageWidth / 2, 20, { align: 'center' });

    // Informasi Periode
    let periodeText = '';
    if (month || year) {
      const monthName = new Date(`${year}-${month}-01`).toLocaleDateString('id-ID', { month: 'long' });
      periodeText = `Periode: ${monthName} ${year}`;
    } else if (year) {
      periodeText = `Tahun: ${year}`;
    }
    
    if (periodeText) {
      doc.setFontSize(12);
      doc.text(periodeText, pageWidth / 2, 27, { align: 'center' });
    }

    // Filter yang digunakan
    let filterInfo: string[] = [];
    if (searchTerm) filterInfo.push(`Pencarian: "${searchTerm}"`);
    if (category) filterInfo.push(`Kategori: ${category}`);
    
    if (filterInfo.length > 0) {
      doc.setFontSize(10);
      doc.text(filterInfo.join(', '), margin, 34);
    }

    // Tabel Data
    autoTable(doc, {
      startY: 40,
      head: [['No', 'Tanggal', 'Unit', 'Harga/Unit', 'Jumlah', 'Keterangan', 'Kategori', 'Status']],
      body: data.map((entry, index) => [
        index + 1,
        entry.tanggal.split('T')[0],
        entry.unit,
        `Rp ${entry.hargaPerUnit.toLocaleString('id-ID')}`,
        `Rp ${(entry.unit * entry.hargaPerUnit).toLocaleString('id-ID')}`,
        entry.keterangan,
        entry.category,
        entry.status,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 1.5 },
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Total ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}: Rp ${total.toLocaleString('id-ID')}`,
      margin,
      finalY
    );

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, margin, finalY + 10);

    // Simpan PDF
    const filename = `${title.replace(/ /g, '_')}_${month || ''}_${year || ''}.pdf`;
    doc.save(filename);
  };

  return (
    <button
      onClick={generatePDF}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      Export PDF
    </button>
  );
};

export default FinancePDFExportButton;