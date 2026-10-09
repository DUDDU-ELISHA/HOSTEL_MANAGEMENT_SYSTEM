import React, { useState } from 'react';
import { Resident, HostelConfig, HostelType } from '../types';
import { StorageService } from '../services/storage';
import { generateVacatedResidentsWordReport } from '../services/wordExport';
import {
  UserMinus,
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Calendar,
  Phone,
  Home,
  IndianRupee,
  RotateCcw,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  UserCheck,
  Check,
  ArrowRight
} from 'lucide-react';

interface VacatedResidentsSectionProps {
  hostelId: HostelType;
  config: HostelConfig;
  residents: Resident[];
  onRefresh: () => void;
  onNavigateToActive?: () => void;
}

export const VacatedResidentsSection: React.FC<VacatedResidentsSectionProps> = ({
  hostelId,
  config,
  residents,
  onRefresh,
  onNavigateToActive,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'received' | 'not_received'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  // Modals
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state for Record / Edit Vacated Resident
  const [selectedActiveResidentId, setSelectedActiveResidentId] = useState<string>('');
  const [formName, setFormName] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState('');
  const [formVacatedDate, setFormVacatedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formAdvanceReceived, setFormAdvanceReceived] = useState<boolean>(true);
  const [formRent, setFormRent] = useState<number>(7000);
  const [formNotes, setFormNotes] = useState('');

  // Vacated residents are residents with status 'Left'
  const vacatedResidents = residents.filter((r) => r.status === 'Left');
  const activeResidents = residents.filter((r) => r.status === 'Active');

  // Months available in vacated dates
  const availableMonths = Array.from(
    new Set(
      vacatedResidents
        .map((r) => r.vacatedDate?.substring(0, 7))
        .filter(Boolean) as string[]
    )
  ).sort().reverse();

  // Filtered vacated residents
  const filteredResidents = vacatedResidents.filter((r) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanRoomNum = r.roomNumber.toLowerCase().replace(/[^0-9]/g, '');
    const cleanTermDigits = term.replace(/[^0-9]/g, '');

    const matchesName = r.name.toLowerCase().includes(term);
    const matchesRoom =
      r.roomNumber.toLowerCase().includes(term) ||
      (cleanTermDigits.length > 0 && cleanRoomNum.includes(cleanTermDigits));
    const matchesPhone = r.phone.includes(term);
    const matchesSearch = term === '' || matchesName || matchesRoom || matchesPhone;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'received' && r.advance500Received === true) ||
      (statusFilter === 'not_received' && r.advance500Received !== true);

    const rMonth = r.vacatedDate?.substring(0, 7);
    const matchesMonth = monthFilter === 'all' || rMonth === monthFilter;

    return matchesSearch && matchesStatus && matchesMonth;
  });

  // Aggregations
  const totalVacated = vacatedResidents.length;
  const advanceReceivedCount = vacatedResidents.filter((r) => r.advance500Received).length;
  const advancePendingCount = totalVacated - advanceReceivedCount;
  const advanceReceivedAmount = advanceReceivedCount * 500;
  const advancePendingAmount = advancePendingCount * 500;

  // Toggle Advance 500 status with 1 click
  const handleToggleAdvance500 = (resident: Resident) => {
    StorageService.toggleAdvance500Status(hostelId, resident.id, !resident.advance500Received);
    onRefresh();
  };

  // Open modal for recording a vacated resident
  const handleOpenRecordModal = (presetResident?: Resident) => {
    if (presetResident) {
      // Editing existing vacated resident
      setEditingResident(presetResident);
      setSelectedActiveResidentId(presetResident.id);
      setFormName(presetResident.name);
      setFormRoom(presetResident.roomNumber);
      setFormPhone(presetResident.phone);
      setFormJoiningDate(presetResident.joiningDate || '');
      setFormVacatedDate(presetResident.vacatedDate || new Date().toISOString().split('T')[0]);
      setFormAdvanceReceived(presetResident.advance500Received ?? false);
      setFormRent(presetResident.monthlyRent || 7000);
      setFormNotes(presetResident.notes || '');
    } else {
      // New vacated entry
      setEditingResident(null);
      setSelectedActiveResidentId('');
      setFormName('');
      setFormRoom('');
      setFormPhone('');
      setFormJoiningDate(new Date().toISOString().split('T')[0]);
      setFormVacatedDate(new Date().toISOString().split('T')[0]);
      setFormAdvanceReceived(true);
      setFormRent(7000);
      setFormNotes('');
    }
    setRecordModalOpen(true);
  };

  // When active resident is selected from dropdown
  const handleSelectActiveResident = (resId: string) => {
    setSelectedActiveResidentId(resId);
    if (!resId) {
      setFormName('');
      setFormRoom('');
      setFormPhone('');
      setFormJoiningDate(new Date().toISOString().split('T')[0]);
      setFormRent(7000);
      return;
    }
    const found = activeResidents.find((r) => r.id === resId);
    if (found) {
      setFormName(found.name);
      setFormRoom(found.roomNumber);
      setFormPhone(found.phone);
      setFormJoiningDate(found.joiningDate);
      setFormRent(found.monthlyRent);
      setFormNotes(found.notes || '');
    }
  };

  // Submit Vacated Record
  const handleSubmitRecord = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingResident) {
      // Update existing record
      StorageService.saveResident({
        ...editingResident,
        name: formName.trim(),
        roomNumber: formRoom.trim(),
        phone: formPhone.trim(),
        joiningDate: formJoiningDate,
        vacatedDate: formVacatedDate,
        advance500Received: formAdvanceReceived,
        monthlyRent: Number(formRent),
        notes: formNotes.trim(),
        status: 'Left',
      });
    } else if (selectedActiveResidentId) {
      // Mark an active resident as vacated
      StorageService.markResidentVacated(
        hostelId,
        selectedActiveResidentId,
        formVacatedDate,
        formAdvanceReceived,
        formNotes.trim()
      );
    } else {
      // Add a past resident who vacated directly
      StorageService.saveResident({
        hostelId,
        name: formName.trim(),
        roomNumber: formRoom.trim() || 'Room Vacated',
        sharingType: '2-Share',
        phone: formPhone.trim() || '0000000000',
        email: `${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}@vacated.pg`,
        joiningDate: formJoiningDate,
        vacatedDate: formVacatedDate,
        advance500Received: formAdvanceReceived,
        monthlyRent: Number(formRent),
        depositAmount: 500,
        status: 'Left',
        notes: formNotes.trim(),
      });
    }

    setRecordModalOpen(false);
    onRefresh();
  };

  // Restore resident back to Active
  const handleRestore = (resident: Resident) => {
    if (
      window.confirm(
        `Are you sure you want to re-admit ${resident.name} (${resident.roomNumber}) back to Active Residents?`
      )
    ) {
      StorageService.restoreResident(hostelId, resident.id);
      onRefresh();
    }
  };

  // Delete permanently
  const handleDelete = (id: string) => {
    StorageService.deleteResident(hostelId, id);
    setDeletingId(null);
    onRefresh();
  };

  // Export Word Report
  const handleExportWord = () => {
    generateVacatedResidentsWordReport({
      config,
      vacatedResidents: filteredResidents,
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredResidents.length === 0) {
      alert('No vacated residents to export.');
      return;
    }
    const headers = [
      'Name',
      'Room Number',
      'Phone',
      'Joining Date',
      'Vacated Date',
      'Advance 500 Received',
      'Monthly Rent (INR)',
      'Notes',
    ];
    const rows = filteredResidents.map((r) => [
      `"${r.name}"`,
      `"${r.roomNumber}"`,
      `"${r.phone}"`,
      `"${r.joiningDate || ''}"`,
      `"${r.vacatedDate || ''}"`,
      r.advance500Received ? 'Received' : 'Not Received',
      r.monthlyRent || 0,
      `"${r.notes || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_Vacated_Residents_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#4a0e4e] flex items-center justify-center shrink-0 shadow-inner">
              <UserMinus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Vacated Residents Section
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 uppercase tracking-wide">
                  {config.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage vacated residents roster, vacate dates, and verify Advance ₹500 status (Received vs Not Received).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg transition-colors border border-blue-200 cursor-pointer"
              title="Download Word Report with Vacated Dates and Advance ₹500 Status"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word Report (.doc)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors border border-slate-200 cursor-pointer"
              title="Export CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => handleOpenRecordModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#4a0e4e] hover:bg-[#380b3b] text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Vacated Resident</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vacated */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Vacated
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <UserMinus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {totalVacated}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Residents who left {config.name}
          </div>
        </div>

        {/* Advance 500 Received */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Advance ₹500 Received
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-900 font-mono tabular-nums">
              {advanceReceivedCount}
            </span>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              (₹{advanceReceivedAmount.toLocaleString('en-IN')})
            </span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
            <span>✓ ₹500 Advance successfully received</span>
          </div>
        </div>

        {/* Advance 500 Not Received */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Advance ₹500 Not Received
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-rose-900 font-mono tabular-nums">
              {advancePendingCount}
            </span>
            <span className="text-xs font-bold text-rose-700 font-mono">
              (₹{advancePendingAmount.toLocaleString('en-IN')})
            </span>
          </div>
          <div className="text-[11px] text-rose-700 mt-1 flex items-center gap-1 font-medium">
            <span>✕ Pending collection or disputed</span>
          </div>
        </div>

        {/* Quick Active Residents Jump */}
        <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4a0e4e]">
                Current Active
              </span>
              <UserCheck className="w-4 h-4 text-[#4a0e4e]" />
            </div>
            <div className="text-2xl font-bold text-[#4a0e4e] mt-2 font-mono tabular-nums">
              {activeResidents.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Active residents currently staying
            </div>
          </div>
          {onNavigateToActive && (
            <button
              onClick={onNavigateToActive}
              className="mt-3 text-xs font-bold text-[#4a0e4e] hover:text-[#380b3b] flex items-center gap-1 cursor-pointer"
            >
              <span>View Active Residents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vacated residents by name, room number, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e] focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Month selector */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                Vacate Month:
              </span>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-700"
              >
                <option value="all">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter Pills for Advance 500 status */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[#4a0e4e] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Vacated ({totalVacated})
          </button>
          <button
            onClick={() => setStatusFilter('received')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'received'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Advance ₹500 Received ({advanceReceivedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('not_received')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'not_received'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Advance ₹500 Not Received ({advancePendingCount})</span>
          </button>
        </div>
      </div>

      {/* 4. Vacated Residents Table / Cards */}
      {filteredResidents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-purple-50 text-[#4a0e4e] flex items-center justify-center mb-3">
            <UserMinus className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {totalVacated === 0
              ? 'No Vacated Residents Recorded Yet'
              : 'No residents matching filter'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {totalVacated === 0
              ? `When residents vacate ${config.name}, mark them here to record their vacated date and check whether their Advance ₹500 was received or not.`
              : 'Try clearing the search query or status filter to see other vacated residents.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleOpenRecordModal()}
              className="px-4 py-2 bg-[#4a0e4e] hover:bg-[#380b3b] text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record a Vacated Resident</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Resident</th>
                  <th className="py-3.5 px-4">Room & Contact</th>
                  <th className="py-3.5 px-4">Joining Date</th>
                  <th className="py-3.5 px-4">Vacated Date</th>
                  <th className="py-3.5 px-4">Advance ₹500 Status</th>
                  <th className="py-3.5 px-4">Rent</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResidents.map((resident) => {
                  const isReceived = !!resident.advance500Received;
                  return (
                    <tr
                      key={resident.id}
                      className="hover:bg-purple-50/30 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-[#4a0e4e] flex items-center justify-center font-bold text-xs shrink-0">
                            {resident.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {resident.name}
                            </div>
                            {resident.notes && (
                              <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={resident.notes}>
                                {resident.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Room & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Home className="w-3.5 h-3.5 text-purple-700" />
                          <span>{resident.roomNumber}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({resident.sharingType})
                          </span>
                        </div>
                        <div className="text-slate-500 flex items-center gap-1 mt-0.5 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{resident.phone}</span>
                        </div>
                      </td>

                      {/* Joining Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-600 font-mono text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{resident.joiningDate || '-'}</span>
                        </div>
                      </td>

                      {/* Vacated Date */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold text-xs">
                          <Calendar className="w-3.5 h-3.5 text-amber-700" />
                          <span>{resident.vacatedDate || 'Not recorded'}</span>
                        </div>
                      </td>

                      {/* Advance 500 Status with Quick Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {isReceived ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Advance ₹500 Received</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Advance ₹500 Not Received</span>
                            </span>
                          )}

                          {/* Quick 1-click toggle button */}
                          <button
                            type="button"
                            onClick={() => handleToggleAdvance500(resident)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title={isReceived ? 'Mark as Not Received' : 'Mark as Received'}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Rent */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        ₹{(resident.monthlyRent || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRestore(resident)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-[#4a0e4e] font-semibold text-[11px] rounded transition-colors border border-purple-200 cursor-pointer"
                            title="Re-admit resident back to Active roster"
                          >
                            Re-admit
                          </button>

                          <button
                            onClick={() => handleOpenRecordModal(resident)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Edit Vacated Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingId(resident.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Record"
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

      {/* 5. Modal: Record / Edit Vacated Resident */}
      {recordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#4a0e4e] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <UserMinus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingResident
                      ? `Edit Vacated Details: ${editingResident.name}`
                      : 'Record Vacated Resident'}
                  </h3>
                  <p className="text-xs text-purple-200">
                    {config.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRecordModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitRecord} className="p-6 space-y-4">
              {/* If creating new, option to choose from Active Residents */}
              {!editingResident && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Select from Current Active Residents
                  </label>
                  <select
                    value={selectedActiveResidentId}
                    onChange={(e) => handleSelectActiveResident(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
                  >
                    <option value="">-- Choose active resident (or enter details below) --</option>
                    {activeResidents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} - Room {r.roomNumber} ({r.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Resident Details Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Resident Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Hari Krishna"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="e.g. 702 or Room 702"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 9849012345"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Monthly Rent (INR)
                  </label>
                  <input
                    type="number"
                    value={formRent}
                    onChange={(e) => setFormRent(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
                  />
                </div>
              </div>

              {/* Joining Date & Vacated Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formJoiningDate}
                    onChange={(e) => setFormJoiningDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Vacated Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formVacatedDate}
                    onChange={(e) => setFormVacatedDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
                  />
                </div>
              </div>

              {/* Advance 500 Received or Not (Crucial Option) */}
              <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50/40 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4a0e4e]">
                  Advance ₹500 Settlement Status *
                </label>
                <p className="text-[11px] text-slate-600">
                  Did the hostel receive the ₹500 advance deposit from this resident?
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Received */}
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      formAdvanceReceived
                        ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-500 text-emerald-950 font-bold'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="advanceReceived"
                      checked={formAdvanceReceived === true}
                      onChange={() => setFormAdvanceReceived(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Advance 500 Received</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-normal">
                        Settled & Verified
                      </div>
                    </div>
                  </label>

                  {/* Not Received */}
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      !formAdvanceReceived
                        ? 'bg-rose-100/70 border-rose-400 ring-2 ring-rose-500 text-rose-950 font-bold'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="advanceReceived"
                      checked={formAdvanceReceived === false}
                      onChange={() => setFormAdvanceReceived(false)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-rose-900 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-rose-700" />
                        <span>Advance 500 Not Received</span>
                      </div>
                      <div className="text-[10px] text-rose-700 font-normal">
                        Pending / Unpaid
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Settlement Notes / Vacating Remarks
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Room key returned, electricity bill cleared, moved to home town"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRecordModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4a0e4e] hover:bg-[#380b3b] text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingResident ? 'Save Changes' : 'Record Vacated Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Delete Vacated Record?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                This will permanently delete this vacated record from the archive.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
