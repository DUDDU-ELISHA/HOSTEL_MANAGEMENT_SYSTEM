import React, { useState, useEffect } from 'react';
import { Resident, HostelType } from '../types';
import { StorageService } from '../services/storage';
import {
  X,
  User,
  Home,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  History,
  RotateCcw,
  Clock,
  Sparkles
} from 'lucide-react';

interface ResidentModalProps {
  isOpen: boolean;
  resident: Resident | null; // null for Add, object for Edit
  defaultRoomNumber?: string;
  hostelId: HostelType;
  onClose: () => void;
  onSave: (data: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
}

export const ResidentModal: React.FC<ResidentModalProps> = ({
  isOpen,
  resident,
  defaultRoomNumber,
  hostelId,
  onClose,
  onSave,
}) => {
  const draftKey = `hms_draft_resident_${hostelId}`;

  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [sharingType, setSharingType] = useState<Resident['sharingType']>('2-Share');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [joiningDate, setJoiningDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [monthlyRent, setMonthlyRent] = useState<number | ''>(7000);
  const [depositAmount, setDepositAmount] = useState<number | ''>(2000);
  const [status, setStatus] = useState<Resident['status']>('Active');
  const [vacatedDate, setVacatedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [advance500Received, setAdvance500Received] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);

  // Existing residents to show previous entered details
  const [existingResidents, setExistingResidents] = useState<Resident[]>([]);

  useEffect(() => {
    if (isOpen) {
      const allResidents = StorageService.getResidents(hostelId);
      setExistingResidents(allResidents);

      if (resident) {
        setName(resident.name);
        setRoomNumber(resident.roomNumber);
        setSharingType(resident.sharingType);
        setPhone(resident.phone);
        setEmail(resident.email);
        setEmergencyContact(resident.emergencyContact || '');
        setJoiningDate(resident.joiningDate);
        setMonthlyRent(resident.monthlyRent);
        setDepositAmount(resident.depositAmount);
        setStatus(resident.status);
        setVacatedDate(resident.vacatedDate || new Date().toISOString().split('T')[0]);
        setAdvance500Received(resident.advance500Received ?? false);
        setNotes(resident.notes || '');
        setDraftRestored(false);
      } else {
        // Check for saved draft
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          try {
            const draft = JSON.parse(saved);
            setName(draft.name || '');
            setRoomNumber(draft.roomNumber || '');
            setSharingType(draft.sharingType || '2-Share');
            setPhone(draft.phone || '');
            setEmail(draft.email || '');
            setEmergencyContact(draft.emergencyContact || '');
            setJoiningDate(draft.joiningDate || new Date().toISOString().split('T')[0]);
            setMonthlyRent(draft.monthlyRent !== undefined ? draft.monthlyRent : 7000);
            setDepositAmount(draft.depositAmount || 0);
            setStatus(draft.status || 'Active');
            setVacatedDate(draft.vacatedDate || new Date().toISOString().split('T')[0]);
            setAdvance500Received(draft.advance500Received ?? true);
            setNotes(draft.notes || '');
            setDraftRestored(true);
          } catch {
            resetFields();
          }
        } else {
          resetFields();
        }
        if (defaultRoomNumber) {
          setRoomNumber(defaultRoomNumber);
        }
      }
    }
  }, [resident, isOpen, hostelId, defaultRoomNumber]);

  const resetFields = () => {
    setName('');
    setRoomNumber(defaultRoomNumber || '');
    setSharingType('2-Share');
    setPhone('');
    setEmail('');
    setEmergencyContact('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setMonthlyRent(7000);
    setDepositAmount(0);
    setStatus('Active');
    setVacatedDate(new Date().toISOString().split('T')[0]);
    setAdvance500Received(true);
    setNotes('');
    setDraftRestored(false);
  };

  // Auto-save draft as user types
  useEffect(() => {
    if (!isOpen || resident) return;
    const draft = {
      name,
      roomNumber,
      sharingType,
      phone,
      email,
      emergencyContact,
      joiningDate,
      monthlyRent,
      depositAmount,
      status,
      notes,
    };
    if (name || roomNumber || phone || notes) {
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [
    isOpen,
    resident,
    name,
    roomNumber,
    sharingType,
    phone,
    email,
    emergencyContact,
    joiningDate,
    monthlyRent,
    depositAmount,
    status,
    notes,
    draftKey,
  ]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    resetFields();
  };

  // Distinct previously entered rooms & rent amounts
  const previousRooms = Array.from(
    new Set(existingResidents.map((r) => r.roomNumber))
  ).filter(Boolean);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.removeItem(draftKey);

    onSave({
      id: resident ? resident.id : undefined,
      hostelId,
      name: name.trim(),
      roomNumber: roomNumber.trim(),
      sharingType,
      phone: phone.trim(),
      email: email.trim(),
      emergencyContact: emergencyContact.trim(),
      joiningDate,
      monthlyRent: Number(monthlyRent) || 0,
      depositAmount: Number(depositAmount) || 0,
      status,
      vacatedDate: status === 'Left' ? vacatedDate : undefined,
      advance500Received: status === 'Left' ? advance500Received : undefined,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#4a0e4e] text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-200" />
            <h3 className="font-bold text-base">
              {resident ? 'Edit Resident Profile' : 'Add New Resident Entry'}
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
        {!resident && (
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
                Resident Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hari"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                placeholder="e.g. Room 702 or 702"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              />
              {/* Previous Rooms chips for quick reuse */}
              {previousRooms.length > 0 && !resident && (
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400">Previous:</span>
                  {previousRooms.slice(0, 4).map((rm) => (
                    <button
                      key={rm}
                      type="button"
                      onClick={() => setRoomNumber(rm)}
                      className="px-1.5 py-0.5 text-[10px] font-mono bg-purple-50 hover:bg-purple-100 text-purple-800 rounded border border-purple-200 cursor-pointer"
                    >
                      {rm}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Room Sharing Type (1 to 5)
              </label>
              <select
                value={sharingType}
                onChange={(e) => setSharingType(e.target.value as Resident['sharingType'])}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              >
                <option value="1-Share">1-Sharing (Single Room)</option>
                <option value="2-Share">2-Sharing</option>
                <option value="3-Share">3-Sharing</option>
                <option value="4-Share">4-Sharing</option>
                <option value="5-Share">5-Sharing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Resident Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Resident['status'])}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              >
                <option value="Active">Active Resident</option>
                <option value="Vacating">Vacating Notice</option>
                <option value="Left">Vacated / Left</option>
              </select>
            </div>
          </div>

          {/* Conditional Vacated Details if status === 'Left' */}
          {status === 'Left' && (
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-3">
              <div className="font-bold text-xs uppercase text-[#4a0e4e] tracking-wider">
                Vacated Resident Details & Advance Settlement
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Vacated Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={vacatedDate}
                    onChange={(e) => setVacatedDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4a0e4e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Advance ₹500 Status *
                  </label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 cursor-pointer">
                      <input
                        type="radio"
                        name="residentAdvance500"
                        checked={advance500Received === true}
                        onChange={() => setAdvance500Received(true)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>✓ Received</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-bold text-rose-800 cursor-pointer">
                      <input
                        type="radio"
                        name="residentAdvance500"
                        checked={advance500Received === false}
                        onChange={() => setAdvance500Received(false)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>✕ Not Received</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Contact Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9849012345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Resident Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. hari.resident@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              />
              <span className="text-[11px] text-slate-500">
                Required for emailing digital fee receipts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Monthly Rent (INR) *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="7000"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Deposit (INR)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Joining Date
              </label>
              <input
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Emergency Contact / Parent Phone
              </label>
              <input
                type="tel"
                placeholder="e.g. 9849098765"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Additional Notes / ID Info
              </label>
              <input
                type="text"
                placeholder="e.g. AC Room, Aadhaar verified, Key #12"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white"
              />
            </div>
          </div>

          {/* Previously Entered Residents reference */}
          {existingResidents.length > 0 && !resident && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1.5">
                <History className="w-3.5 h-3.5 text-purple-700" />
                <span>Previously Registered Residents in this Hostel:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {existingResidents.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-1.5 bg-white rounded border border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5"
                  >
                    <strong className="text-slate-900">{r.name}</strong>
                    <span>({r.roomNumber})</span>
                    <span className="text-purple-800 font-mono">₹{r.monthlyRent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                {resident ? 'Update Resident Record' : 'Save Resident Entry'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
