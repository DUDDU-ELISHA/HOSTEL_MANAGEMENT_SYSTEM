import React, { useState, useEffect } from 'react';
import { PaymentRecord, Resident, HostelType, PaymentMode, PaymentStatus } from '../types';
import { StorageService } from '../services/storage';
import { formatReceiptNumber } from '../services/pdfGenerator';
import {
  X,
  CreditCard,
  IndianRupee,
  Calendar,
  User,
  Home,
  Mail,
  History,
  CheckCircle,
  Copy,
  Clock,
  RotateCcw
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  payment: PaymentRecord | null; // null for add, object for edit
  residents: Resident[];
  hostelId: HostelType;
  preselectedResident?: Resident | null;
  onClose: () => void;
  onSave: (
    data: Omit<PaymentRecord, 'id' | 'receiptNumber' | 'createdAt'> & {
      id?: string;
      receiptNumber?: string;
      sendEmailNow?: boolean;
    }
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  payment,
  residents,
  hostelId,
  preselectedResident,
  onClose,
  onSave,
}) => {
  const draftKey = `hms_draft_payment_${hostelId}`;

  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [residentName, setResidentName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [residentEmail, setResidentEmail] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [monthlyRent, setMonthlyRent] = useState<number | ''>(7000);
  const [advanceDeposit, setAdvanceDeposit] = useState<number | ''>(0);
  const [amountReceived, setAmountReceived] = useState<number | ''>(7000);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmailImmediately, setSendEmailImmediately] = useState(true);
  const [draftRestored, setDraftRestored] = useState(false);

  // All historical payments for checking previous entered details
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      const records = StorageService.getPayments(hostelId);
      setAllPayments(records);

      if (payment) {
        // Editing existing payment
        setSelectedResidentId(payment.residentId || '');
        setResidentName(payment.residentName);
        setRoomNumber(payment.roomNumber);
        setResidentEmail(payment.residentEmail || '');
        setPaymentDate(payment.paymentDate);
        setPaymentMode(payment.paymentMode);
        setMonthlyRent(payment.monthlyRent);
        setAdvanceDeposit(payment.advanceDeposit || 0);
        setAmountReceived(payment.amountReceived);
        setReceiptNumber(payment.receiptNumber);
        setNotes(payment.notes || '');
        setSendEmailImmediately(false);
        setDraftRestored(false);
      } else if (preselectedResident) {
        // Preselected resident
        setSelectedResidentId(preselectedResident.id);
        setResidentName(preselectedResident.name);
        setRoomNumber(preselectedResident.roomNumber);
        setResidentEmail(preselectedResident.email);
        setMonthlyRent(preselectedResident.monthlyRent);
        setAdvanceDeposit(0);
        setAmountReceived(preselectedResident.monthlyRent);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMode('UPI');
        setReceiptNumber('');
        setNotes('');
        setSendEmailImmediately(true);
        setDraftRestored(false);
      } else {
        // Check for saved draft
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            setSelectedResidentId(draft.selectedResidentId || '');
            setResidentName(draft.residentName || '');
            setRoomNumber(draft.roomNumber || '');
            setResidentEmail(draft.residentEmail || '');
            setPaymentDate(draft.paymentDate || new Date().toISOString().split('T')[0]);
            setPaymentMode(draft.paymentMode || 'UPI');
            setMonthlyRent(draft.monthlyRent !== undefined ? draft.monthlyRent : 7000);
            setAdvanceDeposit(draft.advanceDeposit || 0);
            setAmountReceived(draft.amountReceived !== undefined ? draft.amountReceived : 7000);
            setReceiptNumber(draft.receiptNumber || '');
            setNotes(draft.notes || '');
            setDraftRestored(true);
          } catch {
            resetFields();
          }
        } else {
          resetFields();
        }
      }
    }
  }, [payment, preselectedResident, isOpen, hostelId]);

  const resetFields = () => {
    setSelectedResidentId('');
    setResidentName('');
    setRoomNumber('');
    setResidentEmail('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('UPI');
    setMonthlyRent(7000);
    setAdvanceDeposit(0);
    setAmountReceived(7000);
    setReceiptNumber('');
    setNotes('');
    setSendEmailImmediately(true);
    setDraftRestored(false);
  };

  // Auto-save draft on changes (when adding new payment)
  useEffect(() => {
    if (!isOpen || payment) return;
    const draft = {
      selectedResidentId,
      residentName,
      roomNumber,
      residentEmail,
      paymentDate,
      paymentMode,
      monthlyRent,
      advanceDeposit,
      amountReceived,
      receiptNumber,
      notes,
    };
    // Save draft if user has entered at least a name or amount
    if (residentName || roomNumber || notes) {
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [
    isOpen,
    payment,
    selectedResidentId,
    residentName,
    roomNumber,
    residentEmail,
    paymentDate,
    paymentMode,
    monthlyRent,
    advanceDeposit,
    amountReceived,
    receiptNumber,
    notes,
    draftKey,
  ]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    resetFields();
  };

  // Derived financial figures
  const totalInvoiced = (Number(monthlyRent) || 0) + (Number(advanceDeposit) || 0);
  const outstandingBalance = Math.max(0, totalInvoiced - (Number(amountReceived) || 0));

  const paymentStatus: PaymentStatus =
    outstandingBalance === 0
      ? 'Paid in Full'
      : Number(amountReceived) > 0
      ? 'Partial'
      : 'Pending';

  // Handle selecting an existing resident
  const handleResidentSelect = (resId: string) => {
    setSelectedResidentId(resId);
    if (!resId) return;

    const found = residents.find((r) => r.id === resId);
    if (found) {
      setResidentName(found.name);
      setRoomNumber(found.roomNumber);
      setResidentEmail(found.email);
      setMonthlyRent(found.monthlyRent);
      setAmountReceived(found.monthlyRent);
    }
  };

  // Previous payments for the selected resident or room
  const previousPayments = allPayments.filter((p) => {
    if (!residentName && !roomNumber && !selectedResidentId) return false;
    const matchesId = selectedResidentId && p.residentId === selectedResidentId;
    const matchesName =
      residentName &&
      p.residentName.trim().toLowerCase() === residentName.trim().toLowerCase();
    const matchesRoom =
      roomNumber &&
      p.roomNumber.trim().toLowerCase() === roomNumber.trim().toLowerCase();
    return matchesId || (matchesName && matchesRoom);
  });

  // Copy details from a previous payment
  const handleCopyPreviousPayment = (prev: PaymentRecord) => {
    setMonthlyRent(prev.monthlyRent);
    setAmountReceived(prev.monthlyRent);
    setPaymentMode(prev.paymentMode);
    if (prev.residentEmail) setResidentEmail(prev.residentEmail);
    setNotes(`Recurring payment based on receipt #${formatReceiptNumber(prev.receiptNumber)}`);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const month = paymentDate.substring(0, 7);

    // Clear auto-saved draft on successful submission
    localStorage.removeItem(draftKey);

    onSave({
      id: payment ? payment.id : undefined,
      receiptNumber: receiptNumber.trim() || undefined,
      hostelId,
      residentId: selectedResidentId || undefined,
      residentName: residentName.trim(),
      roomNumber: roomNumber.trim(),
      residentEmail: residentEmail.trim() || undefined,
      paymentDate,
      month,
      paymentMode,
      monthlyRent: Number(monthlyRent) || 0,
      advanceDeposit: Number(advanceDeposit) || 0,
      totalInvoiced,
      amountReceived: Number(amountReceived) || 0,
      outstandingBalance,
      paymentStatus,
      notes: notes.trim(),
      sendEmailNow: sendEmailImmediately,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#4a0e4e] text-white">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-200" />
            <h3 className="font-bold text-base">
              {payment ? 'Edit Payment Record' : 'Record New Fee Payment'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-purple-200 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto-save notification banner */}
        {!payment && (
          <div className="bg-purple-50/70 border-b border-purple-100 px-6 py-2 flex items-center justify-between text-xs text-purple-900">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Details are automatically saved as you type</span>
              {draftRestored && (
                <span className="text-emerald-700 font-bold ml-1">
                  (Restored previously entered details)
                </span>
              )}
            </div>
            {draftRestored && (
              <button
                type="button"
                onClick={clearDraft}
                className="flex items-center gap-1 text-[11px] text-purple-700 hover:text-purple-900 underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Form</span>
              </button>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Select from Registered Residents */}
          {residents.length > 0 && !payment && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Select Existing Resident (Auto-fills info)
              </label>
              <select
                value={selectedResidentId}
                onChange={(e) => handleResidentSelect(e.target.value)}
                className="w-full px-3.5 py-2 bg-purple-50/50 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 font-medium"
              >
                <option value="">-- Or enter resident details below --</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.roomNumber} (Rent: ₹{r.monthlyRent})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Resident Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hari"
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Room Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Room 702"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white font-medium"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash</option>
                <option value="Cash + UPI">Cash + UPI Split</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Monthly Rent (INR) *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="7000"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Advance Deposit (INR)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={advanceDeposit}
                onChange={(e) => setAdvanceDeposit(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-emerald-800 mb-1">
                Amount Paid / Received *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="7000"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-sm text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Live Invoiced & Balance summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-slate-500">Total Invoiced:</div>
              <div className="font-bold text-slate-900 font-mono">
                ₹{totalInvoiced.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Amount Received:</div>
              <div className="font-bold text-emerald-700 font-mono">
                ₹{(Number(amountReceived) || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Outstanding Balance:</div>
              <div
                className={`font-bold font-mono ${
                  outstandingBalance === 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                ₹{outstandingBalance.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* ================= PREVIOUS ENTERED PAYMENT HISTORY ================= */}
          {previousPayments.length > 0 && (
            <div className="p-3.5 bg-slate-50 border border-purple-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950">
                  <History className="w-3.5 h-3.5 text-purple-700" />
                  <span>
                    Previous Entered Details for {residentName || roomNumber} ({previousPayments.length} records)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">Click to reuse details</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {previousPayments.slice(0, 3).map((prev) => (
                  <div
                    key={prev.id}
                    className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs hover:border-purple-300 transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#4a0e4e]">
                        #{formatReceiptNumber(prev.receiptNumber)}
                      </span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-slate-600">{prev.paymentDate}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="font-semibold text-emerald-700">
                        ₹{prev.amountReceived.toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-400 mx-1">({prev.paymentMode})</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyPreviousPayment(prev)}
                      className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-[#4a0e4e] bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Use Rate</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Resident Email Address (for Receipt)
              </label>
              <input
                type="email"
                placeholder="e.g. hari.resident@gmail.com"
                value={residentEmail}
                onChange={(e) => setResidentEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Receipt # (Starts from 001)
              </label>
              <input
                type="text"
                placeholder="Auto-assigned (e.g. 001)"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Payment Remarks / Transaction ID
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via GPay UPI ref #827391823"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
            />
          </div>

          {/* Email dispatch checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmailImmediately}
                onChange={(e) => setSendEmailImmediately(e.target.checked)}
                className="rounded border-slate-300 text-purple-700 focus:ring-purple-600"
              />
              <span className="font-medium">
                Prompt to send official payment receipt to resident's mail upon saving
              </span>
            </label>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Auto-saved to encrypted vault</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#4a0e4e] hover:bg-[#380b3b] text-white rounded-lg shadow-sm cursor-pointer"
              >
                {payment ? 'Update Payment Record' : 'Save Payment & Generate Receipt'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
