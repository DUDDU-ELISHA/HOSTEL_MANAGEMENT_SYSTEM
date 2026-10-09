import React, { useState } from 'react';
import { HostelConfig, Resident } from '../types';
import { StorageService } from '../services/storage';
import { Bed, Users, PieChart, Settings, Check } from 'lucide-react';

interface VacancyWidgetProps {
  config: HostelConfig;
  residents: Resident[];
  onConfigUpdated: () => void;
}

export const VacancyWidget: React.FC<VacancyWidgetProps> = ({
  config,
  residents,
  onConfigUpdated,
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [totalRooms, setTotalRooms] = useState(config.totalRooms || 30);
  const [totalBeds, setTotalBeds] = useState(config.totalBeds || 90);

  const activeResidents = residents.filter((r) => r.status === 'Active');
  const occupiedCount = activeResidents.length;
  const vacantBeds = Math.max(0, totalBeds - occupiedCount);
  const vacancyRate = totalBeds > 0 ? ((vacantBeds / totalBeds) * 100).toFixed(1) : '0';
  const occupancyRate = totalBeds > 0 ? ((occupiedCount / totalBeds) * 100).toFixed(1) : '0';

  const handleSaveCapacity = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateHostelConfig({
      ...config,
      totalRooms: Number(totalRooms),
      totalBeds: Number(totalBeds),
    });
    setShowConfigModal(false);
    onConfigUpdated();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-700" />
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">
            Live Vacancy & Capacity Status
          </h3>
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="text-xs text-slate-500 hover:text-purple-700 font-medium flex items-center gap-1 cursor-pointer"
          title="Adjust total bed/room capacity"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Config</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        {/* Metric 1 */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Beds Capacity
            </span>
            <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.2 rounded">
              Any Beds
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {totalBeds} <span className="text-xs font-normal text-slate-500">Beds</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {totalRooms} Total Rooms (No Bed Limit)
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Occupied Beds
          </div>
          <div className="text-xl font-bold text-emerald-900 mt-1 font-mono tabular-nums">
            {occupiedCount}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-mono tabular-nums">
            {occupancyRate}% Occupancy
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-100">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-800">
            Available / Vacant
          </div>
          <div className="text-xl font-bold text-purple-900 mt-1 font-mono tabular-nums">
            {vacantBeds} <span className="text-xs font-normal text-purple-700">Beds</span>
          </div>
          <div className="text-[11px] text-purple-700 mt-0.5">
            Ready for Admission
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Current Vacancy Rate
          </div>
          <div className="text-xl font-bold text-purple-950 mt-1 font-mono tabular-nums">
            {vacancyRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {parseFloat(vacancyRate) > 25 ? 'High Availability' : 'Good Occupancy'}
          </div>
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
          <span>Occupancy Progress</span>
          <span className="font-mono tabular-nums font-semibold text-slate-800">
            {occupiedCount} / {totalBeds} Beds ({occupancyRate}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${Math.min(100, parseFloat(occupancyRate))}%` }}
          />
          <div
            className="bg-purple-300 h-full transition-all duration-300"
            style={{ width: `${Math.max(0, 100 - parseFloat(occupancyRate))}%` }}
          />
        </div>
      </div>

      {/* Capacity Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6">
            <h4 className="font-bold text-base text-slate-900">
              Configure Hostel Capacity
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Update room and bed count for accurate vacancy percentage calculation.
            </p>
            <form onSubmit={handleSaveCapacity} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Total Rooms
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalRooms}
                  onChange={(e) => setTotalRooms(Number(e.target.value))}
                  placeholder="e.g. 30"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Total Beds Capacity (Enter any beds - No limit)
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalBeds}
                  onChange={(e) => setTotalBeds(Number(e.target.value))}
                  placeholder="Enter any number of beds (e.g. 50, 120, 300, 1000...)"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900"
                  required
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400">Quick set:</span>
                  {[50, 90, 150, 300, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTotalBeds(preset)}
                      className="px-2 py-0.5 text-[11px] font-mono bg-purple-50 hover:bg-purple-100 text-purple-800 rounded border border-purple-200 cursor-pointer"
                    >
                      {preset} beds
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#4a0e4e] text-white rounded-lg cursor-pointer"
                >
                  Save Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
