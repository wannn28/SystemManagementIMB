import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Member, SalaryRecord } from '../types/BasicTypes';
import { formatSalaryQuantity } from '../utils/salaryUnit';

interface PDFGeneratorButtonProps {
  member: Member;
  salary: SalaryRecord;
}

export const PDFGeneratorButton: React.FC<PDFGeneratorButtonProps> = ({ member, salary }) => {
  const generatePDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Page margins — keep content clear of the paper edges
    const TOP_MARGIN = 32;
    const BOTTOM_MARGIN = 28;
    const SIDE_MARGIN = 16;

    const tableMargin = {
      top: TOP_MARGIN,
      left: SIDE_MARGIN,
      right: SIDE_MARGIN,
      bottom: BOTTOM_MARGIN,
    };

    // Header — start below TOP_MARGIN so the title is not jammed against the edge
    let y = TOP_MARGIN + 8;
    doc.setFontSize(16);
    doc.text(`LAPORAN GAJI KARYAWAN`, pageWidth / 2, y, { align: 'center' });

    y += 7;
    doc.setFontSize(12);
    doc.text(`Periode: ${salary.month}`, pageWidth / 2, y, { align: 'center' });

    y += 9;
    doc.setFontSize(10);
    doc.text(`Nama: ${member.fullName}`, SIDE_MARGIN, y);
    y += 6;
    doc.text(`Jabatan: ${member.role}`, SIDE_MARGIN, y);

    // Tabel Rincian Gaji — quantity includes unit (e.g. "17 Jam", "1 Hari")
    autoTable(doc, {
      startY: y + 8,
      margin: tableMargin,
      head: [['Tanggal', 'Satuan', 'Harga per Satuan', 'Total', 'Keterangan']],
      body: salary.details.map(d => [
        new Date(d.tanggal).toLocaleDateString(),
        formatSalaryQuantity(d.jam_trip, d.unit),
        `Rp${d.harga_per_jam.toLocaleString()}`,
        `Rp${(d.jam_trip * d.harga_per_jam).toLocaleString()}`,
        d.keterangan
      ]),
      theme: 'grid'
    });

    // Tabel Kasbon
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      margin: tableMargin,
      head: [['Tanggal', 'Jumlah Kasbon', 'Keterangan']],
      body: salary.kasbons.map(k => [
        new Date(k.tanggal).toLocaleDateString(),
        `Rp${k.jumlah.toLocaleString()}`,
        k.keterangan
      ]),
      theme: 'grid'
    });

    // Total Gaji — keep block above the bottom margin
    const totalsBlockHeight = 18;
    let totalsY = (doc as any).lastAutoTable.finalY + 10;
    if (totalsY + totalsBlockHeight > pageHeight - BOTTOM_MARGIN) {
      doc.addPage();
      totalsY = TOP_MARGIN + 8;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Total Gaji Kotor: Rp${salary.gross_salary.toLocaleString()}`, SIDE_MARGIN, totalsY);
    doc.text(`Total Kasbon: Rp${salary.loan.toLocaleString()}`, SIDE_MARGIN, totalsY + 5);
    doc.text(`Total Gaji Bersih: Rp${salary.net_salary.toLocaleString()}`, SIDE_MARGIN, totalsY + 10);

    // Signature — follow the totals (not pinned to the page bottom), with a clear bottom margin
    const signatureGap = 20;
    const signatureBlockHeight = 14;
    let signatureY = totalsY + 10 + signatureGap;

    if (signatureY + signatureBlockHeight > pageHeight - BOTTOM_MARGIN) {
      doc.addPage();
      signatureY = TOP_MARGIN + 12;
    }

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Hormat Kami,', SIDE_MARGIN + 20, signatureY);
    doc.text('PT Indira Maju Bersama', SIDE_MARGIN + 10, signatureY + 6);
    doc.text('Diketahui oleh:', pageWidth - SIDE_MARGIN - 30, signatureY + 6, { align: 'right' });

    // Bukti pembayaran (optional images)
    if (salary.documents && salary.documents.length > 0) {
      doc.addPage();
      doc.text('Bukti Pembayaran dan Kasbon', pageWidth / 2, TOP_MARGIN + 8, { align: 'center' });

      const imgWidth = (pageWidth - 3 * SIDE_MARGIN) / 2;
      const imgHeight = 60;

      salary.documents.forEach((img, idx) => {
        if (idx > 0 && idx % 4 === 0) doc.addPage();

        const x = SIDE_MARGIN + (idx % 2) * (imgWidth + SIDE_MARGIN);
        const yImg = TOP_MARGIN + 18 + Math.floor((idx % 4) / 2) * (imgHeight + SIDE_MARGIN);

        doc.addImage(
          `${import.meta.env.VITE_API_URL}/uploads/${img}`,
          'JPEG',
          x,
          yImg,
          imgWidth,
          imgHeight
        );
      });
    }

    doc.save(`Laporan-Gaji-${member.fullName}-${salary.month}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      Export to PDF
    </button>
  );
};
