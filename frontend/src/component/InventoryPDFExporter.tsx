import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryCategory, InventoryData } from '../types/BasicTypes';

interface InventoryPDFExporterProps {
    selectedCategory: InventoryCategory;
    data: InventoryData[];
}

const InventoryPDFExporter: React.FC<InventoryPDFExporterProps> = ({ selectedCategory, data }) => {
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

    const getImageDimensions = (orientation: string) => {
        const pageWidth = orientation === 'portrait' ? 210 : 297;
        const margin = 15;
        const imagesPerRow = orientation === 'portrait' ? 2 : 3;
        const imgWidth = (pageWidth - margin * (imagesPerRow + 1)) / imagesPerRow;
        return { imgWidth, margin, imagesPerRow };
    };

    const generatePDF = async () => {
        const doc = new jsPDF(orientation === 'portrait' ? 'p' : 'l', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Header
        doc.setFontSize(16);
        doc.text(`LAPORAN INVENTORY - ${selectedCategory.title}`, pageWidth / 2, 20, { align: 'center' });

        // Filter kolom non-gambar untuk tabel
        const tableHeaders = selectedCategory.headers.filter(h => h.type !== 'image');

        // Membuat tabel data
        autoTable(doc, {
            startY: 30,
            head: [['ID', ...tableHeaders.map(h => h.name), 'Jumlah Gambar']],
            body: data.map(item => [
                item.id,
                ...tableHeaders.map(h => item.values[h.id] || '-'),
                item.images.length
            ]),
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }
        });

        // Mengumpulkan semua gambar
        const allImages = data.flatMap(item =>
            item.images.map((img, idx) => ({
                url: img,
                caption: `Data ID: ${item.id} - Gambar ${idx + 1}`,
                filename: img.split('/').pop() || 'image.jpg'
            }))
        );

        // Menambahkan halaman gambar terpisah
        if (allImages.length > 0) {
            // Tambahkan halaman baru khusus untuk gambar
            doc.addPage();

            const { imgWidth, margin, imagesPerRow } = getImageDimensions(orientation);
            const imgHeight = 60;
            const captionHeight = 10;
            let currentY = 20;
            let currentCol = 0;

            for (let i = 0; i < allImages.length; i++) {
                const img = allImages[i];

                // Cek jika perlu halaman baru
                if (currentCol === 0 && currentY + imgHeight + captionHeight > pageHeight - margin) {
                    doc.addPage();
                    currentY = 20;
                }

                // Hitung posisi X dan Y
                const x = margin + currentCol * (imgWidth + margin);
                const y = currentY;

                // Tambahkan gambar dan keterangan
                try {
                    doc.addImage(img.url, 'JPEG', x, y, imgWidth, imgHeight);
                    doc.setFontSize(8);
                    doc.text(`${img.filename} (${img.caption})`, x, y + imgHeight + 5, {
                        maxWidth: imgWidth
                    });
                } catch (error) {
                    console.error('Error loading image:', img.url);
                }

                // Update posisi kolom dan baris
                currentCol++;
                if (currentCol >= imagesPerRow) {
                    currentCol = 0;
                    currentY += imgHeight + captionHeight + margin;
                }
            }
        }

        doc.save(`Inventory-${selectedCategory.title}-${new Date().toISOString()}.pdf`);
    };

    return (
        <div className="flex gap-2 items-center">
            <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                className="border p-1 rounded"
            >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
            </select>

            <button
                onClick={generatePDF}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
                Export to PDF
            </button>
        </div>
    );
};

export default InventoryPDFExporter;