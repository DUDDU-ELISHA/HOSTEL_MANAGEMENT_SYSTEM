import {
  HostelConfig,
  Resident,
  PaymentRecord,
  ExpenseItem,
  MonthlyBudget
} from '../types';
import { formatReceiptNumber } from './pdfGenerator';

/**
 * Generates Resident Details Report in Word Format (.doc)
 * Columns requested: Name, Room number, Payment Date, Receipt number, Payment mode, Amount
 */
export function generateResidentDetailsWordReport(params: {
  config: HostelConfig;
  residents: Resident[];
  payments: PaymentRecord[];
}): void {
  const { config, residents, payments } = params;
  const todayStr = new Date().toLocaleDateString('en-IN', {
    dateStyle: 'full',
  });

  // Compile row data matching each resident with their payment details
  interface ResidentReportRow {
    name: string;
    roomNumber: string;
    joiningDate: string;
    paymentDate: string;
    receiptNumber: string;
    paymentMode: string;
    amount: number;
    status: string;
    phone: string;
  }

  const rows: ResidentReportRow[] = [];

  // Helper to format ISO date to readable DD/MM/YYYY
  const formatDateDisplay = (dStr?: string): string => {
    if (!dStr || dStr === '-' || dStr === 'Pending') return dStr || '-';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      const [y, m, d] = dStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return dStr;
  };

  // 1. First add all residents with their corresponding payments
  residents.forEach((r) => {
    const residentPayments = payments.filter(
      (p) =>
        (p.residentId && p.residentId === r.id) ||
        (p.residentName.trim().toLowerCase() === r.name.trim().toLowerCase() &&
          p.roomNumber.trim().toLowerCase() === r.roomNumber.trim().toLowerCase())
    );

    if (residentPayments.length > 0) {
      residentPayments.forEach((p) => {
        rows.push({
          name: r.name,
          roomNumber: r.roomNumber,
          joiningDate: formatDateDisplay(r.joiningDate),
          paymentDate: formatDateDisplay(p.paymentDate),
          receiptNumber: formatReceiptNumber(p.receiptNumber),
          paymentMode: p.paymentMode,
          amount: p.amountReceived,
          status: p.paymentStatus,
          phone: r.phone,
        });
      });
    } else {
      // Resident without recorded payment yet
      rows.push({
        name: r.name,
        roomNumber: r.roomNumber,
        joiningDate: formatDateDisplay(r.joiningDate),
        paymentDate: 'Pending',
        receiptNumber: '-',
        paymentMode: '-',
        amount: 0,
        status: 'Unpaid Fee Due',
        phone: r.phone,
      });
    }
  });

  // 2. Add any standalone payments not attached to resident objects
  payments.forEach((p) => {
    const alreadyIncluded = rows.some(
      (rw) =>
        rw.name.toLowerCase() === p.residentName.toLowerCase() &&
        rw.roomNumber.toLowerCase() === p.roomNumber.toLowerCase() &&
        rw.receiptNumber === formatReceiptNumber(p.receiptNumber)
    );
    if (!alreadyIncluded) {
      const matchResident = residents.find(
        (r) =>
          (p.residentId && p.residentId === r.id) ||
          (p.residentName.trim().toLowerCase() === r.name.trim().toLowerCase() &&
            p.roomNumber.trim().toLowerCase() === r.roomNumber.trim().toLowerCase())
      );
      rows.push({
        name: p.residentName,
        roomNumber: p.roomNumber,
        joiningDate: formatDateDisplay(matchResident?.joiningDate),
        paymentDate: formatDateDisplay(p.paymentDate),
        receiptNumber: formatReceiptNumber(p.receiptNumber),
        paymentMode: p.paymentMode,
        amount: p.amountReceived,
        status: p.paymentStatus,
        phone: matchResident?.phone || '-',
      });
    }
  });

  const totalAmountCollected = rows.reduce((sum, r) => sum + r.amount, 0);

  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${config.name} - Residents Details & Payment Report</title>
  <style>
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      margin: 40px;
      color: #1a1a1a;
      line-height: 1.4;
    }
    .header-box {
      border-bottom: 3px solid #581c87;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .hostel-title {
      font-size: 24pt;
      font-weight: bold;
      color: #581c87;
      margin: 0 0 4px 0;
      text-transform: uppercase;
    }
    .hostel-sub {
      font-size: 11pt;
      color: #4b5563;
      margin: 2px 0;
    }
    .report-title-bar {
      background-color: #f3e8ff;
      border-left: 5px solid #7e22ce;
      padding: 10px 14px;
      margin: 20px 0;
    }
    .report-title {
      font-size: 16pt;
      font-weight: bold;
      color: #581c87;
      margin: 0;
    }
    .meta-text {
      font-size: 10pt;
      color: #6b7280;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      margin-bottom: 24px;
      font-size: 10.5pt;
    }
    th {
      background-color: #4a0e4e;
      color: #ffffff;
      font-weight: bold;
      border: 1px solid #380b3b;
      padding: 10px 8px;
      text-align: left;
      font-size: 10pt;
    }
    td {
      border: 1px solid #e5e7eb;
      padding: 8px 10px;
      vertical-align: middle;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .num {
      text-align: right;
      font-family: 'Consolas', 'Courier New', monospace;
      font-weight: bold;
    }
    .receipt-num {
      font-family: 'Consolas', 'Courier New', monospace;
      color: #4a0e4e;
      font-weight: bold;
    }
    .total-row {
      background-color: #faf5ff;
      font-weight: bold;
      border-top: 2px solid #581c87;
    }
    .sig-box {
      border-top: 1.5px solid #4b5563;
      padding-top: 8px;
      width: 250px;
      margin-left: auto;
      margin-top: 40px;
      text-align: center;
      font-size: 11pt;
    }
    .footer-note {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="header-box">
    <div class="hostel-title">${config.name}</div>
    <div class="hostel-sub">${config.address}</div>
    <div class="hostel-sub">Owner Contact: ${config.phone1} / ${config.phone2} | Authorized: ${config.ownerName}</div>
  </div>

  <div class="report-title-bar">
    <div class="report-title">RESIDENT DETAILS & PAYMENT REPORT</div>
    <div class="meta-text">Generated On: <strong>${todayStr}</strong> | Total Registered Records: <strong>${rows.length}</strong></div>
  </div>

  <p style="font-size: 11pt; color: #374151;">
    Official roster of all hostel residents including room assignments, fee payment dates, receipt numbers (starting from 001), payment modes, and amounts collected.
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Name</th>
        <th style="width: 12%;">Room Number</th>
        <th style="width: 13%;">Joining Date</th>
        <th style="width: 13%;">Payment Date</th>
        <th style="width: 13%;">Receipt Number</th>
        <th style="width: 14%;">Payment Mode</th>
        <th style="width: 15%; text-align: right;">Amount (INR)</th>
      </tr>
    </thead>
    <tbody>
      ${
        rows.length === 0
          ? `<tr><td colspan="7" style="text-align: center; color: #6b7280; padding: 20px;">No resident details recorded yet.</td></tr>`
          : rows
              .map(
                (r) => `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.roomNumber}</td>
          <td>${r.joiningDate || '-'}</td>
          <td>${r.paymentDate}</td>
          <td class="receipt-num">${r.receiptNumber}</td>
          <td>${r.paymentMode}</td>
          <td class="num">₹ ${r.amount.toLocaleString('en-IN')}</td>
        </tr>`
              )
              .join('')
      }
      <tr class="total-row">
        <td colspan="6" style="text-align: right;"><strong>TOTAL RENT FEE AMOUNT COLLECTED:</strong></td>
        <td class="num" style="color: #047857; font-size: 11pt;">₹ ${totalAmountCollected.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  <div class="sig-box">
    <strong>${config.ownerName}</strong><br>
    Authorized Signatory & Owner<br>
    ${config.name}
  </div>

  <div class="footer-note">
    Official digital record generated for ${config.name} · KPHB Road Number 3, Hyderabad, Telangana · ${config.phone1} / ${config.phone2}
  </div>

</body>
</html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_Resident_Details_Report_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Generates Monthly Report in Word Format (.doc)
 * Highlights: Monthly wise rent collection, how much invested, power bills, Worker salaries, Maintenance bills, and finally Profit or Loss.
 */
export function generateWordMonthlyReport(params: {
  config: HostelConfig;
  month: string; // e.g. "2026-10"
  residents: Resident[];
  payments: PaymentRecord[];
  expenses: ExpenseItem[];
  budget: MonthlyBudget;
}): void {
  const { config, month, residents, payments, expenses, budget } = params;

  // Format month name
  const [year, monthNum] = month.split('-');
  const dateObj = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1);
  const monthName = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // 1. Monthly Wise Rent Collection (Total Fee Revenue)
  const monthlyRentCollection = payments.reduce((sum, p) => sum + (p.amountReceived || 0), 0);
  const totalInvoiced = payments.reduce((sum, p) => sum + (p.totalInvoiced || 0), 0);
  const totalBalanceDue = payments.reduce((sum, p) => sum + (p.outstandingBalance || 0), 0);

  // 2. Individual Investment Breakdown
  const groceryBills = expenses
    .filter((e) => e.category === 'Grocery')
    .reduce((sum, e) => sum + e.amount, 0);

  const powerBills = expenses
    .filter((e) => e.category === 'Power Bills')
    .reduce((sum, e) => sum + e.amount, 0);

  const maintenanceBills = expenses
    .filter((e) => e.category === 'Maintenance')
    .reduce((sum, e) => sum + e.amount, 0);

  const workerSalaries = expenses
    .filter((e) => e.category === 'Worker Salary')
    .reduce((sum, e) => sum + e.amount, 0);

  // How much invested in total
  const howMuchInvested = groceryBills + powerBills + maintenanceBills + workerSalaries;

  // Profit or Loss calculation
  const netDifference = monthlyRentCollection - howMuchInvested;
  const isProfit = netDifference >= 0;

  // Occupancy calculations
  const occupiedResidents = residents.filter((r) => r.status === 'Active');
  const occupiedCount = occupiedResidents.length;
  const totalBeds = config.totalBeds || 90;
  const vacantBeds = Math.max(0, totalBeds - occupiedCount);
  const vacancyRate = totalBeds > 0 ? ((vacantBeds / totalBeds) * 100).toFixed(1) : '0';

  // Build Word Document HTML
  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${config.name} - Monthly Report - ${monthName}</title>
  <style>
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      margin: 40px;
      color: #1a1a1a;
      line-height: 1.4;
    }
    .header-box {
      border-bottom: 3px solid #581c87;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .hostel-title {
      font-size: 24pt;
      font-weight: bold;
      color: #581c87;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .hostel-sub {
      font-size: 11pt;
      color: #4b5563;
      margin: 2px 0;
    }
    .report-title-bar {
      background-color: #f3e8ff;
      border-left: 5px solid #7e22ce;
      padding: 10px 14px;
      margin: 20px 0;
    }
    .report-title {
      font-size: 16pt;
      font-weight: bold;
      color: #581c87;
      margin: 0;
    }
    .meta-text {
      font-size: 10pt;
      color: #6b7280;
      margin-top: 4px;
    }
    h2 {
      font-size: 14pt;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
      margin-top: 28px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10.5pt;
    }
    th {
      background-color: #f9fafb;
      color: #374151;
      font-weight: bold;
      border: 1px solid #d1d5db;
      padding: 9px 10px;
      text-align: left;
    }
    td {
      border: 1px solid #e5e7eb;
      padding: 8px 10px;
      vertical-align: top;
    }
    .num {
      text-align: right;
      font-family: 'Consolas', 'Courier New', monospace;
    }
    .highlight-row {
      background-color: #faf5ff;
      font-weight: bold;
    }
    .profit-callout {
      margin: 20px 0;
      padding: 16px 20px;
      border-radius: 6px;
      border-left: 6px solid;
    }
    .profit-box {
      background-color: #ecfdf5;
      border-color: #059669;
      color: #065f46;
    }
    .loss-box {
      background-color: #fef2f2;
      border-color: #dc2626;
      color: #991b1b;
    }
    .sig-box {
      border-top: 1.5px solid #4b5563;
      padding-top: 8px;
      width: 250px;
      margin-left: auto;
      margin-top: 40px;
      text-align: center;
      font-size: 11pt;
    }
    .footer-note {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="header-box">
    <div class="hostel-title">${config.name}</div>
    <div class="hostel-sub">${config.address}</div>
    <div class="hostel-sub">Owner Contact: ${config.phone1} / ${config.phone2} | Authorized: ${config.ownerName}</div>
  </div>

  <div class="report-title-bar">
    <div class="report-title">MONTHLY FINANCIAL & OPERATIONAL REPORT</div>
    <div class="meta-text">Reporting Period: <strong>${monthName}</strong> | Generated On: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</div>
  </div>

  <!-- PROFIT OR LOSS FINAL CALLOUT -->
  <div class="profit-callout ${isProfit ? 'profit-box' : 'loss-box'}">
    <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">
      FINAL OPERATIONAL RESULT: ${isProfit ? 'PROFIT' : 'LOSS'}
    </div>
    <div style="font-size: 20pt; font-weight: bold; margin-top: 4px; font-family: 'Consolas', monospace;">
      ${isProfit ? '+' : '-'} ₹ ${Math.abs(netDifference).toLocaleString('en-IN')}
    </div>
    <div style="font-size: 10pt; margin-top: 4px;">
      Total Rent Collection (₹ ${monthlyRentCollection.toLocaleString('en-IN')}) minus How Much Invested (₹ ${howMuchInvested.toLocaleString('en-IN')})
    </div>
  </div>

  <h2>1. Monthly Financial Summary: Collections, Investments & Profit/Loss</h2>
  <table>
    <thead>
      <tr>
        <th>Operational Parameter</th>
        <th style="text-align: right;">Amount (INR)</th>
        <th>Classification</th>
      </tr>
    </thead>
    <tbody>
      <tr class="highlight-row">
        <td><strong>1. Monthly Wise Rent Collection (Total Revenue)</strong></td>
        <td class="num" style="color: #047857; font-size: 11pt;">
          <strong>₹ ${monthlyRentCollection.toLocaleString('en-IN')}</strong>
        </td>
        <td>Collected from ${payments.length} resident fee payments</td>
      </tr>
      <tr>
        <td>&nbsp;&nbsp;&nbsp;&nbsp;• Total Billed Invoiced Amount</td>
        <td class="num">₹ ${totalInvoiced.toLocaleString('en-IN')}</td>
        <td>Total rent & deposit billings</td>
      </tr>
      <tr>
        <td>&nbsp;&nbsp;&nbsp;&nbsp;• Outstanding Uncollected Balance Due</td>
        <td class="num" style="color: #b91c1c;">₹ ${totalBalanceDue.toLocaleString('en-IN')}</td>
        <td>Pending balance receivables</td>
      </tr>

      <tr class="highlight-row">
        <td><strong>2. How Much Invested (Total Operating Expenses)</strong></td>
        <td class="num" style="color: #581c87; font-size: 11pt;">
          <strong>₹ ${howMuchInvested.toLocaleString('en-IN')}</strong>
        </td>
        <td>Total operational investment for the month</td>
      </tr>
      <tr>
        <td>&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Power Bills</strong> (Electricity Meters & Charges)</td>
        <td class="num">₹ ${powerBills.toLocaleString('en-IN')}</td>
        <td>Commercial & residential electricity bills</td>
      </tr>
      <tr>
        <td>&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Worker Salaries</strong> (Cooks, Cleaners, Warden, Watchman)</td>
        <td class="num">₹ ${workerSalaries.toLocaleString('en-IN')}</td>
        <td>Hostel staff monthly payroll</td>
      </tr>
      <tr>
        <td>&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Maintenance Bills</strong> (Wi-Fi, RO, Repairs, Plumbing)</td>
        <td class="num">₹ ${maintenanceBills.toLocaleString('en-IN')}</td>
        <td>Repairs, elevator AMC, internet, utilities</td>
      </tr>
      <tr>
        <td>&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Grocery Section</strong> (Provisions, Rice, Veggies, Gas, Milk)</td>
        <td class="num">₹ ${groceryBills.toLocaleString('en-IN')}</td>
        <td>Mess food provisions and cylinder bills</td>
      </tr>

      <tr class="highlight-row" style="background-color: ${isProfit ? '#ecfdf5' : '#fef2f2'}; border-top: 2px solid ${isProfit ? '#059669' : '#dc2626'};">
        <td style="font-size: 12pt;">
          <strong>FINAL RESULT: ${isProfit ? 'NET PROFIT' : 'NET LOSS'}</strong>
        </td>
        <td class="num" style="font-size: 13pt; color: ${isProfit ? '#047857' : '#b91c1c'};">
          <strong>${isProfit ? '+' : '-'} ₹ ${Math.abs(netDifference).toLocaleString('en-IN')}</strong>
        </td>
        <td><strong>${isProfit ? 'Surplus Operational Margin' : 'Operating Deficit'}</strong></td>
      </tr>
    </tbody>
  </table>

  <h2>2. Occupancy & Capacity Statistics</h2>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th style="text-align: right;">Count / Percentage</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Configured Beds Capacity</td>
        <td class="num">${totalBeds} Beds</td>
        <td>Configured hostel capacity</td>
      </tr>
      <tr>
        <td>Active Occupants</td>
        <td class="num">${occupiedCount} Residents</td>
        <td>Active enrolled residents</td>
      </tr>
      <tr>
        <td>Available Vacant Beds</td>
        <td class="num">${vacantBeds} Beds</td>
        <td>Available for admission</td>
      </tr>
      <tr class="highlight-row">
        <td><strong>Current Vacancy Rate</strong></td>
        <td class="num"><strong>${vacancyRate}%</strong></td>
        <td>${parseFloat(vacancyRate) > 20 ? 'Rooms Available' : 'High Occupancy'}</td>
      </tr>
    </tbody>
  </table>

  <h2>3. Payment Collections Log (${payments.length} Payments)</h2>
  <table>
    <thead>
      <tr>
        <th>Receipt #</th>
        <th>Resident Name</th>
        <th>Room #</th>
        <th>Joining Date</th>
        <th>Payment Date</th>
        <th>Payment Mode</th>
        <th style="text-align: right;">Amount Paid (INR)</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${
        payments.length === 0
          ? `<tr><td colspan="8" style="text-align: center; color: #6b7280;">No payments recorded for this month.</td></tr>`
          : payments
              .map((p) => {
                const matchRes = residents.find(
                  (r) =>
                    (p.residentId && r.id === p.residentId) ||
                    (r.name.trim().toLowerCase() === p.residentName.trim().toLowerCase() &&
                      r.roomNumber.trim().toLowerCase() === p.roomNumber.trim().toLowerCase())
                );
                const joinDateFormatted = matchRes?.joiningDate
                  ? matchRes.joiningDate.includes('-')
                    ? matchRes.joiningDate.split('-').reverse().join('/')
                    : matchRes.joiningDate
                  : '-';
                const payDateFormatted = p.paymentDate.includes('-')
                  ? p.paymentDate.split('-').reverse().join('/')
                  : p.paymentDate;

                return `
        <tr>
          <td style="font-family: monospace; font-weight: bold; color: #4a0e4e;">${formatReceiptNumber(p.receiptNumber)}</td>
          <td><strong>${p.residentName}</strong></td>
          <td>${p.roomNumber}</td>
          <td>${joinDateFormatted}</td>
          <td>${payDateFormatted}</td>
          <td>${p.paymentMode}</td>
          <td class="num">₹ ${p.amountReceived.toLocaleString('en-IN')}</td>
          <td>${p.paymentStatus}</td>
        </tr>`;
              })
              .join('')
      }
    </tbody>
  </table>

  <h2>4. Itemized Investment & Expense Vouchers (${expenses.length} Records)</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Item Description</th>
        <th>Paid To</th>
        <th>Mode</th>
        <th style="text-align: right;">Amount (INR)</th>
      </tr>
    </thead>
    <tbody>
      ${
        expenses.length === 0
          ? `<tr><td colspan="6" style="text-align: center; color: #6b7280;">No expense items recorded for this month.</td></tr>`
          : expenses
              .map(
                (e) => `
        <tr>
          <td>${e.date}</td>
          <td><strong>${e.category}</strong></td>
          <td>${e.title}</td>
          <td>${e.paidTo || '-'}</td>
          <td>${e.paymentMode}</td>
          <td class="num">₹ ${e.amount.toLocaleString('en-IN')}</td>
        </tr>`
              )
              .join('')
      }
    </tbody>
  </table>

  <div class="sig-box">
    <strong>${config.ownerName}</strong><br>
    Authorized Signatory & Owner<br>
    ${config.name}
  </div>

  <div class="footer-note">
    Official monthly performance dossier generated for ${config.name}.<br>
    KPHB Road Number 3, Hyderabad, Telangana | Contact: ${config.phone1} / ${config.phone2}
  </div>

</body>
</html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_Monthly_Report_${month}.doc`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export interface VacatedResidentsReportOptions {
  config: HostelConfig;
  vacatedResidents: Resident[];
}

export function generateVacatedResidentsWordReport(options: VacatedResidentsReportOptions): void {
  const { config, vacatedResidents } = options;
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const totalAdvanceReceived = vacatedResidents.filter((r) => r.advance500Received).length;
  const totalAdvancePending = vacatedResidents.length - totalAdvanceReceived;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vacated Residents & Advance 500 Report - ${config.name}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1f2937;
      margin: 40px;
      line-height: 1.5;
    }
    .header-box {
      border-bottom: 3px double #4a0e4e;
      padding-bottom: 12px;
      margin-bottom: 20px;
      text-align: center;
    }
    .hostel-title {
      font-size: 20pt;
      font-weight: 800;
      color: #4a0e4e;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .hostel-sub {
      font-size: 10.5pt;
      color: #4b5563;
      margin: 2px 0;
    }
    .report-title-bar {
      background-color: #faf5ff;
      border-left: 5px solid #7e22ce;
      padding: 10px 14px;
      margin: 20px 0;
    }
    .report-title {
      font-size: 15pt;
      font-weight: bold;
      color: #581c87;
      margin: 0;
    }
    .meta-text {
      font-size: 10pt;
      color: #6b7280;
      margin-top: 4px;
    }
    .summary-pills {
      display: flex;
      margin: 15px 0;
      font-size: 10.5pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      margin-bottom: 24px;
      font-size: 10pt;
    }
    th {
      background-color: #4a0e4e;
      color: #ffffff;
      font-weight: bold;
      border: 1px solid #380b3b;
      padding: 8px 6px;
      text-align: left;
      font-size: 9.5pt;
    }
    td {
      border: 1px solid #e5e7eb;
      padding: 7px 8px;
      vertical-align: middle;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .status-received {
      color: #047857;
      font-weight: bold;
      background-color: #ecfdf5;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }
    .status-not-received {
      color: #b91c1c;
      font-weight: bold;
      background-color: #fef2f2;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }
    .sig-box {
      border-top: 1.5px solid #4b5563;
      padding-top: 8px;
      width: 250px;
      margin-left: auto;
      margin-top: 40px;
      text-align: center;
      font-size: 11pt;
    }
    .footer-note {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="header-box">
    <div class="hostel-title">${config.name}</div>
    <div class="hostel-sub">${config.address}</div>
    <div class="hostel-sub">Owner: ${config.ownerName} | Contact: ${config.phone1} / ${config.phone2}</div>
  </div>

  <div class="report-title-bar">
    <div class="report-title">VACATED RESIDENTS & ADVANCE ₹500 SETTLEMENT REPORT</div>
    <div class="meta-text">
      Report Date: <strong>${todayStr}</strong> | 
      Total Vacated Residents: <strong>${vacatedResidents.length}</strong> | 
      Advance ₹500 Received: <strong style="color: #047857;">${totalAdvanceReceived}</strong> | 
      Advance ₹500 Not Received: <strong style="color: #b91c1c;">${totalAdvancePending}</strong>
    </div>
  </div>

  <p style="font-size: 10.5pt; color: #374151;">
    Official record of all vacated residents including vacate dates and Advance ₹500 payment/settlement verification status for ${config.name}.
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 20%;">Resident Name</th>
        <th style="width: 12%;">Room #</th>
        <th style="width: 13%;">Phone</th>
        <th style="width: 12%;">Joining Date</th>
        <th style="width: 12%;">Vacated Date</th>
        <th style="width: 16%;">Advance ₹500 Status</th>
        <th style="width: 10%; text-align: right;">Rent (INR)</th>
      </tr>
    </thead>
    <tbody>
      ${
        vacatedResidents.length === 0
          ? `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #6b7280;">No vacated residents recorded yet.</td></tr>`
          : vacatedResidents
              .map(
                (r, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${r.name}</strong></td>
          <td>${r.roomNumber} (${r.sharingType})</td>
          <td>${r.phone}</td>
          <td>${r.joiningDate || '-'}</td>
          <td><strong>${r.vacatedDate || '-'}</strong></td>
          <td>
            ${
              r.advance500Received
                ? `<span class="status-received">✓ Received</span>`
                : `<span class="status-not-received">✕ Not Received</span>`
            }
          </td>
          <td style="text-align: right; font-family: monospace;">₹${r.monthlyRent.toLocaleString('en-IN')}</td>
        </tr>`
              )
              .join('')
      }
    </tbody>
  </table>

  <div class="sig-box">
    <strong>${config.ownerName}</strong><br>
    Authorized Signatory & Owner<br>
    ${config.name}
  </div>

  <div class="footer-note">
    Official report exported from HMS Vault | ${config.name} | ${config.address}
  </div>

</body>
</html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_Vacated_Residents_Advance500_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
