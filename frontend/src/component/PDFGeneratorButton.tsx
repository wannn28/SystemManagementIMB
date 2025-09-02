import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Member, SalaryRecord } from '../types/BasicTypes';

interface PDFGeneratorButtonProps {
  member: Member;
  salary: SalaryRecord;
}

export const PDFGeneratorButton: React.FC<PDFGeneratorButtonProps> = ({ member, salary }) => {
  const generatePDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Header
    doc.setFontSize(16);
    doc.text(`LAPORAN GAJI KARYAWAN`, pageWidth/2, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Periode: ${salary.month}`, pageWidth/2, 35, { align: 'center' });

    // Informasi Karyawan
    doc.setFontSize(10);
    doc.text(`Nama: ${member.fullName}`, margin, 40);
    doc.text(`Jabatan: ${member.role}`, margin, 45);

    // Tabel Rincian Gaji
    autoTable(doc, {
      startY: 50,
      head: [['Tanggal', 'Jam/Trip', 'Harga per Jam', 'Total', 'Keterangan']],
      body: salary.details.map(d => [
        new Date(d.tanggal).toLocaleDateString(),
        d.jam_trip,
        `Rp${d.harga_per_jam.toLocaleString()}`,
        `Rp${(d.jam_trip * d.harga_per_jam).toLocaleString()}`,
        d.keterangan
      ]),
      theme: 'grid'
    });

    // Tabel Kasbon
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Tanggal', 'Jumlah Kasbon', 'Keterangan']],
      body: salary.kasbons.map(k => [
        new Date(k.tanggal).toLocaleDateString(),
        `Rp${k.jumlah.toLocaleString()}`,
        k.keterangan
      ]),
      theme: 'grid'
    });

    // Total Gaji
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('Helvetica', 'bold');
    doc.text(`Total Gaji Kotor: Rp${salary.gross_salary.toLocaleString()}`, margin, finalY);
    doc.text(`Total Kasbon: Rp${salary.loan.toLocaleString()}`, margin, finalY + 5);
    doc.text(`Total Gaji Bersih: Rp${salary.net_salary.toLocaleString()}`, margin, finalY + 10);

    // Check if we need a new page for footer
    const footerY = finalY + 20;
    if (footerY > pageHeight - 80) {
      doc.addPage();
      doc.text('Hormat Kami,', margin + 20, 30);
      doc.text('PT Indira Maju Bersama', margin + 10, 35);
      
      // Tanda Tangan
      doc.text('Diketahui oleh:', pageWidth - margin - 30, 35, { align: 'right' });
    } else {
      // Footer
      doc.setFont('Helvetica', 'normal');
      doc.text('Hormat Kami,', margin + 20, footerY);
      doc.text('PT Indira Maju Bersama', margin + 10, footerY + 5);
      
      // Tanda Tangan
      doc.text('Diketahui oleh:', pageWidth - margin - 30, footerY + 5, { align: 'right' });
    }

    // Halaman Gambar
    if (salary.documents && salary.documents.length > 0) {
      doc.addPage();
      doc.text('Bukti Pembayaran dan Kasbon', pageWidth/2, 30, { align: 'center' });
      
      const imgWidth = (pageWidth - 3*margin)/2;
      const imgHeight = 60;
      
      salary.documents.forEach((img, idx) => {
        if (idx > 0 && idx % 4 === 0) doc.addPage();
        
        const x = margin + (idx % 2) * (imgWidth + margin);
        const y = 40 + Math.floor((idx % 4)/2) * (imgHeight + margin);
        
        doc.addImage(
          `${import.meta.env.VITE_API_URL}/uploads/${img}`,
          'JPEG',
          x,
          y,
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