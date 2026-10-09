import React, { useState, useMemo } from 'react';
import { Resident, HostelConfig, HostelType, PaymentRecord } from '../types';
import { StorageService } from '../services/storage';
import { VacancyWidget } from './VacancyWidget';
import { ResidentModal } from './ResidentModal';
import {
  Search,
  Plus,
  Download,
  Phone,
  Mail,
  Calendar,
  Home,
  UserCheck,
  Edit2,
  Trash2,
  CreditCard,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  History,
  CheckCircle,
  X,
  Layers,
  Filter,
  UserMinus,
  CheckCircle2,
  XCircle,
  DoorClosed,
  LayoutGrid,
  ListFilter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatReceiptNumber, exportResidentsPdfReport } from '../services/pdfGenerator';
import { generateResidentDetailsWordReport } from '../services/wordExport';

interface ResidentSectionProps {
  hostelId: HostelType;
  config: HostelConfig;
  residents: Resident[];
  payments: PaymentRecord[];
  onRefresh: () => void;
  onQuickPay?: (resident: Resident) => void;
  onNavigateToVacated?: () => void;
}

export const ResidentSection: React.FC<ResidentSectionProps> = ({
  hostelId,
  config,
  residents,
  payments,
  onRefresh,
  onQuickPay,
  onNavigateToVacated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [feeMonthFilter, setFeeMonthFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Quick "Mark Vacated" Modal State
  const [vacatingResident, setVacatingResident] = useState<Resident | null>(null);
  const [vacateDateInput, setVacateDateInput] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [advance500ReceivedInput, setAdvance500ReceivedInput] = useState<boolean>(true);
  const [vacateNotesInput, setVacateNotesInput] = useState('');

  const handleOpenMarkVacated = (r: Resident) => {
    setVacatingResident(r);
    setVacateDateInput(new Date().toISOString().split('T')[0]);
    setAdvance500ReceivedInput(true);
    setVacateNotesInput('');
  };

  const handleConfirmVacate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacatingResident) return;
    StorageService.markResidentVacated(
      hostelId,
      vacatingResident.id,
      vacateDateInput,
      advance500ReceivedInput,
      vacateNotesInput
    );
    setVacatingResident(null);
    onRefresh();
  };

  // Fast filter residents by name or room number (or phone)
  const filteredResidents = residents.filter((r) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanRoomNum = r.roomNumber.toLowerCase().replace(/[^0-9]/g, '');
    const cleanTermDigits = term.replace(/[^0-9]/g, '');

    // Match by name
    const matchesName = r.name.toLowerCase().includes(term);

    // Match by room number (handles "801", "Room 801", or partial room numbers)
    const matchesRoom =
      r.roomNumber.toLowerCase().includes(term) ||
      (cleanTermDigits.length > 0 && cleanRoomNum.includes(cleanTermDigits));

    // Match by phone number
    const matchesPhone = r.phone.includes(term);

    const matchesSearch = term === '' || matchesName || matchesRoom || matchesPhone;

    const matchesStatus =
      statusFilter === 'all' || r.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesFloor =
      floorFilter === 'all' ||
      cleanRoomNum.startsWith(floorFilter);

    return matchesSearch && matchesStatus && matchesFloor;
  });

  const [selectedRoomForAdd, setSelectedRoomForAdd] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'room-wise' | 'cards' | 'table'>('room-wise');
  const [collapsedRooms, setCollapsedRooms] = useState<Record<string, boolean>>({});

  // Group filtered residents by room number
  const roomGroups = useMemo(() => {
    const groups: Record<string, Resident[]> = {};
    filteredResidents.forEach((res) => {
      const room = res.roomNumber.trim();
      if (!groups[room]) {
        groups[room] = [];
      }
      groups[room].push(res);
    });

    return Object.keys(groups)
      .sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
      })
      .map((roomNum) => {
        const roomResidents = groups[roomNum];
        const cleanDigits = roomNum.replace(/[^0-9]/g, '');
        const floor = cleanDigits.length >= 2 ? cleanDigits[0] : '1';
        const totalRent = roomResidents.reduce((s, r) => s + (r.monthlyRent || 0), 0);
        const sharingType = roomResidents[0]?.sharingType || `${roomResidents.length}-Share`;

        // Payment status calculation for each resident in this room
        let paidCount = 0;
        let dueCount = 0;
        roomResidents.forEach((res) => {
          const resPayments = payments.filter(
            (p) =>
              (p.residentId && p.residentId === res.id) ||
              (p.residentName.trim().toLowerCase() === res.name.trim().toLowerCase() &&
                p.roomNumber.trim().toLowerCase() === res.roomNumber.trim().toLowerCase())
          );

          const relevantPayments =
            feeMonthFilter === 'all'
              ? resPayments
              : resPayments.filter((p) => {
                  const pm = p.paymentDate ? p.paymentDate.slice(0, 7) : p.month;
                  return pm === feeMonthFilter;
                });

          const resPayment = relevantPayments[0];
          const isFeePaid =
            resPayment &&
            (resPayment.paymentStatus === 'Paid in Full' ||
              resPayment.outstandingBalance === 0);

          if (isFeePaid) {
            paidCount++;
          } else {
            dueCount++;
          }
        });

        return {
          roomNumber: roomNum,
          floor,
          sharingType,
          residents: roomResidents,
          totalRent,
          paidCount,
          dueCount,
        };
      });
  }, [filteredResidents, payments, feeMonthFilter]);

  const toggleRoomCollapse = (room: string) => {
    setCollapsedRooms((prev) => ({
      ...prev,
      [room]: !prev[room],
    }));
  };

  const handleExpandAllRooms = () => {
    setCollapsedRooms({});
  };

  const handleCollapseAllRooms = () => {
    const allCollapsed: Record<string, boolean> = {};
    roomGroups.forEach((g) => {
      allCollapsed[g.roomNumber] = true;
    });
    setCollapsedRooms(allCollapsed);
  };

  const handleOpenAdd = (defaultRoom?: string) => {
    setSelectedRoomForAdd(defaultRoom);
    setEditingResident(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (res: Resident) => {
    setEditingResident(res);
    setModalOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    StorageService.deleteResident(hostelId, id);
    setDeletingId(null);
    onRefresh();
  };

  const handleSaveResident = (
    data: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    StorageService.saveResident(data);
    setModalOpen(false);
    setEditingResident(null);
    setSelectedRoomForAdd(undefined);
    onRefresh();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (residents.length === 0) {
      alert('No resident data available to export.');
      return;
    }
    const headers = [
      'Name',
      'Room Number',
      'Sharing Type',
      'Status',
      'Phone',
      'Email',
      'Joining Date',
      'Monthly Rent (INR)',
      'Deposit (INR)',
      'Emergency Contact',
      'Notes',
    ];
    const rows = filteredResidents.map((r) => [
      `"${r.name}"`,
      `"${r.roomNumber}"`,
      `"${r.sharingType}"`,
      `"${r.status}"`,
      `"${r.phone}"`,
      `"${r.email}"`,
      `"${r.joiningDate}"`,
      r.monthlyRent,
      r.depositAmount,
      `"${r.emergencyContact || ''}"`,
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
      `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_Residents_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Resident Details as Word Report (.doc)
  const handleExportWordReport = () => {
    generateResidentDetailsWordReport({
      config,
      residents: filteredResidents,
      payments,
    });
  };

  // Export Resident Report with Joining Data as PDF
  const handleExportPdfReport = () => {
    exportResidentsPdfReport({
      config,
      residents: filteredResidents,
      payments,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Vacancy Rate Widget */}
      <VacancyWidget
        config={config}
        residents={residents}
        onConfigUpdated={onRefresh}
      />

      {/* 2. Dedicated Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        {/* Main Search Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-purple-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by resident name (e.g. Hari, Duddu, Tarun) or room number (e.g. 801, 702, 103)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e] focus:bg-white shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
            >
              <option value="all">All Statuses ({residents.length})</option>
              <option value="active">
                Active ({residents.filter((r) => r.status === 'Active').length})
              </option>
              <option value="vacating">
                Vacating ({residents.filter((r) => r.status === 'Vacating').length})
              </option>
              <option value="left">
                Left ({residents.filter((r) => r.status === 'Left').length})
              </option>
            </select>

            {/* Export Resident Details Word Report */}
            <button
              onClick={handleExportWordReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-[#4a0e4e] font-bold text-xs rounded-xl transition-colors border border-purple-200 cursor-pointer shadow-xs whitespace-nowrap"
              title="Download Resident Details report in Word format (.doc) with Joining Data, Room #, Phone, and Payments"
            >
              <FileText className="w-3.5 h-3.5 text-purple-700" />
              <span>Residents Report (Word)</span>
            </button>

            {/* Export Resident Details PDF Report */}
            <button
              onClick={handleExportPdfReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors border border-red-200 cursor-pointer shadow-xs whitespace-nowrap"
              title="Download Resident Report in PDF format with Joining Data, Room #, Sharing, Phone, and Status"
            >
              <Download className="w-3.5 h-3.5 text-red-600" />
              <span>Residents Report (PDF)</span>
            </button>

            {/* Export Report CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              title="Export resident report to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
              <span>Roster CSV</span>
            </button>

            {/* Jump to Vacated Residents */}
            {onNavigateToVacated && (
              <button
                onClick={onNavigateToVacated}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-[#4a0e4e] font-bold text-xs rounded-xl transition-colors border border-purple-200 cursor-pointer shadow-xs whitespace-nowrap"
                title="Open Vacated Residents Section"
              >
                <UserMinus className="w-3.5 h-3.5 text-purple-700" />
                <span>Vacated Residents ({residents.filter((r) => r.status === 'Left').length})</span>
              </button>
            )}

            {/* Add New Resident Button */}
            <button
              onClick={() => handleOpenAdd()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#4a0e4e] hover:bg-[#380b3b] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resident</span>
            </button>
          </div>
        </div>

        {/* Quick Room & Floor Filters Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-700" />
              Floor:
            </span>
            {[
              { id: 'all', label: 'All Floors' },
              { id: '1', label: 'Floor 1 (101-105)' },
              { id: '2', label: 'Floor 2 (201-204)' },
              { id: '3', label: 'Floor 3 (302-305)' },
              { id: '4', label: 'Floor 4 (401-405)' },
              { id: '5', label: 'Floor 5 (501-505)' },
              { id: '6', label: 'Floor 6 (601-605)' },
              { id: '7', label: 'Floor 7 (701-705)' },
              { id: '8', label: 'Floor 8 (801-802)' },
            ].map((fl) => (
              <button
                key={fl.id}
                type="button"
                onClick={() => setFloorFilter(fl.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  floorFilter === fl.id
                    ? 'bg-[#4a0e4e] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {fl.label}
              </button>
            ))}
          </div>

          {/* Quick Room Jump tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">Popular Rooms:</span>
            {['801', '702', '601', '501', '402', '305', '202', '103'].map((rm) => (
              <button
                key={rm}
                type="button"
                onClick={() => setSearchTerm(rm)}
                className="px-2 py-0.5 text-[11px] font-mono font-bold bg-purple-50 hover:bg-purple-100 text-[#4a0e4e] rounded-md border border-purple-200 cursor-pointer whitespace-nowrap"
              >
                Room {rm}
              </button>
            ))}
          </div>
        </div>

        {/* Fee Payment Month Filter Bar (Based on Payment Date) */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 mr-1 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-purple-700" />
              Fee Status for Month:
            </span>
            {[
              { id: 'all', label: 'All Months' },
              { id: '2026-08', label: 'August 2026 (25 Paid)' },
              { id: '2026-09', label: 'September 2026 (63 Paid)' },
              { id: '2026-10', label: 'October 2026 (3 Paid)' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setFeeMonthFilter(m.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  feeMonthFilter === m.id
                    ? 'bg-[#4a0e4e] text-white shadow-xs'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {feeMonthFilter !== 'all' && (
            <span className="text-[11px] text-purple-900 font-semibold bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
              Filtered to {feeMonthFilter === '2026-08' ? 'August' : feeMonthFilter === '2026-09' ? 'September' : 'October'} 2026 payments only
            </span>
          )}
        </div>

        {/* Live Filter Counter Banner */}
        {(searchTerm || floorFilter !== 'all' || statusFilter !== 'all' || feeMonthFilter !== 'all') && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-950">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Showing <strong>{filteredResidents.length}</strong> of <strong>{residents.length}</strong> residents
                {searchTerm && (
                  <span>
                    {' '}matching "<strong>{searchTerm}</strong>"
                  </span>
                )}
                {floorFilter !== 'all' && (
                  <span>
                    {' '}on <strong>Floor {floorFilter}</strong>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span>
                    {' '}(Status: <strong>{statusFilter}</strong>)
                  </span>
                )}
                {feeMonthFilter !== 'all' && (
                  <span>
                    {' '}(Fee Month: <strong>{feeMonthFilter === '2026-08' ? 'August' : feeMonthFilter === '2026-09' ? 'September' : 'October'} 2026</strong>)
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFloorFilter('all');
                setStatusFilter('all');
                setFeeMonthFilter('all');
              }}
              className="text-xs font-bold text-purple-800 hover:text-purple-950 underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. View Mode Switcher & Room Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
            View Display:
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold gap-1">
            <button
              type="button"
              onClick={() => setViewMode('room-wise')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'room-wise'
                  ? 'bg-[#4a0e4e] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Show all resident details grouped room by room"
            >
              <DoorClosed className="w-3.5 h-3.5" />
              <span>Room Wise ({roomGroups.length} Rooms)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#4a0e4e] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Show individual cards for all residents"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Residents ({filteredResidents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#4a0e4e] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Show compact roster table view"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Roster Table</span>
            </button>
          </div>
        </div>

        {/* Room-Wise Quick Controls */}
        {viewMode === 'room-wise' && roomGroups.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono text-[11px]">
              {roomGroups.length} Rooms Occupied · {filteredResidents.length} Residents Staying
            </span>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleExpandAllRooms}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md text-[11px] transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={handleCollapseAllRooms}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md text-[11px] transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Helper function to render a comprehensive resident card */}
      {(() => {
        const renderResidentCard = (res: Resident, isInRoomView: boolean = false) => {
          const resPayments = payments.filter(
            (p) =>
              (p.residentId && p.residentId === res.id) ||
              (p.residentName.trim().toLowerCase() === res.name.trim().toLowerCase() &&
                p.roomNumber.trim().toLowerCase() === res.roomNumber.trim().toLowerCase())
          );

          const relevantPayments =
            feeMonthFilter === 'all'
              ? resPayments
              : resPayments.filter((p) => {
                  const pm = p.paymentDate ? p.paymentDate.slice(0, 7) : p.month;
                  return pm === feeMonthFilter;
                });

          const resPayment = relevantPayments[0];
          const isFeePaid =
            resPayment &&
            (resPayment.paymentStatus === 'Paid in Full' ||
              resPayment.outstandingBalance === 0);
          const hasPartial =
            resPayment &&
            resPayment.amountReceived > 0 &&
            resPayment.outstandingBalance > 0;

          let monthLabel = '';
          if (resPayment && resPayment.paymentDate) {
            const monthNum = resPayment.paymentDate.split('-')[1];
            monthLabel =
              monthNum === '08'
                ? 'Aug'
                : monthNum === '09'
                ? 'Sep'
                : monthNum === '10'
                ? 'Oct'
                : '';
          }

          return (
            <div
              key={res.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-purple-300 p-4.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Card Top Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    {!isInRoomView ? (
                      <span className="px-2.5 py-1 bg-purple-100 text-[#4a0e4e] rounded-md font-mono text-xs font-bold uppercase tracking-wide">
                        {res.roomNumber}
                      </span>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-[#4a0e4e] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        {res.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-slate-500 font-medium">
                      {res.sharingType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        res.status === 'Active'
                          ? 'bg-slate-100 text-slate-700'
                          : res.status === 'Vacating'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {res.status}
                    </span>

                    {/* Rent Status Badge */}
                    {isFeePaid ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs whitespace-nowrap"
                        title={`Paid ₹${resPayment.amountReceived.toLocaleString('en-IN')} on ${resPayment.paymentDate} (Receipt #${resPayment.receiptNumber})`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Paid {monthLabel && `(${monthLabel})`} ✓
                      </span>
                    ) : hasPartial ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
                        Partial Paid
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                        Fee Due {feeMonthFilter !== 'all' ? `(${feeMonthFilter.split('-')[1] === '08' ? 'Aug' : feeMonthFilter.split('-')[1] === '09' ? 'Sep' : 'Oct'})` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Resident Main Info */}
                <div className="mt-3">
                  <h4 className="text-base font-bold text-slate-900 tracking-tight">
                    {res.name}
                  </h4>
                  <div className="text-xs text-purple-900 font-semibold mt-0.5 font-mono">
                    ₹{res.monthlyRent.toLocaleString('en-IN')}{' '}
                    <span className="text-[11px] font-normal text-slate-500">/ month</span>
                    {res.depositAmount > 0 && (
                      <span className="text-slate-400 font-normal">
                        {' '}· Deposit: ₹{res.depositAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact & Status Details */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a
                      href={`tel:${res.phone}`}
                      className="hover:text-purple-700 font-mono text-[11px]"
                    >
                      {res.phone}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-[11px]" title={res.email}>
                      {res.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 bg-purple-50/70 px-2.5 py-1.5 rounded-lg border border-purple-100 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span>
                      Joining Date:{' '}
                      <strong className="text-purple-950 font-mono">
                        {res.joiningDate
                          ? res.joiningDate.includes('-')
                            ? res.joiningDate.split('-').reverse().join('/')
                            : res.joiningDate
                          : 'Not recorded'}
                      </strong>
                    </span>
                  </div>

                  {res.emergencyContact && (
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Emergency: {res.emergencyContact}</span>
                    </div>
                  )}

                  {res.notes && (
                    <div className="p-1.5 rounded bg-slate-50 text-[11px] text-slate-600 border border-slate-100 italic">
                      "{res.notes}"
                    </div>
                  )}

                  {/* Previous Payment Snippet */}
                  {resPayments.length > 0 && (() => {
                    const latest = resPayments[0];
                    return (
                      <div className="mt-1.5 p-1.5 rounded-lg bg-purple-50/60 border border-purple-200 text-[10.5px] text-purple-950 flex items-center justify-between">
                        <div className="flex items-center gap-1 truncate">
                          <History className="w-3 h-3 text-purple-700 shrink-0" />
                          <span className="truncate">
                            Prev: ₹{latest.amountReceived.toLocaleString('en-IN')} ({latest.paymentDate})
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#4a0e4e] shrink-0 ml-1">
                          #{formatReceiptNumber(latest.receiptNumber)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Card Actions: Quick Pay, Edit, Vacate, Delete */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                {onQuickPay && (
                  <button
                    type="button"
                    onClick={() => onQuickPay(res)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isFeePaid
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-purple-50 hover:bg-purple-100 text-[#4a0e4e]'
                    }`}
                    title={
                      isFeePaid
                        ? 'Fee already paid. Click to view or add another record'
                        : 'Log fee payment for this resident'
                    }
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isFeePaid ? 'Paid in Full ✓' : 'Collect Fee'}</span>
                  </button>
                )}

                <div className="flex items-center gap-1 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenMarkVacated(res)}
                    className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Mark resident as Vacated (record vacate date and Advance 500 status)"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(res)}
                    className="p-1.5 text-slate-500 hover:text-[#4a0e4e] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit resident profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(res.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete resident record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        };

        {/* 4. Display Content based on View Mode */}
        if (filteredResidents.length === 0) {
          return (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-[#4a0e4e] flex items-center justify-center mx-auto mb-3">
                <Home className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {residents.length === 0 ? 'No Residents Added Yet' : 'No Matching Residents Found'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                {residents.length === 0
                  ? `Get started by adding your first resident profile to ${config.name} with room number and rent details.`
                  : `No residents matched "${searchTerm}". Try a different search term or reset the filter.`}
              </p>
              {residents.length === 0 ? (
                <button
                  type="button"
                  onClick={() => handleOpenAdd()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#4a0e4e] hover:bg-[#380b3b] text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Resident Entry</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          );
        }

        {/* MODE 1: ROOM-WISE VIEW (PRIMARY & DEFAULT) */}
        if (viewMode === 'room-wise') {
          return (
            <div className="space-y-6">
              {roomGroups.map((room) => {
                const isCollapsed = !!collapsedRooms[room.roomNumber];
                return (
                  <div
                    key={room.roomNumber}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all overflow-hidden"
                  >
                    {/* Room Header Banner */}
                    <div className="bg-slate-50/80 border-b border-slate-200 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="px-3.5 py-2 bg-[#4a0e4e] text-white rounded-xl font-mono text-base font-bold flex items-center gap-2 shadow-xs shrink-0">
                          <DoorClosed className="w-4 h-4 text-purple-200" />
                          <span>Room {room.roomNumber}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">
                              Floor {room.floor} ({room.floor === '1' ? '1st' : room.floor === '2' ? '2nd' : room.floor === '3' ? '3rd' : room.floor + 'th'} Floor)
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-purple-900 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {room.sharingType}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-slate-600 font-semibold">
                              {room.residents.length} Resident{room.residents.length > 1 ? 's' : ''} Staying
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 font-mono">
                            Total Room Collection:{' '}
                            <strong className="text-slate-900 font-bold">
                              ₹{room.totalRent.toLocaleString('en-IN')}
                            </strong>{' '}
                            / month
                          </div>
                        </div>
                      </div>

                      {/* Room Header Actions & Summary Badges */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Payment Status Pill */}
                        {room.dueCount === 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>All Paid ({room.paidCount}/{room.residents.length})</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-2xs">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{room.dueCount} Due · {room.paidCount} Paid</span>
                          </span>
                        )}

                        {/* Quick Add to this Room */}
                        <button
                          type="button"
                          onClick={() => handleOpenAdd(room.roomNumber)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#4a0e4e] font-bold text-xs rounded-lg border border-purple-200 transition-colors cursor-pointer"
                          title={`Add a new resident directly into Room ${room.roomNumber}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Room</span>
                        </button>

                        {/* Collapse / Expand Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleRoomCollapse(room.roomNumber)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title={isCollapsed ? 'Expand room details' : 'Collapse room details'}
                        >
                          {isCollapsed ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronUp className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Room Residents Details Grid */}
                    {!isCollapsed && (
                      <div className="p-5 bg-slate-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                          {room.residents.map((res) => renderResidentCard(res, true))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        {/* MODE 2: CARD GRID VIEW */}
        if (viewMode === 'cards') {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredResidents.map((res) => renderResidentCard(res, false))}
            </div>
          );
        }

        {/* MODE 3: DETAILED TABLE ROSTER VIEW */}
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Room #</th>
                    <th className="py-3.5 px-4">Resident</th>
                    <th className="py-3.5 px-4">Phone & Email</th>
                    <th className="py-3.5 px-4">Sharing</th>
                    <th className="py-3.5 px-4">Joining Date</th>
                    <th className="py-3.5 px-4">Rent (INR)</th>
                    <th className="py-3.5 px-4">Fee Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResidents.map((res) => {
                    const resPayments = payments.filter(
                      (p) =>
                        (p.residentId && p.residentId === res.id) ||
                        (p.residentName.trim().toLowerCase() === res.name.trim().toLowerCase() &&
                          p.roomNumber.trim().toLowerCase() === res.roomNumber.trim().toLowerCase())
                    );
                    const relevantPayments =
                      feeMonthFilter === 'all'
                        ? resPayments
                        : resPayments.filter((p) => {
                            const pm = p.paymentDate ? p.paymentDate.slice(0, 7) : p.month;
                            return pm === feeMonthFilter;
                          });
                    const resPayment = relevantPayments[0];
                    const isFeePaid =
                      resPayment &&
                      (resPayment.paymentStatus === 'Paid in Full' ||
                        resPayment.outstandingBalance === 0);

                    return (
                      <tr key={res.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-950">
                          {res.roomNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {res.name}
                          </div>
                          {res.notes && (
                            <div className="text-[11px] text-slate-500 italic truncate max-w-[180px]">
                              "{res.notes}"
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div>{res.phone}</div>
                          <div className="text-[11px] text-slate-400 font-sans truncate max-w-[180px]">
                            {res.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {res.sharingType}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {res.joiningDate || '-'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          ₹{res.monthlyRent.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          {isFeePaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Paid ✓</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>Due</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onQuickPay && (
                              <button
                                type="button"
                                onClick={() => onQuickPay(res)}
                                className="px-2 py-1 text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-[#4a0e4e] rounded border border-purple-200 transition-colors cursor-pointer"
                              >
                                Collect
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenMarkVacated(res)}
                              className="p-1 text-slate-400 hover:text-amber-700 rounded transition-colors cursor-pointer"
                              title="Mark as Vacated"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(res)}
                              className="p-1 text-slate-500 hover:text-[#4a0e4e] rounded transition-colors cursor-pointer"
                              title="Edit Resident"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(res.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Delete Resident"
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
        );
      })()}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900">
              Confirm Resident Deletion
            </h4>
            <p className="text-xs text-slate-600 mt-1 mb-5">
              Are you sure you want to remove this resident from {config.name}? This action cannot be undone.
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

      {/* Mark Resident as Vacated Quick Modal */}
      {vacatingResident && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#4a0e4e] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <UserMinus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Mark Resident as Vacated</h3>
                  <p className="text-[11px] text-purple-200">
                    {vacatingResident.name} · Room {vacatingResident.roomNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVacatingResident(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmVacate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Vacated Date *
                </label>
                <input
                  type="date"
                  required
                  value={vacateDateInput}
                  onChange={(e) => setVacateDateInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
                />
              </div>

              {/* Advance 500 Received or Not */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4a0e4e]">
                  Advance ₹500 Status *
                </label>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs ${
                      advance500ReceivedInput
                        ? 'bg-emerald-100/70 border-emerald-400 font-bold text-emerald-900 ring-2 ring-emerald-500'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalAdvance"
                      checked={advance500ReceivedInput === true}
                      onChange={() => setAdvance500ReceivedInput(true)}
                    />
                    <span>✓ Advance 500 Received</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs ${
                      !advance500ReceivedInput
                        ? 'bg-rose-100/70 border-rose-400 font-bold text-rose-900 ring-2 ring-rose-500'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalAdvance"
                      checked={advance500ReceivedInput === false}
                      onChange={() => setAdvance500ReceivedInput(false)}
                    />
                    <span>✕ Not Received</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Settlement Notes / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Keys returned, settled electricity, moving out"
                  value={vacateNotesInput}
                  onChange={(e) => setVacateNotesInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setVacatingResident(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4a0e4e] hover:bg-[#380b3b] text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Vacate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Resident Modal */}
      <ResidentModal
        isOpen={modalOpen}
        resident={editingResident}
        defaultRoomNumber={selectedRoomForAdd}
        hostelId={hostelId}
        onClose={() => {
          setModalOpen(false);
          setEditingResident(null);
          setSelectedRoomForAdd(undefined);
        }}
        onSave={handleSaveResident}
      />
    </div>
  );
};
