import React, { useState, useEffect } from 'react';
import { ExpenseItem, ExpenseCategory, HostelType, PaymentMode } from '../types';
import { StorageService } from '../services/storage';
import {
  X,
  Receipt,
  IndianRupee,
  Calendar,
  Tag,
  User,
  History,
  Copy,
  Clock,
  RotateCcw
} from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  expense: ExpenseItem | null;
  defaultCategory?: ExpenseCategory;
  hostelId: HostelType;
  onClose: () => void;
  onSave: (
    data: Omit<ExpenseItem, 'id' | 'createdAt'> & { id?: string }
  ) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  expense,
  defaultCategory = 'Grocery',
  hostelId,
  onClose,
  onSave,
}) => {
  const draftKey = `hms_draft_expense_${hostelId}`;

  const [category, setCategory] = useState<ExpenseCategory>(defaultCategory);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>(5000);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidTo, setPaidTo] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [billNumber, setBillNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);

  // All historical expenses for previous entered details
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      const records = StorageService.getExpenses(hostelId);
      setAllExpenses(records);

      if (expense) {
        setCategory(expense.category);
        setTitle(expense.title);
        setAmount(expense.amount);
        setDate(expense.date);
        setPaidTo(expense.paidTo || '');
        setPaymentMode(expense.paymentMode);
        setBillNumber(expense.billNumber || '');
        setNotes(expense.notes || '');
        setDraftRestored(false);
      } else {
        if (defaultCategory === 'Advance ₹500 Given') {
          setCategory('Advance ₹500 Given');
          setTitle('Advance ₹500 Given to Resident');
          setAmount(500);
          setDate(new Date().toISOString().split('T')[0]);
          setPaidTo('');
          setPaymentMode('UPI');
          setBillNumber('');
          setNotes('');
          setDraftRestored(false);
        } else {
          // Check for saved draft
          const saved = localStorage.getItem(draftKey);
          if (saved) {
            try {
              const draft = JSON.parse(saved);
              setCategory(draft.category || defaultCategory);
              setTitle(draft.title || '');
              setAmount(draft.amount !== undefined ? draft.amount : '');
              setDate(draft.date || new Date().toISOString().split('T')[0]);
              setPaidTo(draft.paidTo || '');
              setPaymentMode(draft.paymentMode || 'UPI');
              setBillNumber(draft.billNumber || '');
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
    }
  }, [expense, defaultCategory, isOpen, hostelId]);

  const resetFields = () => {
    setCategory(defaultCategory);
    setTitle(defaultCategory === 'Advance ₹500 Given' ? 'Advance ₹500 Given to Resident' : '');
    setAmount(defaultCategory === 'Advance ₹500 Given' ? 500 : '');
    setDate(new Date().toISOString().split('T')[0]);
    setPaidTo('');
    setPaymentMode('UPI');
    setBillNumber('');
    setNotes('');
    setDraftRestored(false);
  };

  const handleCategoryChange = (newCat: ExpenseCategory) => {
    setCategory(newCat);
    if (newCat === 'Advance ₹500 Given') {
      if (!amount || amount === 5000) setAmount(500);
      if (!title || title === '') setTitle('Advance ₹500 Given to Resident');
    }
  };

  // Auto-save draft as user types
  useEffect(() => {
    if (!isOpen || expense) return;
    const draft = {
      category,
      title,
      amount,
      date,
      paidTo,
      paymentMode,
      billNumber,
      notes,
    };
    if (title || amount || paidTo || notes) {
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [
    isOpen,
    expense,
    category,
    title,
    amount,
    date,
    paidTo,
    paymentMode,
    billNumber,
    notes,
    draftKey,
  ]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    resetFields();
  };

  // Previous entered expenses in the currently selected category
  const previousCategoryExpenses = allExpenses.filter(
    (e) => e.category === category
  );

  const handleReusePreviousExpense = (prev: ExpenseItem) => {
    setTitle(prev.title);
    setAmount(prev.amount);
    if (prev.paidTo) setPaidTo(prev.paidTo);
    setPaymentMode(prev.paymentMode);
    if (prev.billNumber) setBillNumber(prev.billNumber);
    if (prev.notes) setNotes(prev.notes);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const month = date.substring(0, 7);
    localStorage.removeItem(draftKey);

    onSave({
      id: expense ? expense.id : undefined,
      hostelId,
      category,
      title: title.trim(),
      amount: Number(amount) || 0,
      date,
      month,
      paidTo: paidTo.trim() || undefined,
      paymentMode,
      billNumber: billNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#4a0e4e] text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-200" />
            <h3 className="font-bold text-base">
              {expense ? 'Edit Expense Record' : 'Record New Investment / Expense'}
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
        {!expense && (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Expense Category *
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white font-medium"
              >
                <option value="Grocery">Grocery Section</option>
                <option value="Power Bills">Power Bills</option>
                <option value="Maintenance">Maintenance Bills</option>
                <option value="Worker Salary">Worker Salary's</option>
                <option value="Advance ₹500 Given">Advance ₹500 Given</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Date of Expense *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Title / Item Description *
            </label>
            <input
              type="text"
              required
              placeholder={
                category === 'Grocery'
                  ? 'e.g. Vegetables & Rice Bags'
                  : category === 'Power Bills'
                  ? 'e.g. TSSPDCL 2nd Floor EB Meter'
                  : category === 'Worker Salary'
                  ? 'e.g. Head Cook Monthly Salary'
                  : category === 'Advance ₹500 Given'
                  ? 'e.g. Advance ₹500 Given to Resident (Hari - Room 702)'
                  : 'e.g. Plumbing Repair & Wi-Fi Bill'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
            />
          </div>

          {/* ================= PREVIOUS ENTERED EXPENSES IN THIS CATEGORY ================= */}
          {previousCategoryExpenses.length > 0 && !expense && (
            <div className="p-3 bg-slate-50 border border-purple-200 rounded-xl text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-purple-950">
                  <History className="w-3.5 h-3.5 text-purple-700" />
                  <span>
                    Previous Entered Details in {category} ({previousCategoryExpenses.length} entries):
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Click to reuse</span>
              </div>

              <div className="space-y-1 max-h-28 overflow-y-auto">
                {previousCategoryExpenses.slice(0, 3).map((prev) => (
                  <button
                    key={prev.id}
                    type="button"
                    onClick={() => handleReusePreviousExpense(prev)}
                    className="w-full text-left p-1.5 bg-white hover:bg-purple-50/60 rounded border border-slate-200 hover:border-purple-300 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="font-medium text-slate-800 truncate mr-2">
                      {prev.title} {prev.paidTo && `(${prev.paidTo})`}
                    </span>
                    <span className="font-mono font-semibold text-purple-900 shrink-0">
                      ₹{prev.amount.toLocaleString('en-IN')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Amount Paid (INR) *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white font-mono"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Paid To / Recipient / Vendor
              </label>
              <input
                type="text"
                placeholder="e.g. Sri Rama Traders, Cook Ramesh"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Bill / Voucher / Ref #
              </label>
              <input
                type="text"
                placeholder="e.g. BILL-9823 or EB#4412"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              placeholder="Additional expenditure details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Details auto-saved automatically</span>
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
                {expense ? 'Update Expense' : 'Save Expense Record'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
