import React, { useState } from 'react';
import {
  HostelConfig,
  Resident,
  PaymentRecord,
  ExpenseItem,
  HostelType,
} from '../types';
import { StorageService } from '../services/storage';
import { generateWordMonthlyReport, generateResidentDetailsWordReport } from '../services/wordExport';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  Users,
  PieChart,
  CheckCircle,
  AlertTriangle,
  Building2
} from 'lucide-react';

interface MonthlyReportingSectionProps {
  hostelId: HostelType;
  config: HostelConfig;
  residents: Resident[];
  payments: PaymentRecord[];
  expenses: ExpenseItem[];
}

export const MonthlyReportingSection: React.FC<MonthlyReportingSectionProps> = ({
  hostelId,
  config,
  residents,
  payments,
  expenses,
}) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [isExporting, setIsExporting] = useState(false);

  // Month list (derived strictly from paymentDate)
  const availableMonths = Array.from(
    new Set([
      currentMonthStr,
      ...payments.map((p) => (p.paymentDate ? p.paymentDate.slice(0, 7) : p.month)),
      ...expenses.map((e) => e.month),
    ])
  ).sort().reverse();

  // Filter for selected month strictly based on paymentDate
  const monthPayments = payments.filter((p) => {
    const pm = p.paymentDate ? p.paymentDate.slice(0, 7) : p.month;
    return pm === selectedMonth;
  });
  const monthExpenses = expenses.filter((e) => e.month === selectedMonth);
  const monthBudget = StorageService.getBudget(hostelId, selectedMonth);

  // Financial calculations
  const totalReceived = monthPayments.reduce((s, p) => s + (p.amountReceived || 0), 0);
  const totalInvoiced = monthPayments.reduce((s, p) => s + (p.totalInvoiced || 0), 0);
  const totalBalanceDue = monthPayments.reduce((s, p) => s + (p.outstandingBalance || 0), 0);

  const groceryTotal = monthExpenses
    .filter((e) => e.category === 'Grocery')
    .reduce((s, e) => s + e.amount, 0);

  const powerTotal = monthExpenses
    .filter((e) => e.category === 'Power Bills')
    .reduce((s, e) => s + e.amount, 0);

  const maintenanceTotal = monthExpenses
    .filter((e) => e.category === 'Maintenance')
    .reduce((s, e) => s + e.amount, 0);

  const salaryTotal = monthExpenses
    .filter((e) => e.category === 'Worker Salary')
    .reduce((s, e) => s + e.amount, 0);

  const advanceGivenTotal = monthExpenses
    .filter((e) => e.category === 'Advance ₹500 Given')
    .reduce((s, e) => s + e.amount, 0);

  const totalExpense = groceryTotal + powerTotal + maintenanceTotal + salaryTotal + advanceGivenTotal;
  const netMargin = totalReceived - totalExpense;

  // Occupancy stats
  const activeResidents = residents.filter((r) => r.status === 'Active');
  const totalBeds = config.totalBeds || 90;
  const vacantBeds = Math.max(0, totalBeds - activeResidents.length);
  const vacancyRate = totalBeds > 0 ? ((vacantBeds / totalBeds) * 100).toFixed(1) : '0';

  // Format month name display
  const [yearStr, monthStr] = selectedMonth.split('-');
  const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  const displayMonthName = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleExportWord = () => {
    setIsExporting(true);
    try {
      generateWordMonthlyReport({
        config,
        month: selectedMonth,
        residents,
        payments: monthPayments,
        expenses: monthExpenses,
        budget: monthBudget,
      });
    } catch (err) {
      console.error('Word report export error', err);
      alert('Failed to generate Word report.');
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Month Selector & Export Action */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              Monthly Operational & Financial Report
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive audit for {config.name} · Exportable directly in Microsoft Word format.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase">
              Reporting Month:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-purple-50/70 border border-purple-200 rounded-lg text-xs font-bold text-[#4a0e4e] focus:outline-none focus:ring-2 focus:ring-purple-700 cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() =>
              generateResidentDetailsWordReport({
                config,
                residents,
                payments,
              })
            }
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-[#4a0e4e] font-bold text-xs rounded-xl transition-colors border border-purple-200 cursor-pointer shadow-xs whitespace-nowrap"
            title="Download Resident Details report in Word format (.doc) with Name, Room #, Payment Date, Receipt #, Mode, and Amount"
          >
            <FileText className="w-3.5 h-3.5 text-purple-700" />
            <span>Residents Report (Word)</span>
          </button>

          <button
            onClick={handleExportWord}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#4a0e4e] hover:bg-[#380b3b] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
            title="Download formatted monthly report in Microsoft Word document format"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting ? 'Generating Document...' : 'Generate Monthly Report in Word Format'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Primary Financial Audit Table: Rent Collections, Investments & Profit/Loss */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-700" />
              <span>Monthly Financial Audit: Collections, Investments & Profit/Loss</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Financial breakdown for {displayMonthName} ({config.name})
            </p>
          </div>

          {/* Bold Profit or Loss Callout Badge */}
          <div
            className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-2 ${
              netMargin >= 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                netMargin >= 0 ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
            <span>
              RESULT: {netMargin >= 0 ? 'NET PROFIT' : 'NET LOSS'} (₹{Math.abs(netMargin).toLocaleString('en-IN')})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Financial Parameter</th>
                <th className="py-3 px-5">Category / Description</th>
                <th className="py-3 px-5 text-right">Amount (INR)</th>
                <th className="py-3 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* 1. Monthly wise rent collection */}
              <tr className="bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors">
                <td className="py-3.5 px-5 font-bold text-emerald-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>Monthly Wise Rent Collection</span>
                </td>
                <td className="py-3.5 px-5 text-slate-600">
                  Total revenue collected ({monthPayments.length} fee receipts)
                </td>
                <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-700 text-base">
                  ₹{totalReceived.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    Revenue Inflow
                  </span>
                </td>
              </tr>

              {/* 2. How much invested */}
              <tr className="bg-purple-50/40 hover:bg-purple-50/70 transition-colors font-bold">
                <td className="py-3.5 px-5 font-bold text-purple-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>How Much Invested (Total Outflow)</span>
                </td>
                <td className="py-3.5 px-5 text-slate-600 font-normal">
                  Total operational expenditure for {displayMonthName}
                </td>
                <td className="py-3.5 px-5 text-right font-mono font-bold text-[#4a0e4e] text-base">
                  ₹{totalExpense.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-[#4a0e4e]">
                    Total Investment
                  </span>
                </td>
              </tr>

              {/* 3. Power bills */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-5 text-slate-800 pl-10">
                  • <strong>Power Bills</strong>
                </td>
                <td className="py-3.5 px-5 text-slate-500">
                  Electricity meters, commercial & power charges
                </td>
                <td className="py-3.5 px-5 text-right font-mono font-semibold text-slate-900">
                  ₹{powerTotal.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-5 text-center text-xs text-slate-400">
                  {powerTotal > 0 ? `${((powerTotal / (totalExpense || 1)) * 100).toFixed(0)}% of expenses` : 'None'}
                </td>
              </tr>

              {/* 4. Worker salaries */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-5 text-slate-800 pl-10">
                  • <strong>Worker Salaries</strong>
                </td>
                <td className="py-3.5 px-5 text-slate-500">
                  Hostel cooks, cleaning team, warden, watchman salaries
                </td>
                <td className="py-3.5 px-5 text-right font-mono font-semibold text-slate-900">
                  ₹{salaryTotal.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-5 text-center text-xs text-slate-400">
                  {salaryTotal > 0 ? `${((salaryTotal / (totalExpense || 1)) * 100).toFixed(0)}% of expenses` : 'None'}
                </td>
              </tr>

              {/* 5. Maintenance bills */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-5 text-slate-800 pl-10">
                  • <strong>Maintenance Bills</strong>
                </td>
                <td className="py-3.5 px-5 text-slate-500">
                  Plumbing, electrical repairs, Wi-Fi fiber, water filters
                </td>
                <td className="py-3.5 px-5 text-right font-mono font-semibold text-slate-900">
                  ₹{maintenanceTotal.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-5 text-center text-xs text-slate-400">
                  {maintenanceTotal > 0 ? `${((maintenanceTotal / (totalExpense || 1)) * 100).toFixed(0)}% of expenses` : 'None'}
                </td>
              </tr>

              {/* Grocery Section */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-5 text-slate-800 pl-10">
                  • <strong>Grocery Section</strong>
                </td>
                <td className="py-3.5 px-5 text-slate-500">
                  Rice, provisions, vegetables, milk, cooking gas
                </td>
                <td className="py-3.5 px-5 text-right font-mono font-semibold text-slate-900">
                  ₹{groceryTotal.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-5 text-center text-xs text-slate-400">
                  {groceryTotal > 0 ? `${((groceryTotal / (totalExpense || 1)) * 100).toFixed(0)}% of expenses` : 'None'}
                </td>
              </tr>

              {/* 6. Finally: Profit or Loss */}
              <tr
                className={`border-t-2 font-bold ${
                  netMargin >= 0
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                    : 'bg-rose-50 text-rose-950 border-rose-300'
                }`}
              >
                <td className="py-4 px-5 text-sm sm:text-base flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center shrink-0 ${
                      netMargin >= 0
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    ★
                  </span>
                  <span>FINALLY: {netMargin >= 0 ? 'PROFIT' : 'LOSS'}</span>
                </td>
                <td className="py-4 px-5 text-xs text-slate-600">
                  Rent Collection (₹{totalReceived.toLocaleString('en-IN')}) − How Much Invested (₹{totalExpense.toLocaleString('en-IN')})
                </td>
                <td
                  className={`py-4 px-5 text-right font-mono text-lg font-extrabold ${
                    netMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {netMargin >= 0 ? '+' : '-'} ₹{Math.abs(netMargin).toLocaleString('en-IN')}
                </td>
                <td className="py-4 px-5 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      netMargin >= 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {netMargin >= 0 ? 'PROFITABLE' : 'OPERATIONAL LOSS'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Executive Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fee Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Revenue Collected
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono tabular-nums">
            ₹{totalReceived.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {monthPayments.length} fee collections in {displayMonthName}
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Operating Expenses
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-1 font-mono tabular-nums">
            ₹{totalExpense.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Groceries + Power + Maint + Salaries
          </div>
        </div>

        {/* Net Operational Margin */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Net Monthly Balance / Profit
          </div>
          <div
            className={`text-2xl font-bold mt-1 font-mono tabular-nums ${
              netMargin >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            ₹{netMargin.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {netMargin >= 0 ? 'Positive Operating Surplus' : 'Operational Deficit'}
          </div>
        </div>

        {/* Vacancy Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Current Vacancy Rate
          </div>
          <div className="text-2xl font-bold text-purple-950 mt-1 font-mono tabular-nums">
            {vacancyRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {vacantBeds} of {totalBeds} beds vacant
          </div>
        </div>
      </div>

      {/* 3. Detailed Financial Breakdown Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h4 className="font-bold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Operating Investment Breakdown</span>
            <span className="text-xs font-mono font-normal text-slate-500">
              {displayMonthName}
            </span>
          </h4>
          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
              <span className="font-semibold text-amber-900">
                1. Grocery Section (Provisions & Veggies)
              </span>
              <span className="font-bold font-mono text-slate-900">
                ₹{groceryTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-sky-50/50 border border-sky-100">
              <span className="font-semibold text-sky-900">
                2. Power Bills (Electricity Charges)
              </span>
              <span className="font-bold font-mono text-slate-900">
                ₹{powerTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50/50 border border-orange-100">
              <span className="font-semibold text-orange-900">
                3. Maintenance Bills (Repairs & Utilities)
              </span>
              <span className="font-bold font-mono text-slate-900">
                ₹{maintenanceTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <span className="font-semibold text-emerald-900">
                4. Worker Salary's (Cook, Cleaners, Warden)
              </span>
              <span className="font-bold font-mono text-slate-900">
                ₹{salaryTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900">
              <span>Total Operational Expenditure</span>
              <span className="font-mono text-base text-purple-900">
                ₹{totalExpense.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Collections & Receivables Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h4 className="font-bold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Billing & Collection Health</span>
            <span className="text-xs font-mono font-normal text-slate-500">
              {displayMonthName}
            </span>
          </h4>
          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-700">Total Billed Invoiced Amount</span>
              <span className="font-bold font-mono text-slate-900">
                ₹{totalInvoiced.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <span className="font-semibold text-emerald-900">
                Total Amount Received
              </span>
              <span className="font-bold font-mono text-emerald-800">
                ₹{totalReceived.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50/50 border border-red-100">
              <span className="font-semibold text-red-900">
                Outstanding Balance / Unpaid Rent
              </span>
              <span className="font-bold font-mono text-red-700">
                ₹{totalBalanceDue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100 text-xs text-purple-950">
              <div className="font-semibold">Signatory & Administration Authority:</div>
              <div className="mt-1 font-serif text-sm font-bold text-purple-900">
                {config.ownerName}
              </div>
              <div className="text-[11px] text-purple-800">
                Owner / Management, {config.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Report Preview & Download Callout */}
      <div className="bg-gradient-to-r from-purple-900 to-[#4a0e4e] rounded-2xl p-7 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-purple-200 font-bold">
            Official Word Format Export
          </span>
          <h3 className="text-xl font-bold mt-1">
            Download {displayMonthName} Performance Dossier (.doc)
          </h3>
          <p className="text-xs text-purple-100 mt-1 max-w-xl">
            Generates an official document containing all financial ledgers, grocery/utility itemization, resident occupancy roster, and owner signature by {config.ownerName}.
          </p>
        </div>

        <button
          onClick={handleExportWord}
          disabled={isExporting}
          className="px-6 py-3 bg-white hover:bg-purple-50 text-[#4a0e4e] font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <FileText className="w-4 h-4 text-purple-900" />
          <span>{isExporting ? 'Generating...' : 'Download Word Report Now'}</span>
        </button>
      </div>
    </div>
  );
};
