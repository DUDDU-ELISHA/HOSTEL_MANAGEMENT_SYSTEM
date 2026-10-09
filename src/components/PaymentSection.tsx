import React, { useState } from 'react';
import {
  PaymentRecord,
  Resident,
  HostelConfig,
  HostelType,
} from '../types';
import { StorageService } from '../services/storage';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { EmailReceiptModal } from './EmailReceiptModal';
import { formatReceiptNumber, downloadReceiptAsPDF } from '../services/pdfGenerator';
import { generateResidentDetailsWordReport } from '../services/wordExport';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  Download,
  Mail,
  Edit2,
  Trash2,
  CheckCircle,
  FileText,
  Printer,
  Sparkles
} from 'lucide-react';

interface PaymentSectionProps {
  hostelId: HostelType;
  config: HostelConfig;
  residents: Resident[];
  payments: PaymentRecord[];
  onRefresh: () => void;
  preselectedResidentForPayment?: Resident | null;
  onClearPreselectedResident?: () => void;
}

const MONTHS_LIST = [
  { num: '01', name: 'January' },
  { num: '02', name: 'February' },
  { num: '03', name: 'March' },
  { num: '04', name: 'April' },
  { num: '05', name: 'May' },
  { num: '06', name: 'June' },
  { num: '07', name: 'July' },
  { num: '08', name: 'August' },
  { num: '09', name: 'September' },
  { num: '10', name: 'October' },
  { num: '11', name: 'November' },
  { num: '12', name: 'December' },
];

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  hostelId,
  config,
  residents,
  payments,
  onRefresh,
  preselectedResidentForPayment,
  onClearPreselectedResident,
}) => {
  const currentYear = new Date().getFullYear().toString(); // e.g. "2026"
  const currentMonthNum = String(new Date().getMonth() + 1).padStart(2, '0'); // e.g. "10"
  
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonthNum, setSelectedMonthNum] = useState<string>(currentMonthNum); // "01" to "12" or "all"
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [modalOpen, setModalOpen] = useState(
    Boolean(preselectedResidentForPayment)
  );
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<PaymentRecord | null>(null);
  const [emailingPayment, setEmailingPayment] = useState<PaymentRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Formatted active month query: e.g. "2026-10" or "all"
  const activeMonthQuery =
    selectedMonthNum === 'all' ? 'all' : `${selectedYear}-${selectedMonthNum}`;

  // Filter payments strictly based on paymentDate month
  const filteredPayments = payments.filter((p) => {
    const paymentMonth = p.paymentDate ? p.paymentDate.slice(0, 7) : p.month;
    const matchesMonth =
      activeMonthQuery === 'all'
        ? paymentMonth.startsWith(selectedYear)
        : paymentMonth === activeMonthQuery;

    const matchesSearch =
      p.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.receiptNumber.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' || p.paymentStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchesMonth && matchesSearch && matchesStatus;
  });

  // Calculate stats for current filter
  const totalReceived = filteredPayments.reduce((s, p) => s + (p.amountReceived || 0), 0);
  const totalInvoiced = filteredPayments.reduce((s, p) => s + (p.totalInvoiced || 0), 0);
  const totalBalance = filteredPayments.reduce((s, p) => s + (p.outstandingBalance || 0), 0);

  const selectedMonthName =
    selectedMonthNum === 'all'
      ? `Full Year ${selectedYear} (Jan - Dec)`
      : `${MONTHS_LIST.find((m) => m.num === selectedMonthNum)?.name} ${selectedYear}`;

  const handleOpenAdd = () => {
    setEditingPayment(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setModalOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    StorageService.deletePayment(hostelId, id);
    setDeletingId(null);
    onRefresh();
  };

  const handleDirectDownloadPDF = (payment: PaymentRecord) => {
    downloadReceiptAsPDF(payment, config);
  };

  const handleSavePayment = (
    data: Omit<PaymentRecord, 'id' | 'receiptNumber' | 'createdAt'> & {
      id?: string;
      receiptNumber?: string;
      sendEmailNow?: boolean;
    }
  ) => {
    const { sendEmailNow, ...paymentData } = data;
    const saved = StorageService.savePayment(paymentData);
    setModalOpen(false);
    setEditingPayment(null);
    if (onClearPreselectedResident) {
      onClearPreselectedResident();
    }
    onRefresh();

    if (sendEmailNow) {
      setEmailingPayment(saved);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Monthly Financial Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Collections ({selectedMonthName})
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono tabular-nums">
            ₹{totalReceived.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            From {filteredPayments.length} recorded payments
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Invoiced Amount
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-1 font-mono tabular-nums">
            ₹{totalInvoiced.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Rent & deposit invoices
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pending / Outstanding Balance
          </div>
          <div
            className={`text-2xl font-bold mt-1 font-mono tabular-nums ${
              totalBalance === 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            ₹{totalBalance.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalBalance === 0 ? 'All fees settled in full' : 'Uncollected balance dues'}
          </div>
        </div>
      </div>

      {/* 2. Monthly Wise Navigation: January to December */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-700" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Monthly Wise Payment Records:
            </span>
            <span className="text-xs text-purple-900 font-semibold bg-purple-50 px-2 py-0.5 rounded">
              {selectedMonthName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        {/* 12-Month Bar (Strictly January to December) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          <button
            onClick={() => setSelectedMonthNum('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedMonthNum === 'all'
                ? 'bg-[#4a0e4e] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Months (Jan - Dec)
          </button>

          {MONTHS_LIST.map((m) => {
            const isSelected = selectedMonthNum === m.num;
            // Check count of records in this month strictly based on paymentDate
            const monthKey = `${selectedYear}-${m.num}`;
            const count = payments.filter((p) => {
              const pm = p.paymentDate ? p.paymentDate.slice(0, 7) : p.month;
              return pm === monthKey;
            }).length;

            return (
              <button
                key={m.num}
                onClick={() => setSelectedMonthNum(m.num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#4a0e4e] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{m.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-100 text-purple-900 font-bold'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Toolbar: Search, Status Filter, View Mode, and Add Payment Button */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search receipts by Resident Name, Room #, Receipt # (e.g. 001)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
          >
            <option value="all">All Status</option>
            <option value="paid in full">Paid in Full</option>
            <option value="partial">Partial</option>
          </select>


          <button
            onClick={() =>
              generateResidentDetailsWordReport({
                config,
                residents,
                payments,
              })
            }
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-[#4a0e4e] font-bold text-xs rounded-lg transition-colors border border-purple-200 cursor-pointer shadow-xs whitespace-nowrap"
            title="Download Resident Details report in Word format (.doc) with Name, Room #, Payment Date, Receipt #, Mode, and Amount"
          >
            <FileText className="w-3.5 h-3.5 text-purple-700" />
            <span>Residents Report (Word)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4a0e4e] hover:bg-[#380b3b] text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Payment Record</span>
          </button>
        </div>
      </div>

      {/* 4. Display Payments: EITHER as Full Receipt CSS Cards OR Table */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-[#4a0e4e] flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            No Payment Records in {selectedMonthName}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            No fee payments logged for this period. Add a payment record to generate official digital receipts with receipt number starting from 001.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4a0e4e] hover:bg-[#380b3b] text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Fee Payment</span>
          </button>
        </div>
      ) : (
        /* ================= HIGH-DENSITY LEDGER TABLE VIEW ================= */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-700" />
              <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                Payment Records ({selectedMonthName})
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800">
              Total: ₹{totalReceived.toLocaleString('en-IN')} ({filteredPayments.length} transactions)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Resident Name</th>
                  <th className="py-3 px-4">Room #</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const receiptNum = formatReceiptNumber(p.receiptNumber);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#4a0e4e]">
                        #{receiptNum}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {p.residentName}
                        </div>
                        {p.residentEmail && (
                          <div className="text-[11px] text-slate-400">
                            {p.residentEmail}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {p.roomNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {p.paymentDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded text-xs">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{p.amountReceived.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span
                          className={
                            p.outstandingBalance === 0
                              ? 'text-slate-400 font-normal'
                              : 'text-red-600 font-bold'
                          }
                        >
                          ₹{p.outstandingBalance.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            p.paymentStatus === 'Paid in Full'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct PDF Download with receipt # starting from 001 */}
                          <button
                            onClick={() => handleDirectDownloadPDF(p)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#4a0e4e] hover:bg-[#380b3b] text-white rounded-md transition-colors cursor-pointer shadow-xs"
                            title="Download official receipt as PDF format"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF (#{receiptNum})</span>
                          </button>

                          {/* Preview Receipt */}
                          <button
                            onClick={() => setViewingReceipt(p)}
                            className="p-1 text-slate-600 hover:text-[#4a0e4e] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Preview receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Mail receipt */}
                          <button
                            onClick={() => setEmailingPayment(p)}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Send email receipt"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit payment */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 text-slate-500 hover:text-[#4a0e4e] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Edit payment"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete payment */}
                          <button
                            onClick={() => setDeletingId(p.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900">
              Confirm Payment Deletion
            </h4>
            <p className="text-xs text-slate-600 mt-1 mb-5">
              Are you sure you want to delete this payment record?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deletingId)}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Payment Modal */}
      <PaymentModal
        isOpen={modalOpen}
        payment={editingPayment}
        residents={residents}
        hostelId={hostelId}
        preselectedResident={preselectedResidentForPayment}
        onClose={() => {
          setModalOpen(false);
          setEditingPayment(null);
          if (onClearPreselectedResident) {
            onClearPreselectedResident();
          }
        }}
        onSave={handleSavePayment}
      />

      {/* Official Receipt Modal (Preview / Print / Direct Download) */}
      {viewingReceipt && (
        <ReceiptModal
          payment={viewingReceipt}
          config={config}
          isOpen={Boolean(viewingReceipt)}
          onClose={() => setViewingReceipt(null)}
          onSendEmail={(pay) => {
            setViewingReceipt(null);
            setEmailingPayment(pay);
          }}
        />
      )}

      {/* Email Receipt Modal */}
      {emailingPayment && (
        <EmailReceiptModal
          payment={emailingPayment}
          config={config}
          isOpen={Boolean(emailingPayment)}
          onClose={() => setEmailingPayment(null)}
          onSuccess={() => onRefresh()}
        />
      )}
    </div>
  );
};
