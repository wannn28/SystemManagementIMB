import jsPDF from 'jspdf';
import QRCode from 'qrcode-generator';
import JsBarcode from 'jsbarcode';
import { Member } from '../types/BasicTypes';
import TemplateImage from '../assets/images/templateidcard1.png';

interface IDCardGeneratorButtonProps {
  member: Member;
}

export const IDCardGeneratorButton: React.FC<IDCardGeneratorButtonProps> = ({ member }) => {
  const generateIDCard = () => {
    const doc = new jsPDF('p', 'mm', [85, 54]);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Front Side Design
    doc.setFillColor(255, 180, 70);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text("PT Indira Maju Bersama", pageWidth/2, 10, { align: 'center' });

    // Template Image
    const img2 = new Image();
    img2.src = TemplateImage;
    doc.addImage(img2, 'JPEG', 0, 0, 55.5, 90);

    // Profile Image
    const img = new Image();
    img.src = `${import.meta.env.VITE_API_URL}/uploads/${member.profileImage}`;
    doc.addImage(img, 'JPEG', 14, 15, 25, 25);
    doc.setTextColor(75, 75, 75);

    // Member Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(member.fullName.toUpperCase(), pageWidth/2, 45, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(member.role.toUpperCase(), pageWidth/2, 50, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text("Phone : " + member.phoneNumber, 5, 57, { align: 'left' });
    doc.text("Join Date : " + member.joinDate, 5, 62, { align: 'left' });

    // Barcode Generation
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, member.id, {
      format: 'CODE128',
      displayValue: true,
      fontSize: 10,
      height: 40,
      width: 2
    });
    
    const barcodeWidth = 50;
    const barcodeHeight = 15;
    const barcodeX = (pageWidth - barcodeWidth) / 2;
    const barcodeY = pageHeight - 20;
    doc.addImage(canvas, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);

    // Company Email
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("indiramajubersama@gmail.com", pageWidth/2, pageHeight - 5, { align: 'center' });

    // Back Side Design
    doc.addPage([85, 54], 'p');
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // QR Code with Full Member Data
    const qr = QRCode(0, 'H');
    const qrData = JSON.stringify({
      id: member.id,
      fullName: member.fullName,
      role: member.role,
      phoneNumber: member.phoneNumber,
      joinDate: member.joinDate
    });
    qr.addData(qrData);
    qr.make();
    
    const qrSize = 30;
    const qrImg = qr.createDataURL(4, 0);
    const qrX = (pageWidth - qrSize)/2;
    const qrY = (pageHeight - qrSize)/2 - 5;
    doc.addImage(qrImg, 'PNG', qrX, qrY, qrSize, qrSize);

    // Employee ID Text
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    // doc.text(`EMPLOYEE ID: ${member.id}`, pageWidth/2, qrY + qrSize + 8, { align: 'center' });

    doc.save(`ID-Card-${member.fullName}.pdf`);
  };

  return (
    <button
      onClick={generateIDCard}
      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 ml-2"
    >
      Print ID Card
    </button>
  );
};