import React from 'react';
import { HostelType } from '../types';
import { HOSTEL_CONFIGS, StorageService } from '../services/storage';
import { Building2, Users, ArrowRight, ShieldCheck, Phone, MapPin } from 'lucide-react';

interface HostelSelectorProps {
  onSelectHostel: (hostelId: HostelType) => void;
  onLogout: () => void;
}

export const HostelSelector: React.FC<HostelSelectorProps> = ({
  onSelectHostel,
  onLogout,
}) => {
  const mensConfig = StorageService.getHostelConfig('tlnr_mens');
  const womensConfig = StorageService.getHostelConfig('bhagya_lakshmi_womens');

  const mensResidents = StorageService.getResidents('tlnr_mens');
  const womensResidents = StorageService.getResidents('bhagya_lakshmi_womens');

  const mensPayments = StorageService.getPayments('tlnr_mens');
  const womensPayments = StorageService.getPayments('bhagya_lakshmi_womens');

  // Men's stats
  const mensActiveCount = mensResidents.filter((r) => r.status === 'Active').length;
  const mensVacancy = Math.max(0, mensConfig.totalBeds - mensActiveCount);
  const mensVacancyRate = mensConfig.totalBeds > 0
    ? ((mensVacancy / mensConfig.totalBeds) * 100).toFixed(0)
    : '0';
  const mensTotalCollected = mensPayments.reduce((s, p) => s + (p.amountReceived || 0), 0);

  // Women's stats
  const womensActiveCount = womensResidents.filter((r) => r.status === 'Active').length;
  const womensVacancy = Math.max(0, womensConfig.totalBeds - womensActiveCount);
  const womensVacancyRate = womensConfig.totalBeds > 0
    ? ((womensVacancy / womensConfig.totalBeds) * 100).toFixed(0)
    : '0';
  const womensTotalCollected = womensPayments.reduce((s, p) => s + (p.amountReceived || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4a0e4e] flex items-center justify-center text-white font-bold shadow-sm">
              HMS
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Hostel Administration Portal
              </h1>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Authorized Host: dudduelisha7@gmail.com</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <ShieldCheck className="w-3 h-3" /> Encrypted Vault
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-300 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Select Hostel Property Dashboard
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Manage residents, fee collections, receipts, grocery & power investments, and generate Word format monthly reports.
          </p>
        </div>

        {/* The Two CSS Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: TLNR MEN'S PG */}
          <div
            onClick={() => onSelectHostel('tlnr_mens')}
            className="group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-[#4a0e4e] p-7 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#4a0e4e] flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 bg-purple-100 text-[#4a0e4e] rounded-md uppercase tracking-wider">
                  Men's Branch
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#4a0e4e] transition-colors">
                {HOSTEL_CONFIGS.tlnr_mens.name}
              </h3>

              <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{HOSTEL_CONFIGS.tlnr_mens.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Owner: {HOSTEL_CONFIGS.tlnr_mens.ownerName} ({HOSTEL_CONFIGS.tlnr_mens.phone1})
                  </span>
                </div>
              </div>

              {/* Snapshot Metrics */}
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Residents</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                    {mensActiveCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Vacant Beds</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                    {mensVacancy}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Vacancy Rate</div>
                  <div className="text-lg font-bold text-purple-700 font-mono tabular-nums">
                    {mensVacancyRate}%
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                className="w-full py-3 px-4 bg-[#4a0e4e] hover:bg-[#380b3b] text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 group-hover:gap-3 transition-all cursor-pointer"
              >
                <span>Navigate to Men's PG Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: BHAGYA LAKHSMI WOMEN'S PG */}
          <div
            onClick={() => onSelectHostel('bhagya_lakshmi_womens')}
            className="group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-[#86198f] p-7 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#86198f] flex items-center justify-center border border-pink-100 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 bg-pink-100 text-[#86198f] rounded-md uppercase tracking-wider">
                  Women's Branch
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#86198f] transition-colors">
                {HOSTEL_CONFIGS.bhagya_lakshmi_womens.name}
              </h3>

              <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{HOSTEL_CONFIGS.bhagya_lakshmi_womens.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Owner: {HOSTEL_CONFIGS.bhagya_lakshmi_womens.ownerName} ({HOSTEL_CONFIGS.bhagya_lakshmi_womens.phone1})
                  </span>
                </div>
              </div>

              {/* Snapshot Metrics */}
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Residents</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                    {womensActiveCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Vacant Beds</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                    {womensVacancy}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Vacancy Rate</div>
                  <div className="text-lg font-bold text-fuchsia-700 font-mono tabular-nums">
                    {womensVacancyRate}%
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                className="w-full py-3 px-4 bg-[#86198f] hover:bg-[#701a75] text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 group-hover:gap-3 transition-all cursor-pointer"
              >
                <span>Navigate to Women's PG Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
