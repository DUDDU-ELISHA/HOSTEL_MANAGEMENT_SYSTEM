import React, { useState } from 'react';
import {
  ExpenseItem,
  ExpenseCategory,
  MonthlyBudget,
  HostelConfig,
  HostelType,
} from '../types';
import { StorageService } from '../services/storage';
import { ExpenseModal } from './ExpenseModal';
import {
  ShoppingBag,
  Zap,
  Wrench,
  Users,
  Target,
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  IndianRupee,
  TrendingDown,
  Check,
  RotateCcw,
  Sliders
} from 'lucide-react';

interface InvestmentSectionProps {
  hostelId: HostelType;
  config: HostelConfig;
  expenses: ExpenseItem[];
  onRefresh: () => void;
}

export const InvestmentSection: React.FC<InvestmentSectionProps> = ({
  hostelId,
  config,
  expenses,
  onRefresh,
}) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [modalDefaultCategory, setModalDefaultCategory] =
    useState<ExpenseCategory>('Grocery');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Budget settings modal state
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const currentBudget = StorageService.getBudget(
    hostelId,
    selectedMonth === 'all' ? currentMonthStr : selectedMonth
  );

  const [groceryBudgetInput, setGroceryBudgetInput] = useState(
    currentBudget.groceryBudget || 0
  );
  const [powerBudgetInput, setPowerBudgetInput] = useState(
    currentBudget.powerBudget || 0
  );
  const [maintenanceBudgetInput, setMaintenanceBudgetInput] = useState(
    currentBudget.maintenanceBudget || 0
  );
  const [salaryBudgetInput, setSalaryBudgetInput] = useState(
    currentBudget.salaryBudget || 0
  );

  // Available unique months
  const availableMonths = Array.from(
    new Set([currentMonthStr, ...expenses.map((e) => e.month)])
  ).sort().reverse();

  // Filter expenses by month and search
  const monthlyExpenses = expenses.filter(
    (e) => selectedMonth === 'all' || e.month === selectedMonth
  );

  const filteredExpenses = monthlyExpenses.filter((e) => {
    const matchesCategory =
      activeTab === 'all' ||
      activeTab === 'budget' ||
      (activeTab === 'advance 500 given' && e.category === 'Advance ₹500 Given') ||
      e.category.toLowerCase() === activeTab.toLowerCase();

    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.billNumber && e.billNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Category totals
  const groceryTotal = monthlyExpenses
    .filter((e) => e.category === 'Grocery')
    .reduce((s, e) => s + e.amount, 0);

  const powerTotal = monthlyExpenses
    .filter((e) => e.category === 'Power Bills')
    .reduce((s, e) => s + e.amount, 0);

  const maintenanceTotal = monthlyExpenses
    .filter((e) => e.category === 'Maintenance')
    .reduce((s, e) => s + e.amount, 0);

  const salaryTotal = monthlyExpenses
    .filter((e) => e.category === 'Worker Salary')
    .reduce((s, e) => s + e.amount, 0);

  const advanceGivenTotal = monthlyExpenses
    .filter((e) => e.category === 'Advance ₹500 Given')
    .reduce((s, e) => s + e.amount, 0);

  const grandTotalExpense =
    groceryTotal + powerTotal + maintenanceTotal + salaryTotal + advanceGivenTotal;

  const totalAllocatedBudget =
    (currentBudget.groceryBudget || 0) +
    (currentBudget.powerBudget || 0) +
    (currentBudget.maintenanceBudget || 0) +
    (currentBudget.salaryBudget || 0);

  const handleOpenAdd = (category?: ExpenseCategory) => {
    setEditingExpense(null);
    setModalDefaultCategory(category || 'Grocery');
    setModalOpen(true);
  };

  const handleOpenEdit = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setModalDefaultCategory(expense.category);
    setModalOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    StorageService.deleteExpense(hostelId, id);
    setDeletingId(null);
    onRefresh();
  };

  const handleSaveExpense = (
    data: Omit<ExpenseItem, 'id' | 'createdAt'> & { id?: string }
  ) => {
    StorageService.saveExpense(data);
    setModalOpen(false);
    setEditingExpense(null);
    onRefresh();
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMonth = selectedMonth === 'all' ? currentMonthStr : selectedMonth;
    const total =
      Number(groceryBudgetInput) +
      Number(powerBudgetInput) +
      Number(maintenanceBudgetInput) +
      Number(salaryBudgetInput);

    StorageService.saveBudget({
      hostelId,
      month: targetMonth,
      groceryBudget: Number(groceryBudgetInput) || 0,
      powerBudget: Number(powerBudgetInput) || 0,
      maintenanceBudget: Number(maintenanceBudgetInput) || 0,
      salaryBudget: Number(salaryBudgetInput) || 0,
      totalTargetBudget: total,
    });
    setBudgetModalOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* 1. Category Overview Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Grocery Section */}
        <div
          onClick={() => setActiveTab('grocery')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'grocery'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 truncate">
              Grocery
            </span>
            <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 font-mono tabular-nums">
            ₹{groceryTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            Rice, Milk, Gas
          </div>
        </div>

        {/* Power Bills */}
        <div
          onClick={() => setActiveTab('power bills')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'power bills'
              ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 truncate">
              Power Bills
            </span>
            <Zap className="w-4 h-4 text-sky-600 shrink-0" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 font-mono tabular-nums">
            ₹{powerTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            Electricity Meters
          </div>
        </div>

        {/* Maintenance Bills */}
        <div
          onClick={() => setActiveTab('maintenance')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'maintenance'
              ? 'bg-orange-50/70 border-orange-300 ring-2 ring-orange-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 truncate">
              Maintenance
            </span>
            <Wrench className="w-4 h-4 text-orange-600 shrink-0" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 font-mono tabular-nums">
            ₹{maintenanceTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            Wi-Fi, RO, Repairs
          </div>
        </div>

        {/* Worker Salary's */}
        <div
          onClick={() => setActiveTab('worker salary')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'worker salary'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 truncate">
              Worker Salary
            </span>
            <Users className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 font-mono tabular-nums">
            ₹{salaryTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            Cook, Cleaners
          </div>
        </div>

        {/* Advance ₹500 Given Card */}
        <div
          onClick={() => setActiveTab('advance 500 given')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'advance 500 given'
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 truncate">
              Advance 500 Given
            </span>
            <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
          </div>
          <div className="text-lg font-bold text-indigo-900 mt-2 font-mono tabular-nums">
            ₹{advanceGivenTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-indigo-600 mt-0.5 truncate">
            ₹500 Advance Given Out
          </div>
        </div>

        {/* Our Budget Monthly Wise */}
        <div
          onClick={() => setActiveTab('budget')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'budget'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4a0e4e] truncate">
              Our Budget
            </span>
            <Target className="w-4 h-4 text-[#4a0e4e] shrink-0" />
          </div>
          <div className="text-lg font-bold text-[#4a0e4e] mt-2 font-mono tabular-nums">
            ₹{grandTotalExpense.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            {totalAllocatedBudget > 0
              ? `Budget: ₹${totalAllocatedBudget.toLocaleString('en-IN')}`
              : 'Set Monthly Target'}
          </div>
        </div>
      </div>

      {/* 2. Controls Bar: Month, Tabs, Search, and Add Expense */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Month selector & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                Month:
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-purple-50/70 border border-purple-200 rounded-lg text-xs font-bold text-[#4a0e4e] focus:outline-none focus:ring-2 focus:ring-purple-700 cursor-pointer"
              >
                <option value="all">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search investments by Title, Vendor/Recipient, Bill #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e] focus:bg-white"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setGroceryBudgetInput(currentBudget.groceryBudget || 0);
                setPowerBudgetInput(currentBudget.powerBudget || 0);
                setMaintenanceBudgetInput(currentBudget.maintenanceBudget || 0);
                setSalaryBudgetInput(currentBudget.salaryBudget || 0);
                setBudgetModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              title="Set or adjust monthly target budget"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure Budget</span>
            </button>

            {/* Dedicated Advance 500 Gived / Add button */}
            <button
              onClick={() => {
                setEditingExpense(null);
                setModalDefaultCategory('Advance ₹500 Given');
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors border border-indigo-300 cursor-pointer whitespace-nowrap shadow-xs"
              title="Record an Advance ₹500 given to a resident"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-700" />
              <span>Add Advance ₹500 Given</span>
            </button>

            <button
              onClick={() =>
                handleOpenAdd(
                  activeTab !== 'all' && activeTab !== 'budget'
                    ? (activeTab === 'grocery'
                        ? 'Grocery'
                        : activeTab === 'power bills'
                        ? 'Power Bills'
                        : activeTab === 'maintenance'
                        ? 'Maintenance'
                        : activeTab === 'advance 500 given'
                        ? 'Advance ₹500 Given'
                        : 'Worker Salary')
                    : 'Grocery'
                )
              }
              className="flex items-center gap-1.5 px-4 py-2 bg-[#4a0e4e] hover:bg-[#380b3b] text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Investment Record</span>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'all', label: 'All Investments' },
            { id: 'grocery', label: 'Grocery Section' },
            { id: 'power bills', label: 'Power Bills' },
            { id: 'maintenance', label: 'Maintenance Bills' },
            { id: 'worker salary', label: "Worker Salary's" },
            { id: 'advance 500 given', label: 'Advance ₹500 Given' },
            { id: 'budget', label: 'Our Budget Tracker' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#4a0e4e] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Budget View Mode (If ActiveTab is 'budget') */}
      {activeTab === 'budget' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Monthly Budget vs Actual Investment Tracker (
                {selectedMonth === 'all' ? currentMonthStr : selectedMonth})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor category allocations and keep operational spending within budget.
              </p>
            </div>
            <button
              onClick={() => setBudgetModalOpen(true)}
              className="px-3 py-1.5 bg-purple-50 text-[#4a0e4e] font-semibold text-xs rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer"
            >
              Adjust Budget Targets
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category 1: Grocery */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900">Grocery Section</span>
                <span className="font-mono text-xs text-slate-500">
                  Target: ₹{(currentBudget.groceryBudget || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between text-xs">
                <span className="text-slate-600">Actual Spent:</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  ₹{groceryTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${
                    currentBudget.groceryBudget > 0 &&
                    groceryTotal > currentBudget.groceryBudget
                      ? 'bg-red-600'
                      : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${
                      currentBudget.groceryBudget > 0
                        ? Math.min(100, (groceryTotal / currentBudget.groceryBudget) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Category 2: Power */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900">Power Bills</span>
                <span className="font-mono text-xs text-slate-500">
                  Target: ₹{(currentBudget.powerBudget || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between text-xs">
                <span className="text-slate-600">Actual Spent:</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  ₹{powerTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${
                    currentBudget.powerBudget > 0 &&
                    powerTotal > currentBudget.powerBudget
                      ? 'bg-red-600'
                      : 'bg-sky-500'
                  }`}
                  style={{
                    width: `${
                      currentBudget.powerBudget > 0
                        ? Math.min(100, (powerTotal / currentBudget.powerBudget) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Category 3: Maintenance */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900">Maintenance Bills</span>
                <span className="font-mono text-xs text-slate-500">
                  Target: ₹{(currentBudget.maintenanceBudget || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between text-xs">
                <span className="text-slate-600">Actual Spent:</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  ₹{maintenanceTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${
                    currentBudget.maintenanceBudget > 0 &&
                    maintenanceTotal > currentBudget.maintenanceBudget
                      ? 'bg-red-600'
                      : 'bg-orange-500'
                  }`}
                  style={{
                    width: `${
                      currentBudget.maintenanceBudget > 0
                        ? Math.min(100, (maintenanceTotal / currentBudget.maintenanceBudget) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Category 4: Worker Salary */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900">Worker Salary's</span>
                <span className="font-mono text-xs text-slate-500">
                  Target: ₹{(currentBudget.salaryBudget || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between text-xs">
                <span className="text-slate-600">Actual Spent:</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  ₹{salaryTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${
                    currentBudget.salaryBudget > 0 &&
                    salaryTotal > currentBudget.salaryBudget
                      ? 'bg-red-600'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${
                      currentBudget.salaryBudget > 0
                        ? Math.min(100, (salaryTotal / currentBudget.salaryBudget) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Table of Expenses */}
      {activeTab !== 'budget' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Investment Items ({filteredExpenses.length} Records)
            </h3>
            <span className="text-xs font-mono font-bold text-slate-900">
              Total: ₹{filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-[#4a0e4e] flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                No Investment Records in this Category
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                No expenditure recorded for {selectedMonth}. Add your groceries, EB bills, maintenance, or staff salaries.
              </p>
              <button
                onClick={() => handleOpenAdd()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#4a0e4e] hover:bg-[#380b3b] text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Investment Record</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description / Title</th>
                    <th className="py-3 px-4">Paid To</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Bill #</th>
                    <th className="py-3 px-4 text-right">Amount (INR)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {e.date}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                            e.category === 'Grocery'
                              ? 'bg-amber-50 text-amber-800'
                              : e.category === 'Power Bills'
                              ? 'bg-sky-50 text-sky-800'
                              : e.category === 'Maintenance'
                              ? 'bg-orange-50 text-orange-800'
                              : e.category === 'Worker Salary'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {e.title}
                        {e.notes && (
                          <div className="text-[11px] text-slate-400 font-normal">
                            {e.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {e.paidTo || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {e.paymentMode}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-xs">
                        {e.billNumber || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{e.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(e)}
                            className="p-1 text-slate-500 hover:text-[#4a0e4e] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Edit expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(e.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              Confirm Expense Deletion
            </h4>
            <p className="text-xs text-slate-600 mt-1 mb-5">
              Are you sure you want to delete this expense record?
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

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={modalOpen}
        expense={editingExpense}
        defaultCategory={modalDefaultCategory}
        hostelId={hostelId}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
      />

      {/* Configure Budget Modal */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h4 className="font-bold text-base text-slate-900">
              Set Monthly Budget Target ({selectedMonth === 'all' ? currentMonthStr : selectedMonth})
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Configure spending targets to track operational surplus or overspending.
            </p>
            <form onSubmit={handleSaveBudget} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Grocery Budget (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={groceryBudgetInput}
                  onChange={(e) => setGroceryBudgetInput(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="25000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Power Bills Budget (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={powerBudgetInput}
                  onChange={(e) => setPowerBudgetInput(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="12000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Maintenance Budget (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maintenanceBudgetInput}
                  onChange={(e) => setMaintenanceBudgetInput(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="6000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Worker Salaries Budget (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={salaryBudgetInput}
                  onChange={(e) => setSalaryBudgetInput(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="25000"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#4a0e4e] text-white rounded-lg cursor-pointer"
                >
                  Save Monthly Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
