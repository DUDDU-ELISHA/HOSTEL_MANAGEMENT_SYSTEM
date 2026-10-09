import { jsPDF } from 'jspdf';
import { PaymentRecord, HostelConfig, Resident } from '../types';

export function formatReceiptNumber(rawNum: string | number): string {
  const num = parseInt(String(rawNum).replace(/\D/g, ''), 10);
  if (isNaN(num) || num <= 0) {
    return '001';
  }
  return String(num).padStart(3, '0');
}

export function downloadReceiptAsPDF(payment: PaymentRecord, config: HostelConfig): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const receiptNum = formatReceiptNumber(payment.receiptNumber);

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Outer border
  doc.setDrawColor(192, 132, 252); // light purple
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, margin, contentWidth, 268, 3, 3, 'S');

  // 1. TOP PURPLE HEADER BANNER
  const bannerY = margin + 4;
  const bannerHeight = 32;
  doc.setFillColor(74, 14, 78); // #4a0e4e
  doc.roundedRect(margin + 4, bannerY, contentWidth - 8, bannerHeight, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text(config.name.toUpperCase(), pageWidth / 2, bannerY + 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(233, 213, 255);
  doc.text(config.address, pageWidth / 2, bannerY + 19, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(243, 232, 255);
  doc.text(`Owner Contact: ${config.phone1} / ${config.phone2}`, pageWidth / 2, bannerY + 26, {
    align: 'center',
  });

  // 2. OFFICIAL PAYMENT RECEIPT SUBHEADER
  const subY = bannerY + bannerHeight + 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(74, 14, 78); // #4a0e4e
  doc.text('OFFICIAL PAYMENT RECEIPT', margin + 6, subY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(55, 65, 81);
  doc.text(`Receipt No: ${receiptNum}`, pageWidth - margin - 6, subY - 1, { align: 'right' });
  doc.text(`Date: ${payment.paymentDate}`, pageWidth - margin - 6, subY + 5, { align: 'right' });

  // Divider line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin + 6, subY + 8, pageWidth - margin - 6, subY + 8);

  // 3. RESIDENT INFORMATION BOX
  const resBoxY = subY + 12;
  const resBoxHeight = 28;
  doc.setFillColor(250, 245, 255); // purple-50/60
  doc.setDrawColor(216, 180, 254); // purple-300
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + 6, resBoxY, contentWidth - 12, resBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 33, 168); // purple-700
  doc.text('RESIDENT INFORMATION', margin + 11, resBoxY + 6);

  // Left column: Resident Name & Room Number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Resident Name: ', margin + 11, resBoxY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(payment.residentName, margin + 38, resBoxY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Room Number: ', margin + 11, resBoxY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(payment.roomNumber, margin + 38, resBoxY + 22);

  // Right column: Payment Mode & Email
  const rightColX = pageWidth / 2 + 15;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Mode: ', rightColX, resBoxY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(74, 14, 78);
  doc.text(payment.paymentMode, rightColX + 27, resBoxY + 14);

  if (payment.residentEmail) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Email: ', rightColX, resBoxY + 22);
    doc.setTextColor(71, 85, 105);
    doc.text(payment.residentEmail, rightColX + 27, resBoxY + 22);
  }

  // 4. FINANCIAL LEDGER TABLE
  const tableY = resBoxY + resBoxHeight + 8;
  const tableX = margin + 6;
  const tableW = contentWidth - 12;

  // Header
  doc.setFillColor(74, 14, 78); // #4a0e4e
  doc.rect(tableX, tableY, tableW, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION', tableX + 5, tableY + 6);
  doc.text('AMOUNT (INR)', tableX + tableW - 5, tableY + 6, { align: 'right' });

  // Rows
  const rows = [
    {
      label: 'Monthly Room Rent',
      amount: `INR ${payment.monthlyRent.toLocaleString('en-IN')}`,
      bg: [255, 255, 255],
      bold: false,
    },
    {
      label: 'Advance / Security Deposit',
      amount: `INR ${(payment.advanceDeposit || 0).toLocaleString('en-IN')}`,
      bg: [255, 255, 255],
      bold: false,
    },
    {
      label: 'Total Invoiced Amount',
      amount: `INR ${payment.totalInvoiced.toLocaleString('en-IN')}`,
      bg: [243, 232, 255], // purple-100
      bold: true,
      color: [74, 14, 78],
    },
    {
      label: 'Amount Received',
      amount: `INR ${payment.amountReceived.toLocaleString('en-IN')}`,
      bg: [220, 252, 231], // emerald-100
      bold: true,
      color: [4, 120, 87],
    },
    {
      label: 'Outstanding Balance',
      amount: `INR ${payment.outstandingBalance.toLocaleString('en-IN')}`,
      bg: [255, 255, 255],
      bold: false,
    },
  ];

  let currentY = tableY + 9;
  rows.forEach((row) => {
    doc.setFillColor(row.bg[0], row.bg[1], row.bg[2]);
    doc.rect(tableX, currentY, tableW, 9, 'F');

    // Horizontal hairline border
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.line(tableX, currentY + 9, tableX + tableW, currentY + 9);

    doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    if (row.color) {
      doc.setTextColor(row.color[0], row.color[1], row.color[2]);
    } else {
      doc.setTextColor(30, 41, 59);
    }

    doc.text(row.label, tableX + 5, currentY + 6);
    doc.text(row.amount, tableX + tableW - 5, currentY + 6, { align: 'right' });
    currentY += 9;
  });

  // Table outer border
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.rect(tableX, tableY, tableW, 9 + rows.length * 9, 'S');

  // 5. STATUS BADGE & AUTHORIZED SIGNATURE
  const sigY = currentY + 12;

  // Status Badge on Left
  const isPaidInFull = payment.outstandingBalance === 0;
  if (isPaidInFull) {
    doc.setFillColor(5, 150, 105); // emerald-600
  } else {
    doc.setFillColor(217, 119, 6); // amber-600
  }
  doc.roundedRect(tableX, sigY + 2, 44, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(isPaidInFull ? 'PAID IN FULL' : 'PARTIAL PAYMENT', tableX + 22, sigY + 8.5, {
    align: 'center',
  });

  // Signature on Right
  const sigRightX = tableX + tableW - 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signature:', sigRightX, sigY + 2, { align: 'right' });

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(74, 14, 78);
  doc.text(config.ownerName, sigRightX, sigY + 10, { align: 'right' });

  // Signature line
  doc.setDrawColor(74, 14, 78);
  doc.setLineWidth(0.6);
  doc.line(sigRightX - 52, sigY + 13, sigRightX, sigY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Owner / Management, ${config.name}`, sigRightX, sigY + 17, { align: 'right' });

  // 6. AMENITIES INCLUDED FOOTER
  const footerY = 250;
  doc.setDrawColor(216, 180, 254);
  doc.setLineWidth(0.4);
  doc.line(tableX, footerY, tableX + tableW, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('HOSTEL AMENITIES INCLUDED:', pageWidth / 2, footerY + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'CCTV Security | High-Speed Wi-Fi | Washing Machine | Elevator/Lift | Refrigerator & In-room Freezer',
    pageWidth / 2,
    footerY + 10,
    { align: 'center' }
  );

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Note: This is an official digital receipt for ${config.name}. For queries contact ${config.phone1} / ${config.phone2}.`,
    pageWidth / 2,
    footerY + 15,
    { align: 'center' }
  );

  // Filename: e.g. TLNR_MENS_PG_Receipt_001.pdf
  const filename = `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_Receipt_${receiptNum}.pdf`;
  doc.save(filename);
}

/**
 * Generates and downloads a complete Resident Report with Joining Data in PDF format.
 * Features:
 * - Hostel Header with Address and Owner Contact
 * - Summary Badges (Total Residents, Rooms, Total Rent)
 * - Clean Data Table: #, Name, Room, Sharing, Joining Date, Phone, Status, Monthly Rent
 * - Multi-page pagination support with page numbers
 * - Official Authorized Signatory Box
 */
export function exportResidentsPdfReport(params: {
  config: HostelConfig;
  residents: Resident[];
  payments?: PaymentRecord[];
}): void {
  const { config, residents } = params;

  // Use landscape A4 for comfortable column distribution
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 269mm

  // Format date helper
  const formatDateStr = (dStr?: string): string => {
    if (!dStr || dStr === '-') return '-';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      const [y, m, d] = dStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return dStr;
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Calculate totals
  const totalRent = residents.reduce((sum, r) => sum + (r.monthlyRent || 0), 0);
  const activeCount = residents.filter((r) => r.status === 'Active').length;
  const vacatingCount = residents.filter((r) => r.status === 'Vacating').length;

  // Table setup
  const rowHeight = 7.5;
  const startY = 48;
  const rowsPerPage = 17;

  // Column definitions: sum must be <= contentWidth (269mm)
  // [ #, Resident Name, Room #, Sharing, Joining Date, Phone, Status, Monthly Rent (INR) ]
  const cols = [
    { header: '#', width: 12, align: 'center' as const },
    { header: 'Resident Name', width: 55, align: 'left' as const },
    { header: 'Room #', width: 22, align: 'center' as const },
    { header: 'Sharing', width: 26, align: 'center' as const },
    { header: 'Joining Date', width: 34, align: 'center' as const },
    { header: 'Phone Number', width: 38, align: 'center' as const },
    { header: 'Status', width: 28, align: 'center' as const },
    { header: 'Rent (INR)', width: 34, align: 'right' as const },
  ];
  const tableWidth = cols.reduce((sum, c) => sum + c.width, 0); // 249mm
  const tableStartX = margin + (contentWidth - tableWidth) / 2;

  const totalPages = Math.max(1, Math.ceil(residents.length / rowsPerPage));

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage('a4', 'landscape');
    }

    // Outer decorative border
    doc.setDrawColor(216, 180, 254);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, margin, contentWidth, pageHeight - margin * 2, 2, 2, 'S');

    // Header Purple Banner
    const bannerHeight = 22;
    doc.setFillColor(74, 14, 78); // #4a0e4e
    doc.roundedRect(margin + 2, margin + 2, contentWidth - 4, bannerHeight, 2, 2, 'F');

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(config.name.toUpperCase(), pageWidth / 2, margin + 9, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(233, 213, 255);
    doc.text(
      `${config.address} | Owner: ${config.ownerName} | Contact: ${config.phone1} / ${config.phone2}`,
      pageWidth / 2,
      margin + 16,
      { align: 'center' }
    );

    // Sub-banner Bar
    const subBarY = margin + bannerHeight + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(74, 14, 78);
    doc.text('RESIDENT ROSTER & JOINING REPORT', tableStartX, subBarY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Generated: ${todayStr}  |  Total Residents: ${residents.length} (Active: ${activeCount}, Vacating: ${vacatingCount})  |  Page ${page + 1} of ${totalPages}`,
      tableStartX + tableWidth,
      subBarY + 4,
      { align: 'right' }
    );

    // Table Header
    const thY = startY;
    doc.setFillColor(74, 14, 78);
    doc.rect(tableStartX, thY, tableWidth, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    let curX = tableStartX;
    cols.forEach((col) => {
      let textX = curX + 3;
      if (col.align === 'center') textX = curX + col.width / 2;
      if (col.align === 'right') textX = curX + col.width - 3;
      doc.text(col.header, textX, thY + 5.5, { align: col.align });
      curX += col.width;
    });

    // Page Rows
    const startIndex = page * rowsPerPage;
    const pageResidents = residents.slice(startIndex, startIndex + rowsPerPage);

    let rowY = thY + 8;
    pageResidents.forEach((res, index) => {
      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 249, isEven ? 255 : 250);
      doc.rect(tableStartX, rowY, tableWidth, rowHeight, 'F');

      // Thin separator
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.15);
      doc.line(tableStartX, rowY + rowHeight, tableStartX + tableWidth, rowY + rowHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      let colX = tableStartX;
      const globalIdx = startIndex + index + 1;

      // 1. #
      doc.text(String(globalIdx), colX + cols[0].width / 2, rowY + 5, { align: 'center' });
      colX += cols[0].width;

      // 2. Name
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const truncatedName = res.name.length > 25 ? res.name.substring(0, 24) + '...' : res.name;
      doc.text(truncatedName, colX + 3, rowY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      colX += cols[1].width;

      // 3. Room Number
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(74, 14, 78);
      doc.text(res.roomNumber, colX + cols[2].width / 2, rowY + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      colX += cols[2].width;

      // 4. Sharing
      doc.text(res.sharingType || '-', colX + cols[3].width / 2, rowY + 5, { align: 'center' });
      colX += cols[3].width;

      // 5. Joining Date (Prominently styled)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(74, 14, 78);
      doc.text(formatDateStr(res.joiningDate), colX + cols[4].width / 2, rowY + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      colX += cols[4].width;

      // 6. Phone
      doc.text(res.phone || '-', colX + cols[5].width / 2, rowY + 5, { align: 'center' });
      colX += cols[5].width;

      // 7. Status
      if (res.status === 'Active') {
        doc.setTextColor(4, 120, 87);
      } else if (res.status === 'Vacating') {
        doc.setTextColor(180, 83, 9);
      } else {
        doc.setTextColor(100, 116, 139);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(res.status, colX + cols[6].width / 2, rowY + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      colX += cols[6].width;

      // 8. Rent
      doc.setFont('helvetica', 'bold');
      doc.text(`INR ${res.monthlyRent.toLocaleString('en-IN')}`, colX + cols[7].width - 3, rowY + 5, {
        align: 'right',
      });

      rowY += rowHeight;
    });

    // Table outer border
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.rect(tableStartX, thY, tableWidth, rowY - thY, 'S');

    // On final page, print Total Summary row and Signatory Box
    if (page === totalPages - 1) {
      // Summary Row
      doc.setFillColor(250, 245, 255);
      doc.rect(tableStartX, rowY, tableWidth, 8, 'F');
      doc.setDrawColor(126, 34, 206);
      doc.setLineWidth(0.4);
      doc.line(tableStartX, rowY, tableStartX + tableWidth, rowY);
      doc.line(tableStartX, rowY + 8, tableStartX + tableWidth, rowY + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(74, 14, 78);
      doc.text('TOTAL MONTHLY RENT FROM REGISTERED RESIDENTS:', tableStartX + 5, rowY + 5.5);

      doc.setTextColor(4, 120, 87);
      doc.text(
        `INR ${totalRent.toLocaleString('en-IN')}`,
        tableStartX + tableWidth - 3,
        rowY + 5.5,
        { align: 'right' }
      );

      // Signatory Section at bottom
      const sigY = pageHeight - margin - 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Verified & Authorized Signatory:', tableStartX + tableWidth, sigY, { align: 'right' });

      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(74, 14, 78);
      doc.text(config.ownerName, tableStartX + tableWidth, sigY + 6, { align: 'right' });

      doc.setDrawColor(74, 14, 78);
      doc.setLineWidth(0.5);
      doc.line(tableStartX + tableWidth - 45, sigY + 8, tableStartX + tableWidth, sigY + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Authorized Signatory, ${config.name}`, tableStartX + tableWidth, sigY + 12, {
        align: 'right',
      });
    }

    // Page footer note
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Official digital resident record of ${config.name} | Address: ${config.address} | Support: ${config.phone1} / ${config.phone2}`,
      pageWidth / 2,
      pageHeight - margin - 3,
      { align: 'center' }
    );
  }

  // Save PDF
  const filename = `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_Residents_Joining_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

